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
    business_contained: [
      'Give {project} {duration}. Improve one small thing you already care about, no competitor research, no new tabs.',
      'Spend {duration} on {project}. One small thing only, no research, no optimizing the whole vision.'
    ],
    business_fun: [
      'Spend {duration} making one small thing for {project} without checking competitors or analytics.',
      'Work on {project} for {duration}, make something imperfect and stop when the timer ends.'
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

  function friendLabel(profile, seed) {
    return rotateName(profile.friendNames, seed, 'a friend');
  }

  function familyLabel(profile, seed) {
    return rotateName(profile.familyNames, seed, 'someone in your family');
  }

  function projectLabel(profile) {
    var n = (profile.projectName || '').trim();
    return n || 'your project';
  }

  function pickVariant(key, seed) {
    var list = VARIANTS[key] || VARIANTS.generic;
    return list[Math.abs(seed) % list.length];
  }

  function detectFamily(idea, profile, categoryId) {
    var t = (idea.text || '').toLowerCase();
    var fr = profile.coreFrictions || [];
    var targets = profile.connectTargets || [];
    var styles = profile.partnerConnectionStyles || [];

    if (categoryId === 'move') {
      if (/dance/.test(t)) return 'dance';
      if (/walk|stroll/.test(t)) {
        if (fr.indexOf('repetitive_days') >= 0) return 'walk_novelty';
        if ((profile.moveDesiredFeelings || []).indexOf('calming') >= 0) return 'walk_calm';
        return 'walk';
      }
      if (/stretch|yoga/.test(t)) return 'stretch';
      return 'walk_calm';
    }
    if (categoryId === 'connect') {
      var ideaTargets = idea.connectTargetTags || [];
      var primary = ideaTargets[0] || (targets.indexOf('partner') >= 0 ? 'partner' : targets[0]) || 'friends';
      if (primary === 'partner' || (targets.indexOf('partner') >= 0 && ideaTargets.indexOf('partner') >= 0)) {
        if (styles.indexOf('food_cafes') >= 0 || /café|coffee|food|restaurant|treat/.test(t)) return 'partner_food';
        if (styles.indexOf('adventure') >= 0 || /adventure|try something new|explore/.test(t)) return 'partner_adventure';
        if (styles.indexOf('deep_conversation') >= 0 || /conversation|talk|check in/.test(t)) return 'partner_talk';
        if (styles.indexOf('active') >= 0 || /walk|active|workout|move/.test(t)) return 'partner_active';
        return 'partner_cozy';
      }
      if (primary === 'family' || ideaTargets.indexOf('family') >= 0) {
        if (/food|meal|lunch|dinner|café/.test(t)) return 'family_food';
        return 'family_lowkey';
      }
      if (primary === 'community' || ideaTargets.indexOf('community') >= 0) return 'community_new';
      if (/food|café|coffee/.test(t)) return 'friend_food';
      if (/walk|active|workout|move|sport/.test(t)) return 'friend_active';
      if (/try something new|adventure|explore/.test(t)) return 'friend_new';
      return 'friend_lowkey';
    }
    if (categoryId === 'create') {
      if (/photo|film|camera/.test(t)) return 'photo_novelty';
      if ((profile.createInterests || []).indexOf('building_business') >= 0 && idea.productivityHeavy) {
        if (fr.indexOf('work_switch_off') >= 0) return 'business_contained';
        return 'business_fun';
      }
      return 'create_play';
    }
    if (categoryId === 'learn') {
      if ((profile.mindsetFormats || []).indexOf('journaling') >= 0) return 'mindset_journal';
      if ((profile.mindsetFormats || []).indexOf('podcasts') >= 0) return 'mindset_audio';
      if ((profile.mindsetFormats || []).indexOf('documentaries') >= 0 || (profile.mindsetFormats || []).indexOf('learning') >= 0) return 'mindset_learn';
      if ((profile.mindsetNeeds || []).length && Math.abs(hashStr(idea.id)) % 3 === 0) return 'mindset_learn';
      return 'mindset_journal';
    }
    if (categoryId === 'nourish') {
      var rs = profile.resetStyles || [];
      if (rs.indexOf('offline_reset') >= 0 || fr.indexOf('phone_overuse') >= 0) return 'reset_offline';
      if (rs.indexOf('self_care') >= 0) return 'reset_selfcare';
      if (rs.indexOf('space_reset') >= 0) return 'reset_space';
      if (rs.indexOf('rest_reset') >= 0) return 'reset_rest';
      if (rs.indexOf('nature_reset') >= 0) return 'reset_nature';
      if (rs.indexOf('solo_reset') >= 0) return 'reset_solo';
      if (rs.indexOf('nourishing_reset') >= 0) return 'reset_nature';
      if (/phone|screen|unplug/.test(t)) return 'reset_offline';
      if (/shower|bath|skincare|cozy/.test(t)) return 'reset_selfcare';
      if (/clean|organiz|tidy/.test(t)) return 'reset_space';
      if (/outside|sun|nature|walk/.test(t)) return 'reset_nature';
      return 'reset_rest';
    }
    return 'generic';
  }

  function fillTemplate(tpl, profile, idea, seed) {
    seed = seed || hashStr(idea.id + (profile.updatedAt || ''));
    return tpl
      .replace(/\{duration\}/g, durationLabel(profile, idea))
      .replace(/\{partner\}/g, partnerLabel(profile, seed))
      .replace(/\{friend\}/g, friendLabel(profile, seed))
      .replace(/\{family\}/g, familyLabel(profile, seed))
      .replace(/\{project\}/g, projectLabel(profile))
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

  function compose(idea, profile, categoryId) {
    if (!idea) return null;
    var cat = categoryId || idea.categoryId;
    var family = detectFamily(idea, profile, cat);
    var seed = hashStr(idea.id + (profile.updatedAt || '') + family);
    var tpl = pickVariant(family, seed);
    var title = fillTemplate(tpl, profile, idea, seed);
    if (family === 'generic' && title.indexOf('{text}') < 0 && title === idea.text) {
      title = fillTemplate(pickVariant('generic', seed + 1), profile, idea, seed + 1);
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
