/**
 * Passion Flow Daily — personalization v3 constants
 */
(function (global) {
  var OVERALL_GOAL_OPTIONS = [
    { id: 'more_creativity', label: 'More creativity' },
    { id: 'peace_presence', label: 'More peace & presence' },
    { id: 'deeper_relationships', label: 'Deeper relationships' },
    { id: 'movement_energy', label: 'More movement & energy' },
    { id: 'fun_novelty', label: 'More fun & novelty' },
    { id: 'confidence', label: 'More confidence' },
    { id: 'structure_consistency', label: 'More structure & consistency' },
    { id: 'time_for_self', label: 'More time for myself' },
    { id: 'less_screen_time', label: 'Less screen time' },
    { id: 'personal_growth', label: 'More personal growth' }
  ];

  var CORE_FRICTION_OPTIONS = [
    { id: 'overthinking', label: 'I overthink everything' },
    { id: 'choice_overload', label: 'Too many choices overwhelm me' },
    { id: 'phone_overuse', label: "I'm always on my phone" },
    { id: 'work_switch_off', label: 'I have trouble switching off from work or school' },
    { id: 'low_energy', label: "I'm usually tired" },
    { id: 'time_pressure', label: 'I never feel like I have enough time' },
    { id: 'activation_difficulty', label: 'I struggle to get started' },
    { id: 'repetitive_days', label: 'My days feel repetitive' },
    { id: 'self_neglect', label: 'I forget to make time for myself' },
    { id: 'others_first', label: 'I put other people first' },
    { id: 'lack_direction', label: 'I feel a little lost / unsure what I want' }
  ];

  var LIFE_CONTEXT_OPTIONS = [
    { id: 'student', label: 'Student' },
    { id: 'full_time_work', label: 'Work full-time' },
    { id: 'part_time_work', label: 'Work part-time' },
    { id: 'work_from_home', label: 'Work from home' },
    { id: 'self_employed', label: 'Self-employed / creator' },
    { id: 'caregiver', label: 'Parent / caregiver' },
    { id: 'transition_period', label: 'Between things / figuring it out' },
    { id: 'flexible_schedule', label: 'My schedule is pretty flexible' }
  ];

  var DAY_BANDWIDTH_OPTIONS = [
    { id: 'very_full', label: 'Very full — I barely have time for myself' },
    { id: 'pretty_full', label: 'Pretty full — I have some pockets of free time' },
    { id: 'balanced', label: 'Balanced — I usually make time for myself' },
    { id: 'very_flexible', label: 'Very flexible — I have a lot of control over my day' }
  ];

  var TIME_BUCKET_OPTIONS = [
    { id: 'micro', label: '5–10 min' },
    { id: 'short', label: '15–30 min' },
    { id: 'medium', label: '30–60 min' },
    { id: 'flexible', label: "I'm flexible" }
  ];

  var CREATE_INTEREST_OPTIONS = [
    { id: 'art_crafts', label: 'Art & crafts' },
    { id: 'writing', label: 'Writing' },
    { id: 'music', label: 'Music' },
    { id: 'photography', label: 'Photography' },
    { id: 'cooking_baking', label: 'Cooking & baking' },
    { id: 'content_creation', label: 'Content creation' },
    { id: 'building_business', label: 'Building / business' },
    { id: 'diy_design', label: 'DIY / design' },
    { id: 'fashion_beauty', label: 'Fashion / beauty' },
    { id: 'creative_discovery', label: 'I want to discover what I like' }
  ];

  var CREATE_MUSIC_SUBTYPES = [
    { id: 'singing', label: 'Singing' }, { id: 'songwriting', label: 'Songwriting' },
    { id: 'instrument', label: 'Playing an instrument' }, { id: 'producing', label: 'Producing / making music' },
    { id: 'discovering_music', label: 'Discovering music' }
  ];

  var CREATE_ART_SUBTYPES = [
    { id: 'drawing', label: 'Drawing' }, { id: 'painting', label: 'Painting' },
    { id: 'coloring', label: 'Coloring' }, { id: 'crafts', label: 'Crafts' },
    { id: 'digital_art', label: 'Digital art' }
  ];

  var CREATE_BUILDING_TYPES = [
    { id: 'own_business', label: 'My own business' }, { id: 'side_hustle', label: 'A side hustle' },
    { id: 'career_goal', label: 'A career goal' }, { id: 'personal_project', label: 'A personal project' },
    { id: 'new_skill', label: 'A new skill' }
  ];

  var MINDSET_NEED_OPTIONS = [
    { id: 'overthinking', label: 'Overthinking' }, { id: 'decision_making', label: 'Decision-making' },
    { id: 'confidence', label: 'Confidence' }, { id: 'self_trust', label: 'Self-trust' },
    { id: 'comparison', label: 'Comparison' }, { id: 'motivation', label: 'Motivation' },
    { id: 'negative_self_talk', label: 'Negative self-talk' }, { id: 'presence', label: 'Being present' },
    { id: 'direction', label: 'Finding direction' }, { id: 'mental_overwhelm', label: 'Mental overwhelm' }
  ];

  var MINDSET_FORMAT_OPTIONS = [
    { id: 'books', label: 'Reading books' }, { id: 'journaling', label: 'Journaling & reflection' },
    { id: 'podcasts', label: 'Podcasts / audio' }, { id: 'videos', label: 'Videos & talks' },
    { id: 'articles', label: 'Articles & essays' }, { id: 'documentaries', label: 'Documentaries' },
    { id: 'learning', label: 'Learning something new' }, { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'reflection_prompts', label: 'Thought-provoking prompts' }
  ];

  var CONNECT_TARGET_OPTIONS = [
    { id: 'partner', label: 'My partner' }, { id: 'friends', label: 'Friends' },
    { id: 'family', label: 'Family' }, { id: 'community', label: 'Community / new people' },
    { id: 'self', label: 'Myself' }
  ];

  var PARTNER_STYLE_OPTIONS = [
    { id: 'cozy', label: 'Cozy nights in' }, { id: 'food_cafes', label: 'Restaurants / cafés' },
    { id: 'adventure', label: 'Little adventures' }, { id: 'active', label: 'Working out / being active' },
    { id: 'deep_conversation', label: 'Deep conversations' }, { id: 'movies_shows', label: 'Movies / shows' },
    { id: 'create_together', label: 'Cooking / making things together' }, { id: 'date_night', label: 'Going out / date nights' }
  ];

  var FRIEND_STYLE_OPTIONS = [
    { id: 'catching_up', label: 'Catching up' }, { id: 'going_out', label: 'Going out' },
    { id: 'food_cafes', label: 'Cafés / food' }, { id: 'active', label: 'Active things' },
    { id: 'creative', label: 'Creative things' }, { id: 'low_key', label: 'Low-key hangs' },
    { id: 'trying_new', label: 'Trying something new' }
  ];

  var MOVE_PREF_OPTIONS = [
    { id: 'walking', label: 'Walking' }, { id: 'running', label: 'Running' },
    { id: 'strength', label: 'Strength training' }, { id: 'yoga_stretch', label: 'Yoga / stretching' },
    { id: 'dance', label: 'Dance' }, { id: 'hiking', label: 'Hiking / nature' },
    { id: 'sports', label: 'Sports' }, { id: 'fitness_classes', label: 'Fitness classes' }
  ];

  var MOVE_FEELING_OPTIONS = [
    { id: 'energizing', label: 'Energizing' }, { id: 'strong', label: 'Strong' },
    { id: 'calming', label: 'Calming' }, { id: 'playful', label: 'Playful' },
    { id: 'challenging', label: 'Challenging' }
  ];

  var RESET_STYLE_OPTIONS = [
    { id: 'self_care', label: 'Self-care reset', desc: 'Long shower, skincare, getting cozy.' },
    { id: 'space_reset', label: 'Space reset', desc: 'Clean up, fresh sheets, organize something.' },
    { id: 'nature_reset', label: 'Nature reset', desc: 'Go outside, get sunlight, be somewhere quiet.' },
    { id: 'solo_reset', label: 'Solo reset', desc: 'Take yourself somewhere, grab something you like, wander.' },
    { id: 'offline_reset', label: 'Offline reset', desc: 'Phone away, read, color, or do something without extra input.' },
    { id: 'rest_reset', label: 'Rest reset', desc: 'Slow down, lie down, nap, or do absolutely nothing.' },
    { id: 'nourishing_reset', label: 'Nourishing reset', desc: 'Make a drink or meal and slow down enough to enjoy it.' }
  ];

  var CATEGORY_IDS = ['create', 'learn', 'connect', 'move', 'nourish'];
  var CATEGORY_LABELS = { create: 'Create', learn: 'Mindset', connect: 'Connect', move: 'Move', nourish: 'Reset' };

  function createEmptyProfileV3() {
    return {
      version: 3,
      completedAt: null,
      skippedAt: null,
      overallGoals: [],
      coreFrictions: [],
      lifeContext: [],
      dayBandwidth: null,
      defaultTimeBucket: null,
      createInterests: [],
      createMusicSubtypes: [],
      createArtSubtypes: [],
      createBuildingType: null,
      projectName: '',
      mindsetNeeds: [],
      mindsetFormats: [],
      connectTargets: [],
      partnerConnectionStyles: [],
      partnerName: '',
      friendConnectionStyles: [],
      familyConnectionStyles: [],
      communityConnectionStyles: [],
      movePreferences: [],
      moveDesiredFeelings: [],
      resetStyles: [],
      preferredDaypart: null,
      socialPreference: null,
      deepPersonalizationCompleted: false,
      deepPersonalizationTriggeredBy: null,
      updatedAt: null
    };
  }

  /* Fields rebuilt from legacy shapes below — never overlay them raw, or v2 ids leak through. */
  var DERIVED_FIELDS = { version: 1, updatedAt: 1, overallGoals: 1 };

  function hasValue(v) {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  }

  function overlayExistingValues(target, source) {
    Object.keys(target).forEach(function (key) {
      if (DERIVED_FIELDS[key]) return;
      if (hasValue(source[key])) target[key] = source[key];
    });
    return target;
  }

  /* Layer 1 drives scoring hardest, so treat it as missing until frictions,
     bandwidth and time are all answered — regardless of any "completed" flag. */
  function needsLayer1(profile) {
    if (!profile) return true;
    if (!(profile.coreFrictions || []).length) return true;
    if (!profile.dayBandwidth) return true;
    if (!profile.defaultTimeBucket) return true;
    return false;
  }

  function migrateProfileToV3(profile) {
    var p = createEmptyProfileV3();
    if (!profile) return p;
    var mapGoals = {
      creativity: 'more_creativity', less_screen_time: 'less_screen_time', more_movement: 'movement_energy',
      deeper_connections: 'deeper_relationships', mindfulness: 'peace_presence', new_hobbies: 'more_creativity',
      consistency: 'structure_consistency', self_care: 'time_for_self', growth: 'personal_growth', adventure: 'fun_novelty'
    };
    var mapTime = { '5-10': 'micro', '15-30': 'short', '30-60': 'medium', any: 'flexible' };
    (profile.overallGoals || []).forEach(function (g) {
      var id = mapGoals[g] || g;
      if (p.overallGoals.indexOf(id) < 0) p.overallGoals.push(id);
    });
    p.dayBandwidth = profile.dayBandwidth || null;
    p.defaultTimeBucket = mapTime[profile.preferredTime] || profile.defaultTimeBucket || null;
    p.socialPreference = profile.socialPreference || null;
    p.preferredDaypart = profile.preferredDaypart || null;
    p.partnerName = profile.partnerName || '';
    p.projectName = profile.projectName || '';
    if (profile.categoryGoals) {
      var cg = profile.categoryGoals;
      var createMap = { art: 'art_crafts', writing: 'writing', content: 'content_creation', building: 'building_business', photography: 'photography' };
      (cg.create || []).forEach(function (x) { if (createMap[x] && p.createInterests.indexOf(createMap[x]) < 0) p.createInterests.push(createMap[x]); });
      var learnMap = { learning: 'learning', mindfulness: 'mindfulness', productivity: 'learning', confidence: 'confidence', reading: 'books' };
      (cg.learn || []).forEach(function (x) {
        if (learnMap[x] === 'books') { if (p.mindsetFormats.indexOf('books') < 0) p.mindsetFormats.push('books'); }
        else if (learnMap[x] === 'mindfulness') { if (p.mindsetFormats.indexOf('mindfulness') < 0) p.mindsetFormats.push('mindfulness'); }
        else if (learnMap[x] === 'confidence') { if (p.mindsetNeeds.indexOf('confidence') < 0) p.mindsetNeeds.push('confidence'); }
      });
      var connectMap = { friends: 'friends', family: 'family', community: 'community', romance: 'partner' };
      (cg.connect || []).forEach(function (x) { if (connectMap[x] && p.connectTargets.indexOf(connectMap[x]) < 0) p.connectTargets.push(connectMap[x]); });
      var moveMap = { cardio: 'running', strength: 'strength', yoga: 'yoga_stretch', outdoors: 'hiking' };
      (cg.move || []).forEach(function (x) { if (moveMap[x] && p.movePreferences.indexOf(moveMap[x]) < 0) p.movePreferences.push(moveMap[x]); });
      var resetMap = { rest: 'rest_reset', organization: 'space_reset', nourishment: 'nourishing_reset', digital_detox: 'offline_reset' };
      (cg.nourish || []).forEach(function (x) { if (resetMap[x] && p.resetStyles.indexOf(resetMap[x]) < 0) p.resetStyles.push(resetMap[x]); });
    }
    overlayExistingValues(p, profile);
    if (profile.completedAt || profile.version >= 2) {
      p.completedAt = profile.completedAt || Date.now();
    }
    p.deepPersonalizationCompleted = !!profile.deepPersonalizationCompleted;
    p.updatedAt = profile.updatedAt || Date.now();
    return p;
  }

  global.PFDConstants = {
    OVERALL_GOAL_OPTIONS: OVERALL_GOAL_OPTIONS,
    CORE_FRICTION_OPTIONS: CORE_FRICTION_OPTIONS,
    LIFE_CONTEXT_OPTIONS: LIFE_CONTEXT_OPTIONS,
    DAY_BANDWIDTH_OPTIONS: DAY_BANDWIDTH_OPTIONS,
    TIME_BUCKET_OPTIONS: TIME_BUCKET_OPTIONS,
    CREATE_INTEREST_OPTIONS: CREATE_INTEREST_OPTIONS,
    CREATE_MUSIC_SUBTYPES: CREATE_MUSIC_SUBTYPES,
    CREATE_ART_SUBTYPES: CREATE_ART_SUBTYPES,
    CREATE_BUILDING_TYPES: CREATE_BUILDING_TYPES,
    MINDSET_NEED_OPTIONS: MINDSET_NEED_OPTIONS,
    MINDSET_FORMAT_OPTIONS: MINDSET_FORMAT_OPTIONS,
    CONNECT_TARGET_OPTIONS: CONNECT_TARGET_OPTIONS,
    PARTNER_STYLE_OPTIONS: PARTNER_STYLE_OPTIONS,
    FRIEND_STYLE_OPTIONS: FRIEND_STYLE_OPTIONS,
    MOVE_PREF_OPTIONS: MOVE_PREF_OPTIONS,
    MOVE_FEELING_OPTIONS: MOVE_FEELING_OPTIONS,
    RESET_STYLE_OPTIONS: RESET_STYLE_OPTIONS,
    CATEGORY_IDS: CATEGORY_IDS,
    CATEGORY_LABELS: CATEGORY_LABELS,
    createEmptyProfileV3: createEmptyProfileV3,
    migrateProfileToV3: migrateProfileToV3,
    needsLayer1: needsLayer1
  };
})(window);
