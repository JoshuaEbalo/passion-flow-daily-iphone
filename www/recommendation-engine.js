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

  function hasTagOverlap(prefs, tags) {
    if (!prefs || !prefs.length) return true;
    if (!tags || !tags.length) return false;
    return prefs.some(function (p) { return tags.indexOf(p) >= 0; });
  }

  function passesConnectHardFilter(idea, profile) {
    return hasTagOverlap(profile.connectTargets, idea.connectTargetTags);
  }

  function passesCreateHardFilter(idea, profile) {
    var interests = profile.createInterests || [];
    if (!interests.length) return true;
    return interests.indexOf(primaryCreateInterest(idea, profile)) >= 0;
  }

  function passesLearnHardFilter(idea, profile) {
    var formats = profile.mindsetFormats || [];
    var needs = profile.mindsetNeeds || [];
    if (formats.length) return formats.indexOf(primaryMindsetFormat(idea, profile)) >= 0;
    if (needs.length) return hasTagOverlap(needs, idea.mindsetNeedTags);
    return true;
  }

  function passesMoveHardFilter(idea, profile) {
    return hasTagOverlap(profile.movePreferences, idea.moveTypeTags);
  }

  function primaryResetStyle(idea) {
    var pack = idea && idea.packId;
    var tag = (idea && idea.tag) || '';
    var text = ((idea && idea.text) || '').toLowerCase();
    if (pack === 'nourish-body') return 'nourishing_reset';
    if (pack === 'digital-detox') return 'offline_reset';
    if (pack === 'home-reset') return 'space_reset';
    if (pack === 'self-care') {
      if (tag === 'Rest') return 'rest_reset';
      if (tag === 'Nature') return 'nature_reset';
      return 'self_care';
    }
    if (pack === 'solo-side-quests') {
      if (tag === 'Nature') return 'nature_reset';
      if (tag === 'Movement' && /hike|garden|sunset|sunrise|beach|nature|outside|trail|park|ocean|lake/.test(text)) {
        return 'nature_reset';
      }
      return 'solo_reset';
    }
    var tags = (idea && idea.resetStyleTags) || [];
    if (tags.indexOf('rest_reset') >= 0 && tag === 'Rest') return 'rest_reset';
    if (tags.indexOf('nature_reset') >= 0 && (tag === 'Nature' || /outside|sun|nature/.test(text))) return 'nature_reset';
    return tags[0] || 'self_care';
  }

  function primaryCreateInterest(idea, profile) {
    var pack = idea && idea.packId;
    var tag = (idea && idea.tag) || '';
    var text = ((idea && idea.text) || '').toLowerCase();
    var prefs = (profile && profile.createInterests) || [];
    if (/chapter|poem|lyrics|letter to|journal/.test(text) && prefs.indexOf('writing') >= 0) return 'writing';
    if (tag === 'Fashion' || tag === 'Beauty') return 'fashion_beauty';
    if (tag === 'Photography' || (/\b(photo|photograph|camera|time-lapse)\b/.test(text) && pack !== 'build-something' && pack !== 'creative-expression')) return 'photography';
    if (tag === 'Cooking' || (pack === 'learn-a-skill' && /cook|bake|recipe|fridge|cocktail|sourdough|pasta|sushi/.test(text))) return 'cooking_baking';
    if (tag === 'Music' || tag === 'Instrument' || /djing|instrument|playlist|song by ear|singing|guitar|ukulele|music theory/.test(text)) return 'music';
    if (tag === 'Portfolio' || tag === 'Content' || /content calendar|behind-the-scenes|social media account/.test(text)) return 'content_creation';
    if (pack === 'build-something' || pack === 'dream-projects') {
      if (tag === 'DIY Projects') return 'diy_design';
      if (tag === 'Portfolio' || tag === 'Content') return 'content_creation';
      return 'building_business';
    }
    var tagMap = {
      Art: 'art_crafts', Crafts: 'art_crafts', Drawing: 'art_crafts', Make: 'art_crafts',
      Writing: 'writing', Write: 'writing',
      Photography: 'photography',
      Music: 'music', Instrument: 'music', Dance: 'music',
      Cooking: 'cooking_baking',
      Fashion: 'fashion_beauty', Beauty: 'fashion_beauty',
      DIY: 'diy_design', Design: 'diy_design', 'DIY Projects': 'diy_design',
      Explore: 'creative_discovery', Language: 'creative_discovery',
      Portfolio: 'content_creation', Content: 'content_creation',
      Build: 'building_business', Code: 'building_business', Launch: 'building_business',
      Vision: 'building_business', Planning: 'building_business', Building: 'building_business'
    };
    if (tagMap[tag]) return tagMap[tag];
    var tags = (idea && idea.createInterestTags) || [];
    var i;
    for (i = 0; i < prefs.length; i++) {
      if (tags.indexOf(prefs[i]) >= 0) return prefs[i];
    }
    return tags[0] || 'creative_discovery';
  }

  function primaryMindsetFormat(idea, profile) {
    var pack = idea && idea.packId;
    var tag = (idea && idea.tag) || '';
    var text = ((idea && idea.text) || '').toLowerCase();
    if (pack === 'mindfulness') return 'mindfulness';
    if (pack === 'learn-expand') {
      if (tag === 'Reading') return 'books';
      if (tag === 'Podcasts') return 'podcasts';
      if (tag === 'Video') return 'videos';
      if (tag === 'Documentary') return 'documentaries';
      if (tag === 'Research') return 'articles';
      if (tag === 'Study') return 'learning';
    }
    if (pack === 'reflect') {
      if (tag === 'Journaling') return 'journaling';
      return 'reflection_prompts';
    }
    if (pack === 'gratitude') return 'journaling';
    if (pack === 'personal-growth') {
      if (/\b(book|biography|10 pages of reading)\b/.test(text)) return 'books';
      if (tag === 'Habits') return 'learning';
      return 'reflection_prompts';
    }
    var prefs = (profile && profile.mindsetFormats) || [];
    var tags = (idea && idea.mindsetFormatTags) || [];
    var order = ['documentaries', 'podcasts', 'videos', 'books', 'journaling', 'mindfulness', 'articles', 'reflection_prompts', 'learning'];
    var i;
    for (i = 0; i < order.length; i++) {
      if (prefs.indexOf(order[i]) >= 0 && tags.indexOf(order[i]) >= 0) return order[i];
    }
    for (i = 0; i < order.length; i++) {
      if (tags.indexOf(order[i]) >= 0) return order[i];
    }
    return tags[0] || 'learning';
  }

  function unusedThenLruPrefs(prefs, excludeThemes) {
    if (!prefs || !prefs.length) return { unused: [], used: [] };
    var lastIdx = {};
    (excludeThemes || []).forEach(function (t, i) {
      var key = String(t || '').split(':')[0];
      if (key && prefs.indexOf(key) >= 0) lastIdx[key] = i;
    });
    var unused = prefs.filter(function (p) { return lastIdx[p] == null; });
    var usedPrefs = prefs.filter(function (p) { return lastIdx[p] != null; });
    usedPrefs.sort(function (a, b) { return lastIdx[a] - lastIdx[b]; });
    if (unused.length > 1) {
      var start = Math.floor(Math.random() * unused.length);
      unused = unused.slice(start).concat(unused.slice(0, start));
    }
    return { unused: unused, used: usedPrefs };
  }

  function rotatePrefList(prefs, excludeThemes) {
    var ordered = unusedThenLruPrefs(prefs, excludeThemes);
    return ordered.unused.concat(ordered.used);
  }

  function passesNourishHardFilter(idea, profile) {
    var prefs = profile.resetStyles || [];
    if (!prefs.length) return true;
    return prefs.indexOf(primaryResetStyle(idea)) >= 0;
  }

  function passesHardFilters(idea, profile, ctx) {
    var cat = ctx.categoryId || idea.categoryId;
    if (!ctx.relaxTime && !passesTimeHardFilter(idea, getTimeBucket(profile))) return false;
    if (cat === 'connect' && !passesConnectHardFilter(idea, profile)) return false;
    if (cat === 'create' && !passesCreateHardFilter(idea, profile)) return false;
    if (cat === 'learn' && !passesLearnHardFilter(idea, profile)) return false;
    if (cat === 'move' && !passesMoveHardFilter(idea, profile)) return false;
    if (cat === 'nourish' && !passesNourishHardFilter(idea, profile)) return false;
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
      return primaryCreateInterest(idea, profile);
    }
    if (cat === 'learn') {
      return primaryMindsetFormat(idea, profile);
    }
    if (cat === 'nourish') {
      return primaryResetStyle(idea);
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
      score += overlapScore(profile.createInterests, idea.createInterestTags || [], 10);
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
      score += overlapScore(profile.mindsetNeeds, idea.mindsetNeedTags || [], 6);
      score += overlapScore(profile.mindsetFormats, idea.mindsetFormatTags || [], 10);
    }
    if (cat === 'connect') {
      score += overlapScore(profile.connectTargets, idea.connectTargetTags || [], 5);
      score += overlapScore(profile.partnerConnectionStyles, idea.connectionStyleTags || [], 4);
      score += overlapScore(profile.friendConnectionStyles, idea.connectionStyleTags || [], 4);
      score += overlapScore(profile.familyConnectionStyles, idea.connectionStyleTags || [], 4);
      score += overlapScore(profile.communityConnectionStyles, idea.connectionStyleTags || [], 4);
    }
    if (cat === 'move') {
      score += overlapScore(profile.movePreferences, idea.moveTypeTags || [], 10);
      score += overlapScore(profile.moveDesiredFeelings, idea.moveFeelingTags || [], 3);
    }
    if (cat === 'nourish') {
      score += overlapScore(profile.resetStyles, idea.resetStyleTags || [], 10);
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
    if (ctx.recentShown && ctx.recentShown.indexOf(idea.id) >= 0) return -9999;
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
    var strictPrefs = (ctx.categoryId === 'move' && (profile.movePreferences || []).length) ||
      (ctx.categoryId === 'create' && (profile.createInterests || []).length) ||
      (ctx.categoryId === 'connect' && (profile.connectTargets || []).length) ||
      (ctx.categoryId === 'nourish' && (profile.resetStyles || []).length) ||
      (ctx.categoryId === 'learn' && ((profile.mindsetFormats || []).length || (profile.mindsetNeeds || []).length));
    var pickWindow = shuffle ? Math.min(top.length, Math.max(6, count * 3)) : Math.min(top.length, strictPrefs ? 4 : 8);
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

  function pickFromPrefSubset(pool, profile, ctx, prefs, matchFn) {
    var ordered = unusedThenLruPrefs(prefs, ctx.excludeThemes);
    var unused = ordered.unused;
    var usedPrefs = ordered.used;
    function tryList(list, extraCtx) {
      var tryCtx = Object.assign({}, ctx, extraCtx || {});
      var i, subset, picks;
      for (i = 0; i < list.length; i++) {
        subset = pool.filter(function (idea) { return matchFn(idea, list[i]); });
        if (!subset.length) continue;
        picks = pickFromPool(subset, profile, tryCtx, 1);
        if (picks[0]) return picks[0];
      }
      return null;
    }
    var pick = tryList(unused);
    if (pick) return pick;
    pick = tryList(unused, { relaxTime: true });
    if (pick) return pick;
    pick = tryList(unused, { relaxTime: true, excludeIds: [], recentShown: [] });
    if (pick) return pick;
    pick = tryList(usedPrefs, { relaxTime: true });
    if (pick) return pick;
    return tryList(prefs, { relaxTime: true, excludeIds: [], recentShown: [] });
  }

  function pickForCategory(categoryId, profile, ctx) {
    var index = global.pfdIdeaIndex || [];
    var pool = filterCandidates(index, categoryId);
    if (!pool.length) return null;
    ctx = Object.assign({ categoryId: categoryId }, ctx || {});
    var pick = null;
    if (categoryId === 'nourish' && (profile.resetStyles || []).length) {
      pick = pickFromPrefSubset(pool, profile, ctx, profile.resetStyles, function (idea, style) {
        return primaryResetStyle(idea) === style;
      });
    } else if (categoryId === 'learn' && (profile.mindsetFormats || []).length) {
      pick = pickFromPrefSubset(pool, profile, ctx, profile.mindsetFormats, function (idea, format) {
        return primaryMindsetFormat(idea, profile) === format;
      });
    } else if (categoryId === 'create' && (profile.createInterests || []).length) {
      pick = pickFromPrefSubset(pool, profile, ctx, profile.createInterests, function (idea, interest) {
        return primaryCreateInterest(idea, profile) === interest;
      });
    }
    if (pick) return pick;
    var picks = pickFromPool(pool, profile, ctx, 1);
    if (picks[0]) return picks[0];
    picks = pickFromPool(pool, profile, Object.assign({}, ctx, { relaxTime: true }), 1);
    return picks[0] || null;
  }

  function planMyDay(profile, ctx) {
    ctx = ctx || {};
    var shuffle = !!ctx.shuffleMode;
    var cats = global.PFDConstants ? global.PFDConstants.CATEGORY_IDS.slice() : ['create', 'learn', 'connect', 'move', 'nourish'];
    var plan = {};
    var excludeIds = [];
    var excludeTexts = [];
    cats.forEach(function (cat) {
      var pick = pickForCategory(cat, profile, Object.assign({}, ctx, {
        categoryId: cat,
        excludeIds: excludeIds.slice(),
        excludeTexts: excludeTexts.slice(),
        shuffleMode: shuffle,
        topN: ctx.topN || (shuffle ? 50 : undefined)
      }));
      if (pick) {
        plan[cat] = pick;
        excludeIds.push(pick.id);
        excludeTexts.push(pick.text);
      }
    });
    cats.forEach(function (cat) {
      if (plan[cat]) return;
      var retry = pickForCategory(cat, profile, Object.assign({}, ctx, {
        categoryId: cat,
        excludeIds: excludeIds.slice(),
        excludeTexts: excludeTexts.slice(),
        shuffleMode: true,
        relaxTime: true,
        recentShown: []
      }));
      if (retry) {
        plan[cat] = retry;
        excludeIds.push(retry.id);
        excludeTexts.push(retry.text);
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
    primaryResetStyle: primaryResetStyle,
    primaryMindsetFormat: primaryMindsetFormat,
    primaryCreateInterest: primaryCreateInterest,
    passesHardFilters: passesHardFilters,
    hasTagOverlap: hasTagOverlap
  };
})(window);
