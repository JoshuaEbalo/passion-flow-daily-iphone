/**
 * Passion Flow Daily — recommendation composer (variants, not suffix spam)
 */
(function (global) {
  var VARIANTS = {
    walk: [
      'Take a {duration} walk without tracking anything.',
      'Step outside for {duration} with nowhere specific to get to.',
      'Leave your phone in your pocket and walk until you notice three things you normally miss.'
    ],
    walk_calm: [
      'Take a slow {duration} walk without tracking anything. Let movement be the break, not another thing to optimize.',
      'Go for an easy walk with no pace goal, just enough to change how your body feels.'
    ],
    walk_novelty: [
      'Walk somewhere busier or different than your usual route for about {duration}.',
      'Take a {duration} walk somewhere you do not usually go.'
    ],
    stretch: [
      'Give yourself {duration} of slow stretching somewhere comfortable.',
      'Do {duration} of gentle floor stretching with no performance goal.'
    ],
    dance: [
      'Put on three songs you love and dance through all three.',
      'Move your body to music you enjoy for {duration}, no choreography required.'
    ],
    run: ['{text}'],
    hike: ['{text}'],
    sports_move: ['{text}'],
    strength_move: ['{text}'],
    fitness_move: ['{text}'],
    partner_food: [
      'Ask {partner} to grab something small with you later and keep your phones away while you are there.',
      'Invite {partner} for a quick treat together, phones down for the first 15 minutes.'
    ],
    partner_cozy: [
      'Ask {partner} to make or eat something with you tonight and stay at the table a little longer than usual.',
      'Plan a cozy evening with {partner}, something simple, no phones on the table.'
    ],
    partner_active: [
      'Plan something simple and active with {partner}, a walk, stretch, or easy movement together.',
      'Invite {partner} to join you for something light and physical, nothing intense.'
    ],
    partner_adventure: [
      'Suggest a little adventure with {partner}, somewhere new or slightly outside your usual routine.',
      'Ask {partner} to try one small new thing with you this week.'
    ],
    partner_talk: [
      'Ask {partner} for a real conversation tonight, phones away, even 20 minutes counts.',
      'Check in with {partner} about something you have been meaning to talk about.'
    ],
    friend_food: [
      'Text {friend} and see if they want to grab coffee or food this week.',
      'Ask {friend} to meet you somewhere easy for a catch-up over food or drinks.'
    ],
    friend_active: [
      'Invite {friend} to join you for a walk or something active, even if it is short.',
      'Ask {friend} if they want to move with you, a walk, class, or something low-key.'
    ],
    friend_lowkey: [
      'Send {friend} a voice note instead of waiting until you have time for a full catch-up.',
      'Text {friend} you miss and suggest a low-key hang when you both have a pocket of time.'
    ],
    friend_new: [
      'Ask {friend} to try something new with you, a café, spot, or activity you have not done together.',
      'Invite {friend} on a small adventure, nothing big, just something different.'
    ],
    family_food: [
      'Ask {family} if they want to grab lunch or dinner with you soon.',
      'Suggest a simple meal out or at home with {family}, no agenda needed.'
    ],
    family_lowkey: [
      'Call or text {family} for a real catch-up, not just a quick check-in.',
      'Reach out to {family} and plan something easy together when you can.'
    ],
    community_new: [
      'Say yes to one small social thing this week, even if it feels slightly outside your comfort zone.',
      'Put yourself near people for a bit, a class, event, or casual hang where you might meet someone new.'
    ],
    community_keep: ['{text}'],
    community_named: [
      'Make simple plans with {community} this week, nothing fancy.',
      'Show up for {community} and stay a little longer than usual.',
      'Spend time with {community} without checking your phone the whole time.',
      'Reach out to {community} and set one real hang this week.'
    ],
    partner_keep: ['Do this with {partner}: {text}'],
    friend_keep: ['Do this with {friend}: {text}'],
    family_keep: ['Do this with {family}: {text}'],
    business_contained: [
      'Give {project} {duration}. Improve one small thing you already care about, no competitor research, no new tabs.',
      'Spend {duration} on {project}. One small thing only, no research, no optimizing the whole vision.'
    ],
    business_fun: [
      'Spend {duration} making one small thing for {project} without checking competitors or analytics.',
      'Work on {project} for {duration}, make something imperfect and stop when the timer ends.'
    ],
    create_named: [
      'For {project}: {text}',
      'Use this for {project}: {text}'
    ],
    project_any: [
      'Spend {duration} on {project}. One small next step only.',
      'Work on {project} for {duration}. Make one imperfect thing and stop when the timer ends.',
      'Give {project} {duration}. Do the next tiny step you already know.'
    ],
    create_play: [
      'Spend {duration} making something small with no intention of turning it into anything useful.',
      'Make something messy and just for you for {duration}, no audience, no outcome.'
    ],
    photo_novelty: [
      'Take your camera on a {duration} walk and photograph five things you would normally pass without looking.',
      'Notice five interesting details around you and capture them in {duration}.'
    ],
    mindset_journal: [
      "Write down one decision you keep circling. Finish this sentence once: 'If I didn't need the perfect answer, I'd choose…' Then leave it there.",
      'Journal one thought that keeps looping, one paragraph max, then close the notebook.'
    ],
    mindset_audio: [
      'Listen to one short episode or {duration} of something that makes you curious, not something telling you how to be more productive.',
      'Spend {duration} with a podcast or talk that expands your perspective, not your to-do list.'
    ],
    mindset_learn: [
      'Watch or read something about a topic you know almost nothing about for {duration}.',
      'Learn one new thing for {duration}, curiosity only, no self-improvement agenda.'
    ],
    reset_offline: [
      'Leave your phone in another room and take your time getting ready or winding down for {duration}.',
      'Put your phone away and do something quiet for {duration}, read, color, or sit without extra input.'
    ],
    reset_selfcare: [
      'Take a slow shower or get cozy for {duration}. No podcast, video, or work content while you do.',
      'Give yourself {duration} of unhurried self-care, skincare, cozy clothes, or a long shower.'
    ],
    reset_space: [
      'Put away five things, make something comforting to drink, and call the reset finished.',
      'Tidy one tiny area for {duration}, then stop. No full-home project.'
    ],
    reset_rest: [
      'Slow down for {duration}. Lie down, nap, or do absolutely nothing. That counts.',
      'Give yourself {duration} of real rest with no goal attached.'
    ],
    reset_nature: [
      'Step outside for {duration}. Sunlight, fresh air, somewhere quieter than your usual space.',
      'Go outside for {duration} and let nature do the resetting.'
    ],
    reset_solo: [
      'Take yourself somewhere for {duration}, a café, bookstore, or anywhere that gets you out of your usual loop.',
      'Go somewhere alone for {duration} that feels like a small treat just for you.'
    ],
    generic: [
      '{text}',
      'Try this for {duration}: {text}',
      'Give yourself {duration} for this: {text}'
    ]
  };

  function durationLabel(profile, idea) {
    var tb = profile.defaultTimeBucket || idea.timeEstimate || 'short';
    if (tb === 'micro' || tb === '5-10') return '5–10 minutes';
    if (tb === 'short' || tb === '15-30') return '15 minutes';
    if (tb === 'medium' || tb === '30-60') return '30 minutes';
    return '20 minutes';
  }

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function rotateName(names, seed, fallback) {
    var list = (names || []).map(function (n) { return (n || '').trim(); }).filter(Boolean);
    if (!list.length) return fallback;
    return list[Math.abs(seed) % list.length];
  }

  function partnerLabel(profile, seed) {
    var n = (profile.partnerName || '').trim();
    return n || 'your partner';
  }

  function uniqueTrimmedNames(list) {
    var unique = [];
    (list || []).forEach(function (n) {
      n = (n || '').trim();
      if (n && unique.indexOf(n) < 0) unique.push(n);
    });
    return unique;
  }

  function pickRotatedName(list, pick, fallback) {
    var unique = uniqueTrimmedNames(list);
    if (!unique.length) return fallback;
    var idx = typeof pick === 'number' ? Math.abs(pick) : 0;
    return unique[idx % unique.length];
  }

  function friendLabel(profile, seed) {
    return rotateName(profile.friendNames, seed, 'a friend');
  }

  function familyLabel(profile, seed) {
    return rotateName(profile.familyNames, seed, 'someone in your family');
  }

  var PROJECT_NAME_STOP = { project: 1, projects: 1, my: 1, the: 1, and: 1, for: 1, making: 1, make: 1, a: 1, an: 1, of: 1, thing: 1, things: 1, work: 1, idea: 1, ideas: 1, stuff: 1, new: 1, personal: 1, side: 1 };
  var PROJECT_TYPE_RULES = [
    { re: /sew|quilt|embroider|cross.?stitch/, interests: ['art_crafts'], hints: ['sew', 'quilt', 'fabric', 'alter', 'embroider', 'stitch', 'hem', 'garment'] },
    { re: /knit|crochet/, interests: ['art_crafts'], hints: ['knit', 'crochet', 'yarn'] },
    { re: /pottery|ceramic/, interests: ['art_crafts'], hints: ['pottery', 'ceramic', 'clay'] },
    { re: /jewelr|bead/, interests: ['art_crafts', 'fashion_beauty'], hints: ['jewel', 'bead'] },
    { re: /origami|collage/, interests: ['art_crafts'], hints: ['origami', 'collage'] },
    { re: /paint|watercolor/, interests: ['art_crafts'], hints: ['paint', 'watercolor', 'canvas'] },
    { re: /draw|sketch|illustration/, interests: ['art_crafts'], hints: ['draw', 'sketch', 'illustration'] },
    { re: /\bcrafts?\b/, interests: ['art_crafts'], hints: ['craft'] },
    { re: /\bart\b/, interests: ['art_crafts'], hints: [] },
    { re: /cook|recipe|cookbook|bake|bakery|pastry/, interests: ['cooking_baking'], hints: ['cook', 'recipe', 'bake', 'cookbook', 'pastry'] },
    { re: /photo|photograph|cinema|camera/, interests: ['photography'], hints: ['photo', 'photograph', 'camera'] },
    { re: /\bfilms?\b|\bvlog/, interests: ['photography', 'content_creation'], hints: ['film', 'vlog'] },
    { re: /song|album|music|band|sing|guitar|piano|beat|producer/, interests: ['music'], hints: ['song', 'music', 'sing', 'guitar', 'piano', 'album'] },
    { re: /novel|poem|story|zine|essay|memoir|script/, interests: ['writing'], hints: ['chapter', 'poem', 'story', 'draft', 'script', 'novel', 'essay'] },
    { re: /\bbooks?\b|journal/, interests: ['writing'], hints: ['journal', 'book'] },
    { re: /code|coding|software|saas|\bapps?\b|website|web ?app|program|github|developer/, interests: ['building_business'], hints: ['code', 'coding', 'software', 'website', 'github'] },
    { re: /brand|branding/, interests: ['building_business', 'content_creation'], hints: ['brand', 'logo'] },
    { re: /startup|etsy|\bshop\b|company|store/, interests: ['building_business'], hints: ['startup', 'shop', 'etsy'] },
    { re: /business/, interests: ['building_business'], hints: ['business'] },
    { re: /youtube|tiktok|instagram|newsletter|podcast/, interests: ['content_creation'], hints: ['youtube', 'tiktok', 'instagram', 'newsletter', 'podcast'] },
    { re: /content|channel|creator/, interests: ['content_creation'], hints: ['content', 'channel'] },
    { re: /fashion|outfit|wardrobe|makeup|beauty/, interests: ['fashion_beauty'], hints: ['fashion', 'outfit', 'makeup', 'beauty', 'wardrobe'] },
    { re: /diy|renovat|woodwork|furniture|interior/, interests: ['diy_design'], hints: ['diy', 'furniture', 'renovat', 'woodwork'] },
    { re: /\bdesign\b/, interests: ['diy_design', 'content_creation'], hints: ['design'] }
  ];

  function projectNameWords(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) {
      return w.length > 2 && !PROJECT_NAME_STOP[w];
    });
  }

  function projectAffinities(name) {
    var t = (name || '').toLowerCase();
    var out = [];
    PROJECT_TYPE_RULES.forEach(function (rule) {
      if (!rule.re.test(t)) return;
      rule.interests.forEach(function (id) {
        if (out.indexOf(id) < 0) out.push(id);
      });
    });
    return out;
  }

  function projectHintTokens(name) {
    var t = (name || '').toLowerCase();
    var out = projectNameWords(name);
    PROJECT_TYPE_RULES.forEach(function (rule) {
      if (!rule.re.test(t)) return;
      rule.hints.forEach(function (h) {
        if (out.indexOf(h) < 0) out.push(h);
      });
    });
    return out;
  }

  function ideaTextMatchesProject(idea, name) {
    var text = ((idea && idea.text) || '').toLowerCase();
    if (!text) return false;
    return projectHintTokens(name).some(function (token) {
      return token.length > 2 && text.indexOf(token) >= 0;
    });
  }

  function ideaCreatePrimary(idea, profile) {
    if (global.PFDRecommendationEngine && global.PFDRecommendationEngine.primaryCreateInterest) {
      return global.PFDRecommendationEngine.primaryCreateInterest(idea, profile);
    }
    return ((idea && idea.createInterestTags) || [])[0] || '';
  }

  function isProjectShapedIdea(idea, primary) {
    var text = ((idea && idea.text) || '').toLowerCase();
    if (primary === 'building_business' || primary === 'content_creation') return true;
    if (idea && idea.productivityHeavy) return true;
    return /project|portfolio|chapter|draft|brand|business|newsletter|website|course/.test(text);
  }

  function uniqueProjectNames(profile) {
    var names = (profile.projectNames || []).concat([profile.projectName]).map(function (n) {
      return (n || '').trim();
    }).filter(Boolean);
    var unique = [];
    names.forEach(function (n) { if (unique.indexOf(n) < 0) unique.push(n); });
    return unique;
  }

  function projectMatch(profile, idea, seed) {
    var unique = uniqueProjectNames(profile);
    if (!unique.length) return null;
    var primary = ideaCreatePrimary(idea, profile);
    var interests = profile.createInterests || [];
    var textHits = unique.filter(function (n) { return ideaTextMatchesProject(idea, n); });
    if (textHits.length) {
      return { name: rotateName(textHits, seed, textHits[0]), mode: 'text' };
    }
    var typed = unique.filter(function (n) {
      return projectAffinities(n).indexOf(primary) >= 0;
    });
    if (typed.length) {
      return { name: rotateName(typed, seed, typed[0]), mode: 'generic' };
    }
    var unlabeled = unique.filter(function (n) { return !projectAffinities(n).length; });
    if (!unlabeled.length) return null;
    var canCarryCustom = isProjectShapedIdea(idea, primary) || interests.length === 1;
    if (!canCarryCustom) return null;
    return { name: rotateName(unlabeled, seed, unlabeled[0]), mode: 'generic' };
  }

  function matchingProjectName(profile, idea, seed) {
    var match = projectMatch(profile, idea, seed);
    return match ? match.name : '';
  }

  function projectLabel(profile, seed, idea, opts) {
    opts = opts && typeof opts === 'object' ? opts : { forceProjectName: !!opts };
    var unique = uniqueProjectNames(profile);
    if (opts.forceProjectName && unique.length) {
      var pick = typeof opts.projectNamePick === 'number' ? opts.projectNamePick : Math.abs(seed);
      return unique[Math.abs(pick) % unique.length];
    }
    var matched = matchingProjectName(profile, idea, seed);
    if (matched) return matched;
    return 'your project';
  }

  function hasNamedProject(profile) {
    if ((profile.projectName || '').trim()) return true;
    return (profile.projectNames || []).some(function (n) { return (n || '').trim(); });
  }

  function communityLabel(profile, seed) {
    var fromList = rotateName(profile.communityNames, seed, '');
    if (fromList) return fromList;
    var n = (profile.communityName || '').trim();
    return n || 'your community';
  }

  function hasCommunityName(profile) {
    if ((profile.communityName || '').trim()) return true;
    return (profile.communityNames || []).some(function (n) { return (n || '').trim(); });
  }

  var COMMUNITY_NAME_STOP = { my: 1, the: 1, and: 1, for: 1, a: 1, an: 1, of: 1, our: 1, group: 1, club: 1, team: 1, community: 1, local: 1, coed: 1, 'co-ed': 1 };
  var COMMUNITY_TYPE_RULES = [
    { re: /basketball|soccer|football|volleyball|tennis|pickleball|baseball|softball|hockey|lacrosse|badminton|rugby|cricket|\bsports?\b/, hints: ['sport', 'league', 'game', 'court', 'recreational'] },
    { re: /\brun|\brunning\b|track club/, hints: ['run', 'charity run'] },
    { re: /sew|crochet|knit|quilt|embroider|\bcraft/, hints: ['sew', 'craft', 'clothing', 'yarn'] },
    { re: /book|reading|library/, hints: ['book', 'library', 'read'] },
    { re: /garden|gardening/, hints: ['garden'] },
    { re: /church|faith|bible|mosque|temple|synagogue/, hints: ['faith', 'service'] },
    { re: /yoga|pilates/, hints: ['yoga', 'pilates'] },
    { re: /music|choir|band|\bsing/, hints: ['music', 'choir', 'sing'] },
    { re: /cook|food|kitchen/, hints: ['cook', 'meal', 'food'] }
  ];

  function uniqueCommunityNames(profile) {
    var names = (profile.communityNames || []).concat([profile.communityName]).map(function (n) {
      return (n || '').trim();
    }).filter(Boolean);
    var unique = [];
    names.forEach(function (n) { if (unique.indexOf(n) < 0) unique.push(n); });
    return unique;
  }

  function communityNameWords(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) {
      return w.length > 2 && !COMMUNITY_NAME_STOP[w];
    });
  }

  function communityHintTokens(name) {
    var t = (name || '').toLowerCase();
    var out = communityNameWords(name);
    COMMUNITY_TYPE_RULES.forEach(function (rule) {
      if (!rule.re.test(t)) return;
      rule.hints.forEach(function (h) {
        if (out.indexOf(h) < 0) out.push(h);
      });
    });
    return out;
  }

  function communityHasType(name) {
    var t = (name || '').toLowerCase();
    return COMMUNITY_TYPE_RULES.some(function (rule) { return rule.re.test(t); });
  }

  function ideaTextMatchesCommunity(idea, name) {
    var text = ((idea && idea.text) || '').toLowerCase();
    if (!text) return false;
    return communityHintTokens(name).some(function (token) {
      return token.length > 2 && text.indexOf(token) >= 0;
    });
  }

  function isSoloCommunityAct(idea) {
    var tag = String((idea && idea.tag) || '').toLowerCase();
    if (tag === 'kindness' || tag === 'neighbors' || tag === 'service') return true;
    var t = String((idea && idea.text) || '').toLowerCase();
    if (!t) return true;
    return /pay for the person|random acts of kindness|anonymous|stranger|compliment three|leave a kind|leave fresh flowers|leave a book|leave a glowing review|donate |introduce yourself to a neighbor|handwritten thank|pick up trash|elderly neighbor|cook a meal and deliver|show up for a neighbor|quiet unnoticed job|nod at/.test(t);
  }

  function communityMatch(profile, idea, seed) {
    var unique = uniqueCommunityNames(profile);
    if (!unique.length || !idea) return null;
    if (isSoloCommunityAct(idea)) return null;
    return { name: rotateName(unique, seed, unique[0]), mode: 'hang' };
  }

  var communityNameRotate = 0;
  var friendNameRotate = 0;
  var familyNameRotate = 0;
  function pickCommunityName(profile, pick) {
    var unique = uniqueCommunityNames(profile);
    if (!unique.length) return '';
    var idx = typeof pick === 'number' ? Math.abs(pick) : (communityNameRotate++);
    return unique[idx % unique.length];
  }

  function pickVariant(key, seed) {
    var list = VARIANTS[key] || VARIANTS.generic;
    return list[Math.abs(seed) % list.length];
  }

  function detectFamily(idea, profile, categoryId, opts) {
    opts = opts || {};
    var t = (idea.text || '').toLowerCase();
    var fr = profile.coreFrictions || [];
    var targets = profile.connectTargets || [];
    var styles = profile.partnerConnectionStyles || [];

    if (categoryId === 'move') {
      var moveTags = idea.moveTypeTags || [];
      var movePrefs = profile.movePreferences || [];
      var matchedMove = movePrefs.filter(function (p) { return moveTags.indexOf(p) >= 0; });
      var primaryMove = matchedMove[0] || moveTags[0];
      if (primaryMove === 'dance') return 'dance';
      if (primaryMove === 'walking') {
        if (fr.indexOf('repetitive_days') >= 0) return 'walk_novelty';
        if ((profile.moveDesiredFeelings || []).indexOf('calming') >= 0) return 'walk_calm';
        return 'walk';
      }
      if (primaryMove === 'yoga_stretch') return 'stretch';
      if (primaryMove === 'running') return 'run';
      if (primaryMove === 'hiking') return 'hike';
      if (primaryMove === 'sports') return 'sports_move';
      if (primaryMove === 'strength') return 'strength_move';
      if (primaryMove === 'fitness_classes') return 'fitness_move';
      return 'generic';
    }
    if (categoryId === 'connect') {
      var ideaTargets = idea.connectTargetTags || [];
      var primary = ideaTargets[0] || (targets.indexOf('partner') >= 0 ? 'partner' : targets[0]) || 'friends';
      if (primary === 'partner' || (targets.indexOf('partner') >= 0 && ideaTargets.indexOf('partner') >= 0)) {
        return 'partner_keep';
      }
      if (primary === 'family' || ideaTargets.indexOf('family') >= 0) {
        return 'family_keep';
      }
      if (primary === 'community' || ideaTargets.indexOf('community') >= 0) {
        return communityMatch(profile, idea, hashStr((idea && idea.id) || idea.text || '')) ? 'community_named' : 'community_keep';
      }
      if (primary === 'friends' || ideaTargets.indexOf('friends') >= 0) return 'friend_keep';
      return 'generic';
    }
    if (categoryId === 'create') {
      if (opts.skipProjectName) return 'generic';
      var match = projectMatch(profile, idea, hashStr((idea && idea.id) || idea.text || ''));
      if (match && match.mode === 'text') return 'create_named';
      if ((match || opts.forceProjectName) && (profile.createInterests || []).indexOf('building_business') >= 0 && idea.productivityHeavy) {
        if (fr.indexOf('work_switch_off') >= 0) return 'business_contained';
        return 'business_fun';
      }
      if (match) return 'project_any';
      if (opts.forceProjectName && hasNamedProject(profile)) return 'project_any';
      return 'generic';
    }
    if (categoryId === 'learn') {
      return 'generic';
    }
    if (categoryId === 'nourish') {
      return 'generic';
    }
    return 'generic';
  }

  function fillTemplate(tpl, profile, idea, seed, opts) {
    seed = seed || hashStr(idea.id + (profile.updatedAt || ''));
    opts = opts || {};
    return tpl
      .replace(/\{duration\}/g, durationLabel(profile, idea))
      .replace(/\{partner\}/g, partnerLabel(profile, seed))
      .replace(/\{friend\}/g, (opts && opts.friendName) || friendLabel(profile, seed))
      .replace(/\{family\}/g, (opts && opts.familyName) || familyLabel(profile, seed))
      .replace(/\{community\}/g, (opts && opts.communityName) || (communityMatch(profile, idea, seed) || {}).name || communityLabel(profile, seed))
      .replace(/\{project\}/g, projectLabel(profile, seed, idea, opts))
      .replace(/\{text\}/g, idea.text || '');
  }

  function reasonLine(profile, idea, categoryId) {
    var parts = [];
    if ((profile.coreFrictions || []).indexOf('phone_overuse') >= 0 && idea.offline) parts.push('less screen time');
    if ((profile.overallGoals || []).indexOf('less_screen_time') >= 0 && idea.offline) parts.push('less screen time');
    if ((profile.overallGoals || []).indexOf('more_creativity') >= 0 && categoryId === 'create') parts.push('more creativity');
    if ((profile.resetStyles || []).length && categoryId === 'nourish') parts.push('how you like to reset');
    if (parts.length) return 'Picked for ' + parts.slice(0, 2).join(' and ') + '.';
    return '';
  }

  function compose(idea, profile, categoryId, opts) {
    if (!idea) return null;
    opts = opts || {};
    var cat = categoryId || idea.categoryId;
    var family = detectFamily(idea, profile, cat, opts);
    if (family === 'community_named') {
      if (typeof opts.communityNamePick !== 'number') {
        opts.communityNamePick = communityNameRotate++;
      }
      opts.communityName = pickCommunityName(profile, opts.communityNamePick);
    }
    if (family === 'friend_keep') {
      if (typeof opts.friendNamePick !== 'number') {
        opts.friendNamePick = friendNameRotate++;
      }
      opts.friendName = pickRotatedName(profile.friendNames, opts.friendNamePick, 'a friend');
    }
    if (family === 'family_keep') {
      if (typeof opts.familyNamePick !== 'number') {
        opts.familyNamePick = familyNameRotate++;
      }
      opts.familyName = pickRotatedName(profile.familyNames, opts.familyNamePick, 'someone in your family');
    }
    var seed = hashStr(idea.id + (profile.updatedAt || '') + family);
    var tpl = pickVariant(family, seed);
    var title = fillTemplate(tpl, profile, idea, seed, opts);
    if (family === 'generic' && title.indexOf('{text}') < 0 && title === idea.text) {
      title = fillTemplate(pickVariant('generic', seed + 1), profile, idea, seed + 1, opts);
    }
    var theme = global.PFDRecommendationEngine && global.PFDRecommendationEngine.recommendationThemeKey
      ? global.PFDRecommendationEngine.recommendationThemeKey(idea, profile, cat)
      : family;
    return {
      ideaId: idea.id,
      categoryId: cat,
      categoryLabel: global.PFDConstants ? global.PFDConstants.CATEGORY_LABELS[idea.categoryId] : idea.categoryId,
      title: title,
      sourceText: idea.text,
      reason: reasonLine(profile, idea, cat),
      effortScore: idea.effortScore || 2,
      tags: idea.goalTags || [],
      family: family,
      theme: theme
    };
  }

  global.PFDRecommendationComposer = {
    compose: compose,
    detectFamily: detectFamily
  };
})(window);
