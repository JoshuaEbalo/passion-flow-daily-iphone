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
    var fr = frictionList(profile);
    var maxEffort = 3;
    if (bw === 'very_full' || fr.indexOf('low_energy') >= 0) maxEffort = 1.5;
    else if (bw === 'pretty_full') maxEffort = 2.2;
    else if (bw === 'very_flexible') maxEffort = 3.5;
    if (fr.indexOf('time_pressure') >= 0) maxEffort = Math.min(maxEffort, 2);
    return { maxEffort: maxEffort, bandwidth: bw, timeBucket: getTimeBucket(profile) };
  }

  function passesTimeHardFilter(idea, preferred) {
    if (!preferred || preferred === 'flexible' || preferred === 'any') return true;
    var it = TIME_ORDER[idea.timeEstimate] || 3;
    var pt = TIME_ORDER[preferred] || 4;
    return it <= pt;
  }

  function passesConnectHardFilter(idea, profile) {
    var targets = profile.connectTargets || [];
    if (!targets.length) return true;
    var ideaTargets = idea.connectTargetTags || [];
    if (!ideaTargets.length) return true;
    return ideaTargets.some(function (t) { return targets.indexOf(t) >= 0; });
  }

  function passesHardFilters(idea, profile, ctx) {
    var cat = ctx.categoryId || idea.categoryId;
    if (!passesTimeHardFilter(idea, getTimeBucket(profile))) return false;
    if (cat === 'connect' && !passesConnectHardFilter(idea, profile)) return false;
    return true;
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

  function overlapScore(arr, tags, weight) {
    weight = weight || 3;
    if (!arr || !arr.length || !tags || !tags.length) return 0;
    var s = 0;
    arr.forEach(function (a) {
      if (tags.indexOf(a) >= 0) s += weight;
    });
    return s;
  }

  function recommendationThemeKey(idea, profile, categoryId) {
    var cat = categoryId || idea.categoryId;
    if (cat === 'connect') {
      var t = (idea.connectTargetTags && idea.connectTargetTags[0]) || 'any';
      var s = (idea.connectionStyleTags && idea.connectionStyleTags[0]) || 'generic';
      if (/walk|run|active|move|workout/.test((idea.text || '').toLowerCase())) s += '_active';
      else if (/café|coffee|food|restaurant|treat|eat/.test((idea.text || '').toLowerCase())) s += '_food';
      else if (/cozy|movie|night in/.test((idea.text || '').toLowerCase())) s += '_cozy';
      else if (/conversation|talk|deep/.test((idea.text || '').toLowerCase())) s += '_talk';
      return t + ':' + s;
    }
    if (cat === 'move') {
      var mt = (idea.moveTypeTags && idea.moveTypeTags[0]) || 'move';
      var mf = (idea.moveFeelingTags && idea.moveFeelingTags[0]) || 'feel';
      return mt + ':' + mf;
    }
    if (cat === 'create') {
      var ci = (idea.createInterestTags && idea.createInterestTags[0]) || 'create';
      if (idea.productivityHeavy) ci += '_work';
      return ci;
    }
    if (cat === 'learn') {
      return ((idea.mindsetFormatTags && idea.mindsetFormatTags[0]) || 'mindset') + ':' +
        ((idea.mindsetNeedTags && idea.mindsetNeedTags[0]) || 'need');
    }
    if (cat === 'nourish') {
      return (idea.resetStyleTags && idea.resetStyleTags[0]) || 'reset';
    }
    return idea.id;
  }

  function frictionModifier(idea, frictions, categoryId) {
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
      if (idea.productivityHeavy) s -= 6;
      if (categoryId === 'create' && idea.productivityHeavy) s -= 3;
      if (categoryId === 'create' && !idea.productivityHeavy && (idea.noveltyLevel >= 1 || idea.offline)) s += 2;
      if (categoryId !== 'create' && !idea.productivityHeavy) s += 1;
    }
    if (frictions.indexOf('choice_overload') >= 0) {
      if (idea.effortScore > 2.5) s -= 3;
      if (idea.effortScore <= 1.5) s += 2;
    }
    if (frictions.indexOf('activation_difficulty') >= 0 && idea.effortScore <= 1.5) s += 3;
    if (frictions.indexOf('low_energy') >= 0 && idea.effortScore > 2) s -= 5;
    if (frictions.indexOf('repetitive_days') >= 0 && idea.noveltyLevel >= 2) s += 4;
    if (frictions.indexOf('self_neglect') >= 0 || frictions.indexOf('others_first') >= 0) {
      if (idea.resetStyleTags && idea.resetStyleTags.indexOf('self_care') >= 0) s += 2;
      if (categoryId === 'nourish') s += 2;
    }
    if (frictions.indexOf('lack_direction') >= 0) {
      if (idea.noveltyLevel >= 2) s += 2;
      if ((idea.mindsetNeedTags || []).indexOf('direction') >= 0 || /learn|curious|explore|new/.test((idea.text || '').toLowerCase())) s += 2;
    }
    if (frictions.indexOf('overthinking') >= 0 && categoryId === 'learn') s += 1;
    return s;
  }

  function goalModifier(idea, goals, categoryId) {
    var s = overlapScore(goals, idea.overallGoalTags || idea.goalTags, 3);
    if (goals.indexOf('less_screen_time') >= 0) {
      if (idea.offline) s += 4;
      if (/phone|screen|scroll|netflix|social media/.test((idea.text || '').toLowerCase()) && !idea.offline) s -= 3;
    }
    if (goals.indexOf('movement_energy') >= 0 && categoryId === 'move') s += 2;
    if (goals.indexOf('deeper_relationships') >= 0 && categoryId === 'connect') s += 2;
    if (goals.indexOf('peace_presence') >= 0 && (categoryId === 'learn' || categoryId === 'nourish')) s += 2;
    if (goals.indexOf('fun_novelty') >= 0 && idea.noveltyLevel >= 2) s += 2;
    return s;
  }

  function scoreIdea(idea, profile, ctx) {
    if (!passesHardFilters(idea, profile, ctx)) return -9999;

    var score = 0;
    var fr = frictionList(profile);
    var cat = ctx.categoryId || idea.categoryId;
    var goals = profile.overallGoals || [];

    score += goalModifier(idea, goals, cat);
    score += frictionModifier(idea, fr, cat);
    score += timeFitScore(idea.timeEstimate, getTimeBucket(profile));

    if (cat === 'create') {
      score += overlapScore(profile.createInterests, idea.createInterestTags || [], 4);
      score += overlapScore(profile.createMusicSubtypes, idea.createSubtypeTags || [], 3);
      score += overlapScore(profile.createArtSubtypes, idea.createSubtypeTags || [], 3);
      if ((profile.createInterests || []).indexOf('building_business') >= 0 && idea.productivityHeavy) score += 2;
      var buildType = profile.createBuildingType;
      if (buildType && (profile.createInterests || []).indexOf('building_business') >= 0) {
        if (buildType === 'own_business' || buildType === 'side_hustle' || buildType === 'career_goal') {
          if (idea.productivityHeavy) score += 2;
        } else if (buildType === 'personal_project' || buildType === 'new_skill') {
          if (!idea.productivityHeavy) score += 1;
        }
      }
    }
    if (cat === 'learn') {
      score += overlapScore(profile.mindsetNeeds, idea.mindsetNeedTags || [], 4);
      score += overlapScore(profile.mindsetFormats, idea.mindsetFormatTags || [], 4);
    }
    if (cat === 'connect') {
      score += overlapScore(profile.connectTargets, idea.connectTargetTags || [], 5);
      score += overlapScore(profile.partnerConnectionStyles, idea.connectionStyleTags || [], 4);
      score += overlapScore(profile.friendConnectionStyles, idea.connectionStyleTags || [], 4);
      score += overlapScore(profile.familyConnectionStyles, idea.connectionStyleTags || [], 4);
      score += overlapScore(profile.communityConnectionStyles, idea.connectionStyleTags || [], 4);
    }
    if (cat === 'move') {
      score += overlapScore(profile.movePreferences, idea.moveTypeTags || [], 4);
      score += overlapScore(profile.moveDesiredFeelings, idea.moveFeelingTags || [], 4);
    }
    if (cat === 'nourish') {
      score += overlapScore(profile.resetStyles, idea.resetStyleTags || [], 5);
    }

    if (idea.effortScore > dayBudget(profile).maxEffort) score -= 8;

    /* Life context: optional, lightly weighted — bandwidth/time drive fit much more */
    score += overlapScore(profile.lifeContext, idea.lifeContextTags || [], 1);

    var exclude = ctx.excludeTexts || [];
    var excludeIds = ctx.excludeIds || [];
    if (exclude.indexOf(idea.text) >= 0 || excludeIds.indexOf(idea.id) >= 0) return -9999;
    if (ctx.deleted && ctx.deleted.indexOf(idea.text) >= 0) return -9999;
    if (ctx.selected && ctx.selected.indexOf(idea.text) >= 0) return -9999;

    var theme = recommendationThemeKey(idea, profile, cat);
    if (ctx.excludeThemes && ctx.excludeThemes.indexOf(theme) >= 0) {
      score -= ctx.shuffleMode ? 18 : 8;
    }
    if (ctx.recentShown && ctx.recentShown.indexOf(idea.id) >= 0) score -= ctx.shuffleMode ? 2 : 5;
    if (ctx.recentCompleted && ctx.recentCompleted.indexOf(idea.id) >= 0) score -= 6;
    if (ctx.saved && ctx.saved.indexOf(idea.text) >= 0) score += 3;

    score += Math.random() * 1.5;
    return score;
  }

  function filterCandidates(index, categoryId) {
    return (index || []).filter(function (i) { return i.categoryId === categoryId; });
  }

  function pickFromPool(pool, profile, ctx, count, opts) {
    count = count || 1;
    opts = opts || {};
    var shuffle = !!ctx.shuffleMode;
    var topN = ctx.topN || opts.topN || (shuffle ? 40 : Math.max(8, count * 3));
    var scored = pool.map(function (idea) {
      return { idea: idea, score: scoreIdea(idea, profile, ctx) };
    }).filter(function (x) { return x.score > -100; });
    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.slice(0, topN);
    var picks = [];
    var used = (ctx.excludeIds || []).slice();
    var usedText = (ctx.excludeTexts || []).slice();
    var usedThemes = (ctx.excludeThemes || []).slice();
    var pickWindow = shuffle ? Math.min(top.length, topN) : Math.min(top.length, 8);
    for (var n = 0; n < count && top.length; n++) {
      var idx = Math.floor(Math.random() * Math.max(1, pickWindow));
      var chosen = top.splice(idx, 1)[0];
      if (!chosen) break;
      picks.push(chosen.idea);
      used.push(chosen.idea.id);
      usedText.push(chosen.idea.text);
      usedThemes.push(recommendationThemeKey(chosen.idea, profile, ctx.categoryId));
      ctx = Object.assign({}, ctx, { excludeIds: used, excludeTexts: usedText, excludeThemes: usedThemes });
      if (!shuffle) {
        top = top.map(function (x) {
          return { idea: x.idea, score: scoreIdea(x.idea, profile, ctx) };
        }).filter(function (x) { return x.score > -100; });
      }
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
    pickFromPool: pickFromPool,
    recommendationThemeKey: recommendationThemeKey,
    passesHardFilters: passesHardFilters
  };
})(window);
