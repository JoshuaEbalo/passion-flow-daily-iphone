/**
 * Passion Flow Daily — recommendation scorer (no AI)
 */
(function (global) {
  var TIME_ORDER = { micro: 1, short: 2, medium: 3, flexible: 4, '5-10': 1, '15-30': 2, '30-60': 3, any: 4 };

  function getTimeBucket(profile) {
    return profile.defaultTimeBucket || profile.preferredTime || 'flexible';
  }

  function frictionList(profile) {
    return profile.coreFrictions || [];
  }

  function dayBudget(profile) {
    var bw = profile.dayBandwidth || 'balanced';
    var tb = getTimeBucket(profile);
    var fr = frictionList(profile);
    var maxEffort = 3;
    if (bw === 'very_full' || fr.indexOf('low_energy') >= 0) maxEffort = 1.5;
    else if (bw === 'pretty_full') maxEffort = 2.2;
    else if (bw === 'very_flexible') maxEffort = 3.5;
    if (fr.indexOf('time_pressure') >= 0) maxEffort = Math.min(maxEffort, 2);
    return { maxEffort: maxEffort, bandwidth: bw, timeBucket: tb };
  }

  function timeFitScore(ideaTime, preferred) {
    var it = TIME_ORDER[ideaTime] || 3;
    var pt = TIME_ORDER[preferred] || 4;
    if (preferred === 'flexible' || preferred === 'any') return 2;
    if (it === pt) return 4;
    if (Math.abs(it - pt) === 1) return 2;
    if (it > pt) return -3;
    return 1;
  }

  function overlapScore(arr, tags) {
    if (!arr || !arr.length || !tags || !tags.length) return 0;
    var s = 0;
    arr.forEach(function (a) {
      if (tags.indexOf(a) >= 0) s += 3;
    });
    return s;
  }

  function frictionModifier(idea, frictions) {
    if (!frictions.length) return 0;
    var s = 0;
    var h = idea.helpfulForFrictions || [];
    frictions.forEach(function (f) {
      if (h.indexOf(f) >= 0) s += 4;
    });
    if (frictions.indexOf('phone_overuse') >= 0) {
      if (idea.offline) s += 3;
      if ((idea.text || '').toLowerCase().indexOf('phone') >= 0 && (idea.text || '').indexOf('away') < 0) s -= 4;
    }
    if (frictions.indexOf('work_switch_off') >= 0) {
      if (idea.productivityHeavy) s -= 5;
      if (idea.goalTags && idea.goalTags.indexOf('growth') >= 0 && idea.categoryId !== 'create') s -= 2;
    }
    if (frictions.indexOf('choice_overload') >= 0 && idea.effortScore > 2.5) s -= 2;
    if (frictions.indexOf('low_energy') >= 0 && idea.effortScore > 2) s -= 4;
    if (frictions.indexOf('repetitive_days') >= 0 && idea.noveltyLevel >= 2) s += 3;
    if (frictions.indexOf('self_neglect') >= 0 || frictions.indexOf('others_first') >= 0) {
      if (idea.resetStyleTags && idea.resetStyleTags.indexOf('self_care') >= 0) s += 2;
    }
    return s;
  }

  function scoreIdea(idea, profile, ctx) {
    var score = 0;
    var fr = frictionList(profile);
    var cat = ctx.categoryId || idea.categoryId;

    score += overlapScore(profile.overallGoals, idea.overallGoalTags || idea.goalTags);
    score += frictionModifier(idea, fr);
    score += timeFitScore(idea.timeEstimate, getTimeBucket(profile));

    if (cat === 'create') {
      score += overlapScore(profile.createInterests, idea.createInterestTags || []);
      score += overlapScore(profile.createMusicSubtypes, idea.createSubtypeTags || []);
      score += overlapScore(profile.createArtSubtypes, idea.createSubtypeTags || []);
    }
    if (cat === 'learn') {
      score += overlapScore(profile.mindsetNeeds, idea.mindsetNeedTags || []) * 0.6;
      score += overlapScore(profile.mindsetFormats, idea.mindsetFormatTags || []);
    }
    if (cat === 'connect') {
      score += overlapScore(profile.connectTargets, idea.connectTargetTags || []);
      score += overlapScore(profile.partnerConnectionStyles, idea.connectionStyleTags || []);
      score += overlapScore(profile.friendConnectionStyles, idea.connectionStyleTags || []);
    }
    if (cat === 'move') {
      score += overlapScore(profile.movePreferences, idea.moveTypeTags || []);
      score += overlapScore(profile.moveDesiredFeelings, idea.moveFeelingTags || []);
    }
    if (cat === 'nourish') {
      score += overlapScore(profile.resetStyles, idea.resetStyleTags || []);
    }

    if (idea.effortScore > dayBudget(profile).maxEffort) score -= 6;

    var exclude = ctx.excludeTexts || [];
    var excludeIds = ctx.excludeIds || [];
    if (exclude.indexOf(idea.text) >= 0 || excludeIds.indexOf(idea.id) >= 0) return -9999;
    if (ctx.deleted && ctx.deleted.indexOf(idea.text) >= 0) return -9999;
    if (ctx.selected && ctx.selected.indexOf(idea.text) >= 0) return -9999;
    if (ctx.recentShown && ctx.recentShown.indexOf(idea.id) >= 0) score -= 5;
    if (ctx.recentCompleted && ctx.recentCompleted.indexOf(idea.id) >= 0) score -= 6;
    if (ctx.saved && ctx.saved.indexOf(idea.text) >= 0) score += 4;

    score += Math.random() * 1.5;
    return score;
  }

  function filterCandidates(index, categoryId) {
    return (index || []).filter(function (i) { return i.categoryId === categoryId; });
  }

  function pickFromPool(pool, profile, ctx, count) {
    count = count || 1;
    var scored = pool.map(function (idea) {
      return { idea: idea, score: scoreIdea(idea, profile, ctx) };
    }).filter(function (x) { return x.score > -100; });
    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.slice(0, Math.max(5, count * 3));
    var picks = [];
    var used = (ctx.excludeIds || []).slice();
    var usedText = (ctx.excludeTexts || []).slice();
    for (var n = 0; n < count && top.length; n++) {
      var idx = Math.floor(Math.random() * Math.min(top.length, 5));
      var chosen = top.splice(idx, 1)[0];
      if (!chosen) break;
      picks.push(chosen.idea);
      used.push(chosen.idea.id);
      usedText.push(chosen.idea.text);
      ctx = Object.assign({}, ctx, { excludeIds: used, excludeTexts: usedText });
      top = top.map(function (x) {
        return { idea: x.idea, score: scoreIdea(x.idea, profile, ctx) };
      }).filter(function (x) { return x.score > -100; });
    }
    return picks;
  }

  function pickForCategory(categoryId, profile, ctx) {
    var index = global.pfdIdeaIndex || [];
    var pool = filterCandidates(index, categoryId);
    if (!pool.length) return null;
    ctx = Object.assign({ categoryId: categoryId }, ctx || {});
    var picks = pickFromPool(pool, profile, ctx, 1);
    return picks[0] || null;
  }

  function planMyDay(profile, ctx) {
    var cats = global.PFDConstants ? global.PFDConstants.CATEGORY_IDS.slice() : ['create', 'learn', 'connect', 'move', 'nourish'];
    var plan = {};
    var excludeIds = [];
    var excludeTexts = [];
    cats.forEach(function (cat) {
      var pick = pickForCategory(cat, profile, Object.assign({}, ctx, {
        categoryId: cat,
        excludeIds: excludeIds.slice(),
        excludeTexts: excludeTexts.slice()
      }));
      if (pick) {
        plan[cat] = pick;
        excludeIds.push(pick.id);
        excludeTexts.push(pick.text);
      }
    });
    if (global.PFDPlanCoherence && global.PFDPlanCoherence.refinePlan) {
      plan = global.PFDPlanCoherence.refinePlan(plan, profile, ctx);
    }
    return plan;
  }

  global.PFDRecommendationEngine = {
    scoreIdea: scoreIdea,
    pickForCategory: pickForCategory,
    planMyDay: planMyDay,
    dayBudget: dayBudget,
    pickFromPool: pickFromPool
  };
})(window);
