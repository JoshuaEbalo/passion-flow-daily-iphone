/**
 * Guardrail: Daily Flow / Pick for Me must honor explicit personalization picks.
 * Run: node scripts/check-personalization.js
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..', 'www');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var start = html.indexOf('var FOCUS_PACKS =');
var end = html.indexOf('var QUOTES');
if (start < 0 || end < 0) throw new Error('Could not extract FOCUS_PACKS from index.html');

var sandbox = { console: console };
sandbox.window = sandbox;
sandbox.global = sandbox;

function load(file) {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}

vm.runInNewContext(html.slice(start, end), sandbox, { filename: 'FOCUS_PACKS' });
load('personalization-constants.js');
load('idea-metadata.js');
load('recommendation-engine.js');
load('recommendation-composer.js');
load('plan-day-coherence.js');

sandbox.pfdIdeaIndex = sandbox.PFDIdeaMetadata.buildIdeaIndex(sandbox.FOCUS_PACKS);

function baseProfile(extra) {
  return Object.assign(sandbox.PFDConstants.createEmptyProfileV3(), {
    overallGoals: ['movement_energy', 'fun_novelty', 'peace_presence'],
    coreFrictions: ['repetitive_days', 'work_switch_off'],
    dayBandwidth: 'balanced',
    defaultTimeBucket: 'short',
    deepPersonalizationCompleted: true,
    completedAt: Date.now(),
    updatedAt: Date.now()
  }, extra || {});
}

function overlap(prefs, tags) {
  return (prefs || []).some(function (p) { return (tags || []).indexOf(p) >= 0; });
}

function countTags(cat, field) {
  var out = {};
  sandbox.pfdIdeaIndex.filter(function (i) { return i.categoryId === cat; }).forEach(function (idea) {
    (idea[field] || []).forEach(function (t) {
      out[t] = (out[t] || 0) + 1;
    });
  });
  return out;
}

var failures = [];
function fail(msg) { failures.push(msg); }

function requireCoverage(label, counts, keys, min) {
  keys.forEach(function (k) {
    if (!counts[k] || counts[k] < min) fail('thin ' + label + ' coverage for ' + k + ': ' + (counts[k] || 0));
  });
}

var moveCounts = countTags('move', 'moveTypeTags');
var learnFormatCounts = countTags('learn', 'mindsetFormatTags');
var resetCounts = countTags('nourish', 'resetStyleTags');
var createCounts = countTags('create', 'createInterestTags');
var connectCounts = countTags('connect', 'connectTargetTags');

console.log('Move:', JSON.stringify(moveCounts));
console.log('Mindset formats:', JSON.stringify(learnFormatCounts));
console.log('Reset:', JSON.stringify(resetCounts));
console.log('Create:', JSON.stringify(createCounts));
console.log('Connect:', JSON.stringify(connectCounts));

requireCoverage('move', moveCounts, ['running', 'hiking', 'sports', 'walking', 'dance', 'strength', 'yoga_stretch'], 5);
requireCoverage('mindset format', learnFormatCounts, ['books', 'journaling', 'podcasts', 'videos', 'documentaries', 'mindfulness', 'learning', 'articles', 'reflection_prompts'], 5);
requireCoverage('reset', resetCounts, ['self_care', 'space_reset', 'nature_reset', 'solo_reset', 'offline_reset', 'rest_reset', 'nourishing_reset'], 5);
requireCoverage('create', createCounts, ['art_crafts', 'writing', 'photography', 'building_business', 'fashion_beauty', 'music', 'cooking_baking', 'content_creation'], 5);
requireCoverage('connect', connectCounts, ['partner', 'friends', 'family', 'community'], 8);

var profile = baseProfile({
  createInterests: ['writing', 'photography'],
  mindsetFormats: ['podcasts', 'journaling'],
  mindsetNeeds: ['overthinking'],
  connectTargets: ['partner'],
  partnerName: 'Sam',
  partnerConnectionStyles: ['cozy', 'deep_conversation'],
  movePreferences: ['sports', 'hiking', 'running'],
  moveDesiredFeelings: ['energizing', 'playful'],
  resetStyles: ['nature_reset', 'offline_reset']
});

function assertMatch(idea, prefs, field, label) {
  if (!idea) {
    fail(label + ': missing idea');
    return null;
  }
  if (!overlap(prefs, idea[field])) {
    fail(label + ': tags ' + (idea[field] || []).join(',') + ' :: ' + idea.text);
  }
  return sandbox.PFDRecommendationComposer.compose(idea, profile, idea.categoryId);
}

for (var i = 0; i < 50; i++) {
  var plan = sandbox.PFDRecommendationEngine.planMyDay(profile, { shuffleMode: i % 3 === 0 });
  ['create', 'learn', 'connect', 'move', 'nourish'].forEach(function (cat) {
    if (!plan[cat]) fail('plan#' + i + ' missing ' + cat);
  });

  var createC = assertMatch(plan.create, profile.createInterests, 'createInterestTags', 'create#' + i);
  if (createC && /business plan|landing page|pitch deck|side hustle/i.test(createC.title) &&
      profile.createInterests.indexOf('building_business') < 0) {
    fail('create#' + i + ' business idea without building pick: ' + createC.title);
  }

  var learnC = assertMatch(plan.learn, profile.mindsetFormats, 'mindsetFormatTags', 'learn#' + i);
  if (learnC) {
    if (/If I didn't need the perfect answer/i.test(learnC.title)) {
      fail('learn#' + i + ' journal rewrite: ' + learnC.title);
    }
    if (/danc|zumba/i.test(learnC.title)) fail('learn#' + i + ' dance: ' + learnC.title);
  }

  var connectC = assertMatch(plan.connect, profile.connectTargets, 'connectTargetTags', 'connect#' + i);
  if (connectC) {
    var ct = plan.connect.connectTargetTags || [];
    if (ct.indexOf('partner') < 0) fail('connect#' + i + ' not partner: ' + plan.connect.text);
    if (/volunteer at a local food bank|neighborhood clean-up|recreational sports league/i.test(connectC.title)) {
      fail('connect#' + i + ' community idea for partner: ' + connectC.title);
    }
  }

  var moveC = assertMatch(plan.move, profile.movePreferences, 'moveTypeTags', 'move#' + i);
  if (moveC) {
    if (/danc|zumba|salsa|bachata|hip-hop|choreo/i.test(moveC.title) || moveC.family === 'dance') {
      fail('move#' + i + ' dance: ' + moveC.title);
    }
    if ((moveC.family === 'walk' || moveC.family === 'walk_calm' || moveC.family === 'walk_novelty') &&
        (plan.move.moveTypeTags || []).indexOf('walking') < 0) {
      fail('move#' + i + ' walk rewrite: ' + moveC.title);
    }
  }

  var resetC = assertMatch(plan.nourish, profile.resetStyles, 'resetStyleTags', 'reset#' + i);
  if (resetC) {
    if (/declutter one full drawer|deep clean one room|reorganize your wardrobe/i.test(resetC.title) &&
        (plan.nourish.resetStyleTags || []).indexOf('space_reset') < 0) {
      fail('reset#' + i + ' space idea for nature/offline: ' + resetC.title);
    }
    if (/cook a full healthy meal|meal prep|homemade bread/i.test(resetC.title) &&
        (plan.nourish.resetStyleTags || []).indexOf('nourishing_reset') < 0) {
      fail('reset#' + i + ' cooking idea for nature/offline: ' + resetC.title);
    }
    if (resetC.family === 'reset_nature' && (plan.nourish.resetStyleTags || []).indexOf('nature_reset') < 0 &&
        (plan.nourish.resetStyleTags || []).indexOf('nourishing_reset') >= 0) {
      fail('reset#' + i + ' cooking rewritten as nature: ' + resetC.title);
    }
  }
}

var podcastOnly = baseProfile({ mindsetFormats: ['podcasts'] });
for (var p = 0; p < 20; p++) {
  var idea = sandbox.PFDRecommendationEngine.pickForCategory('learn', podcastOnly, { relaxTime: true });
  if (!idea || (idea.mindsetFormatTags || []).indexOf('podcasts') < 0) {
    fail('podcast-only got ' + (idea ? idea.text : 'nothing'));
  }
  var composed = sandbox.PFDRecommendationComposer.compose(idea, podcastOnly, 'learn');
  if (composed && /journal one thought|write down one decision/i.test(composed.title)) {
    fail('podcast rewritten to journal: ' + composed.title);
  }
}

var offlineOnly = baseProfile({ resetStyles: ['offline_reset'] });
for (var r = 0; r < 20; r++) {
  var resetIdea = sandbox.PFDRecommendationEngine.pickForCategory('nourish', offlineOnly, { relaxTime: true });
  if (!resetIdea || (resetIdea.resetStyleTags || []).indexOf('offline_reset') < 0) {
    fail('offline-only got ' + (resetIdea ? resetIdea.text : 'nothing'));
  }
}

var spaceOnly = baseProfile({ resetStyles: ['space_reset'] });
for (var s = 0; s < 15; s++) {
  var spaceIdea = sandbox.PFDRecommendationEngine.pickForCategory('nourish', spaceOnly, { relaxTime: true });
  if (!spaceIdea || (spaceIdea.resetStyleTags || []).indexOf('space_reset') < 0) {
    fail('space-only got ' + (spaceIdea ? spaceIdea.text : 'nothing'));
  }
}

var mindfulnessOnly = baseProfile({ mindsetFormats: ['mindfulness'] });
for (var m = 0; m < 15; m++) {
  var mindIdea = sandbox.PFDRecommendationEngine.pickForCategory('learn', mindfulnessOnly, { relaxTime: true });
  if (!mindIdea || (mindIdea.mindsetFormatTags || []).indexOf('mindfulness') < 0) {
    fail('mindfulness-only got ' + (mindIdea ? mindIdea.text : 'nothing'));
  }
}

var friendsOnly = baseProfile({ connectTargets: ['friends'], friendNames: ['Maya'] });
for (var f = 0; f < 15; f++) {
  var friendIdea = sandbox.PFDRecommendationEngine.pickForCategory('connect', friendsOnly, { relaxTime: true });
  if (!friendIdea || (friendIdea.connectTargetTags || []).indexOf('friends') < 0) {
    fail('friends-only got ' + (friendIdea ? friendIdea.text : 'nothing'));
  }
}

var mixedReset = baseProfile({ resetStyles: ['nature_reset', 'rest_reset', 'nourishing_reset'] });
var resetMix = { nature_reset: 0, rest_reset: 0, nourishing_reset: 0, solo_reset: 0 };
var resetThemes = [];
for (var nr = 0; nr < 30; nr++) {
  var mixedIdea = sandbox.PFDRecommendationEngine.pickForCategory('nourish', mixedReset, {
    relaxTime: true,
    shuffleMode: true,
    excludeThemes: resetThemes.slice(-2)
  });
  if (!mixedIdea) {
    fail('mixed reset missing idea');
    continue;
  }
  var resetPrimary = sandbox.PFDRecommendationEngine.primaryResetStyle(mixedIdea);
  resetMix[resetPrimary] = (resetMix[resetPrimary] || 0) + 1;
  if (resetPrimary === 'solo_reset') {
    fail('mixed reset leaked solo outing: ' + mixedIdea.text);
  }
  resetThemes.push(resetPrimary);
}
['nature_reset', 'rest_reset', 'nourishing_reset'].forEach(function (k) {
  if ((resetMix[k] || 0) < 5) fail('uneven reset mix for ' + k + ': ' + JSON.stringify(resetMix));
});

var mixedLearn = baseProfile({ mindsetFormats: ['documentaries', 'podcasts', 'videos'] });
var learnMix = { documentaries: 0, podcasts: 0, videos: 0 };
var learnThemes = [];
for (var nl = 0; nl < 30; nl++) {
  var learnIdea = sandbox.PFDRecommendationEngine.pickForCategory('learn', mixedLearn, {
    relaxTime: true,
    shuffleMode: true,
    excludeThemes: learnThemes.slice(-2)
  });
  if (!learnIdea) {
    fail('mixed learn missing idea');
    continue;
  }
  var learnPrimary = sandbox.PFDRecommendationEngine.primaryMindsetFormat(learnIdea, mixedLearn);
  learnMix[learnPrimary] = (learnMix[learnPrimary] || 0) + 1;
  learnThemes.push(learnPrimary);
}
['documentaries', 'podcasts', 'videos'].forEach(function (k) {
  if ((learnMix[k] || 0) < 5) fail('uneven learn mix for ' + k + ': ' + JSON.stringify(learnMix));
});

var namedCreate = baseProfile({
  createInterests: ['art_crafts', 'photography', 'content_creation'],
  projectNames: ['Harbor', 'Light Room', 'Sunday Film']
});
var namedHits = 0;
for (var nc = 0; nc < 20; nc++) {
  var createIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', namedCreate, { relaxTime: true, shuffleMode: true });
  var createComposed = sandbox.PFDRecommendationComposer.compose(createIdea, namedCreate, 'create');
  if (createComposed && /Harbor|Light Room|Sunday Film/.test(createComposed.title)) namedHits++;
}

var sewingArt = baseProfile({ createInterests: ['art_crafts'], projectNames: ['sewing project'] });
var sewingMusic = baseProfile({ createInterests: ['music'], projectNames: ['sewing project'] });
var cookbookMusic = baseProfile({ createInterests: ['music'], projectNames: ['making a cookbook'] });
var harborBusiness = baseProfile({ createInterests: ['building_business'], projectNames: ['Harbor'] });
var codingMusic = baseProfile({ createInterests: ['music'], projectNames: ['coding project'] });
var codingBuild = baseProfile({ createInterests: ['building_business'], projectNames: ['coding project'] });
var brandingContent = baseProfile({ createInterests: ['content_creation'], projectNames: ['content branding'] });
var artSewHits = 0;
var codeBuildHits = 0;
var brandHits = 0;
for (var sm = 0; sm < 8; sm++) {
  var artIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', sewingArt, { relaxTime: true, shuffleMode: true });
  var artComposed = sandbox.PFDRecommendationComposer.compose(artIdea, sewingArt, 'create');
  if (artComposed && /sewing project/i.test(artComposed.title)) artSewHits++;
  if (artComposed && artComposed.family === 'create_named' && /sewing project/i.test(artComposed.title) &&
      !/sew|fabric|alter|quilt|knit|crochet|stitch|craft|embroider/i.test(artIdea.text)) {
    fail('sewing glued onto unrelated art idea: ' + artComposed.title);
  }
  var musicSewIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', sewingMusic, { relaxTime: true, shuffleMode: true });
  var musicSewComposed = sandbox.PFDRecommendationComposer.compose(musicSewIdea, sewingMusic, 'create');
  if (musicSewComposed && /sewing project/i.test(musicSewComposed.title)) {
    fail('sewing name on music idea: ' + musicSewComposed.title);
  }
  var cookMusicIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', cookbookMusic, { relaxTime: true, shuffleMode: true });
  var cookMusicComposed = sandbox.PFDRecommendationComposer.compose(cookMusicIdea, cookbookMusic, 'create');
  if (cookMusicComposed && /cookbook/i.test(cookMusicComposed.title)) {
    fail('cookbook name on music idea: ' + cookMusicComposed.title);
  }
  var bizIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', harborBusiness, { relaxTime: true, shuffleMode: true });
  var bizComposed = sandbox.PFDRecommendationComposer.compose(bizIdea, harborBusiness, 'create');
  if (bizComposed && bizComposed.family !== 'generic' && bizComposed.title.indexOf('Harbor') < 0 &&
      (bizIdea.productivityHeavy || sandbox.PFDRecommendationEngine.primaryCreateInterest(bizIdea, harborBusiness) === 'building_business')) {
    fail('Harbor missing on business idea: ' + bizComposed.title);
  }
  var codeMusicIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', codingMusic, { relaxTime: true, shuffleMode: true });
  var codeMusicComposed = sandbox.PFDRecommendationComposer.compose(codeMusicIdea, codingMusic, 'create');
  if (codeMusicComposed && /coding project/i.test(codeMusicComposed.title)) {
    fail('coding name on music idea: ' + codeMusicComposed.title);
  }
  var codeIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', codingBuild, { relaxTime: true, shuffleMode: true });
  var codeComposed = sandbox.PFDRecommendationComposer.compose(codeIdea, codingBuild, 'create');
  if (codeComposed && /coding project/i.test(codeComposed.title)) codeBuildHits++;
  if (codeComposed && codeComposed.family === 'create_named' && /coding project/i.test(codeComposed.title) &&
      !/code|app|website|software|program|build/i.test(codeIdea.text)) {
    fail('coding glued onto unrelated build idea: ' + codeComposed.title);
  }
  var brandIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', brandingContent, { relaxTime: true, shuffleMode: true });
  var brandComposed = sandbox.PFDRecommendationComposer.compose(brandIdea, brandingContent, 'create');
  if (brandComposed && /content branding/i.test(brandComposed.title)) brandHits++;
}
if (artSewHits < 5) fail('sewing rarely used on art ideas: ' + artSewHits);
if (codeBuildHits < 5) fail('coding rarely used on build ideas: ' + codeBuildHits);
if (brandHits < 5) fail('branding rarely used on content ideas: ' + brandHits);

var skipSew = sandbox.PFDRecommendationComposer.compose(artIdea, sewingArt, 'create', { skipProjectName: true });
if (skipSew && /sewing project/i.test(skipSew.title)) {
  fail('skipProjectName still attached sewing: ' + skipSew.title);
}
var forceSew = sandbox.PFDRecommendationComposer.compose(artIdea, sewingArt, 'create', { forceProjectName: true });
if (!forceSew || !/sewing project/i.test(forceSew.title)) {
  fail('forceProjectName missing sewing: ' + (forceSew && forceSew.title));
}
var threeProj = baseProfile({ createInterests: ['art_crafts'], projectNames: ['Harbor', 'Light Room', 'Sunday Film'] });
var seenNames = {};
for (var pn = 0; pn < 3; pn++) {
  var namedForce = sandbox.PFDRecommendationComposer.compose(artIdea, threeProj, 'create', { forceProjectName: true, projectNamePick: pn });
  var nameHit = namedForce && namedForce.title && namedForce.title.match(/Harbor|Light Room|Sunday Film/);
  if (!nameHit) fail('named cycle missing name at ' + pn + ': ' + (namedForce && namedForce.title));
  else seenNames[nameHit[0]] = 1;
}
if (Object.keys(seenNames).length < 3) fail('named cycle did not cover all 3 projects: ' + JSON.stringify(seenNames));

var resetThree = baseProfile({ resetStyles: ['self_care', 'space_reset', 'nature_reset'] });
var resetSeq = [];
var resetCounts = { self_care: 0, space_reset: 0, nature_reset: 0 };
for (var rs = 0; rs < 9; rs++) {
  var rstIdea = sandbox.PFDRecommendationEngine.pickForCategory('nourish', resetThree, {
    relaxTime: true,
    shuffleMode: true,
    excludeThemes: resetSeq.slice()
  });
  if (!rstIdea) {
    fail('reset shuffle missing idea');
    break;
  }
  var rstPrimary = sandbox.PFDRecommendationEngine.primaryResetStyle(rstIdea);
  if (!resetCounts.hasOwnProperty(rstPrimary)) {
    fail('reset shuffle leaked ' + rstPrimary + ': ' + rstIdea.text);
    continue;
  }
  resetCounts[rstPrimary]++;
  resetSeq.push(rstPrimary);
}
['self_care', 'space_reset', 'nature_reset'].forEach(function (k) {
  if ((resetCounts[k] || 0) < 2) fail('reset shuffle rarely used ' + k + ': ' + JSON.stringify(resetCounts) + ' seq=' + resetSeq.join(','));
});

var shuffleLearn = baseProfile({ mindsetFormats: ['mindfulness', 'articles', 'documentaries'] });
var shuffleSeq = [];
var lastLearn = null;
for (var ls = 0; ls < 12; ls++) {
  var shIdea = sandbox.PFDRecommendationEngine.pickForCategory('learn', shuffleLearn, {
    relaxTime: true,
    shuffleMode: true,
    excludeThemes: lastLearn ? [lastLearn] : [],
    excludeIds: shuffleSeq.map(function (x, i) { return 'x' + i; })
  });
  if (!shIdea) {
    fail('learn shuffle missing idea');
    break;
  }
  lastLearn = sandbox.PFDRecommendationEngine.primaryMindsetFormat(shIdea, shuffleLearn);
  shuffleSeq.push(lastLearn);
}
var uniqueLearn = {};
shuffleSeq.forEach(function (k) { uniqueLearn[k] = (uniqueLearn[k] || 0) + 1; });
if (Object.keys(uniqueLearn).length < 2) fail('learn shuffle stuck on one format: ' + JSON.stringify(uniqueLearn));
var streak = 1, maxStreak = 1;
for (var st = 1; st < shuffleSeq.length; st++) {
  if (shuffleSeq[st] === shuffleSeq[st - 1]) streak++;
  else streak = 1;
  if (streak > maxStreak) maxStreak = streak;
}
if (maxStreak >= 5) fail('learn shuffle repeated one format 5 times: ' + shuffleSeq.join(','));

var planFive = sandbox.PFDRecommendationEngine.planMyDay(shuffleLearn, { relaxTime: true, shuffleMode: true });
['create', 'learn', 'connect', 'move', 'nourish'].forEach(function (cat) {
  if (!planFive[cat]) fail('Daily Flow missing ' + cat);
});

var createOptions = ['art_crafts', 'writing', 'music', 'photography', 'cooking_baking', 'content_creation', 'building_business', 'diy_design', 'fashion_beauty', 'creative_discovery'];
createOptions.forEach(function (interest) {
  var onlyCreate = baseProfile({
    createInterests: [interest],
    projectNames: ['Harbor']
  });
  for (var ci = 0; ci < 10; ci++) {
    var onlyCreateIdea = sandbox.PFDRecommendationEngine.pickForCategory('create', onlyCreate, { relaxTime: true, shuffleMode: true });
    var createPrimary = onlyCreateIdea ? sandbox.PFDRecommendationEngine.primaryCreateInterest(onlyCreateIdea, onlyCreate) : null;
    if (createPrimary !== interest) {
      fail('create-only ' + interest + ' got ' + createPrimary + ': ' + (onlyCreateIdea ? onlyCreateIdea.text : 'nothing'));
    }
  }
});

var allFormats = ['books', 'journaling', 'podcasts', 'videos', 'articles', 'documentaries', 'learning', 'mindfulness', 'reflection_prompts'];
allFormats.forEach(function (fmt) {
  var only = baseProfile({ mindsetFormats: [fmt] });
  for (var fi = 0; fi < 12; fi++) {
    var onlyIdea = sandbox.PFDRecommendationEngine.pickForCategory('learn', only, { relaxTime: true, shuffleMode: true });
    var onlyPrimary = onlyIdea ? sandbox.PFDRecommendationEngine.primaryMindsetFormat(onlyIdea, only) : null;
    if (onlyPrimary !== fmt) {
      fail('format-only ' + fmt + ' got ' + onlyPrimary + ': ' + (onlyIdea ? onlyIdea.text : 'nothing'));
    }
  }
});

var promptMind = baseProfile({ mindsetFormats: ['journaling', 'mindfulness', 'reflection_prompts'] });
var promptMix = { journaling: 0, mindfulness: 0, reflection_prompts: 0 };
var promptThemes = [];
for (var pm = 0; pm < 30; pm++) {
  var promptIdea = sandbox.PFDRecommendationEngine.pickForCategory('learn', promptMind, {
    relaxTime: true,
    shuffleMode: true,
    excludeThemes: promptThemes.slice(-2)
  });
  var promptPrimary = promptIdea ? sandbox.PFDRecommendationEngine.primaryMindsetFormat(promptIdea, promptMind) : null;
  if (!promptPrimary || !promptMix.hasOwnProperty(promptPrimary)) {
    fail('prompt mix leaked ' + promptPrimary + ': ' + (promptIdea ? promptIdea.text : 'nothing'));
    continue;
  }
  promptMix[promptPrimary]++;
  promptThemes.push(promptPrimary);
}
['journaling', 'mindfulness', 'reflection_prompts'].forEach(function (k) {
  if ((promptMix[k] || 0) < 5) fail('uneven prompt mix for ' + k + ': ' + JSON.stringify(promptMix));
});

var mindArtVid = baseProfile({ mindsetFormats: ['mindfulness', 'articles', 'videos'] });
var mavMix = { mindfulness: 0, articles: 0, videos: 0 };
var mavThemes = [];
for (var mv = 0; mv < 30; mv++) {
  var mavIdea = sandbox.PFDRecommendationEngine.pickForCategory('learn', mindArtVid, {
    relaxTime: true,
    shuffleMode: true,
    excludeThemes: mavThemes.slice(-2)
  });
  var mavPrimary = mavIdea ? sandbox.PFDRecommendationEngine.primaryMindsetFormat(mavIdea, mindArtVid) : null;
  if (!mavPrimary || !mavMix.hasOwnProperty(mavPrimary)) {
    fail('mind/articles/videos leaked ' + mavPrimary + ': ' + (mavIdea ? mavIdea.text : 'nothing'));
    continue;
  }
  mavMix[mavPrimary]++;
  mavThemes.push(mavPrimary);
}
['mindfulness', 'articles', 'videos'].forEach(function (k) {
  if ((mavMix[k] || 0) < 5) fail('uneven mind/articles/videos for ' + k + ': ' + JSON.stringify(mavMix));
});

var basketballCommunity = baseProfile({
  connectTargets: ['community'],
  communityName: 'basketball',
  communityNames: ['basketball']
});
function composeConnect(text, tag) {
  return sandbox.PFDRecommendationComposer.compose({
    id: 'connect-test-' + text.slice(0, 24),
    text: text,
    tag: tag,
    categoryId: 'connect',
    connectTargetTags: ['community']
  }, basketballCommunity, 'connect');
}
var kindnessCoffee = composeConnect('Pay for the person behind you in the coffee line', 'Kindness');
if (kindnessCoffee && /basketball/i.test(kindnessCoffee.title)) {
  fail('community name on kindness coffee: ' + kindnessCoffee.title);
}
var kindnessChallenge = composeConnect('Start a random acts of kindness challenge, one per day for a week', 'Kindness');
if (kindnessChallenge && /basketball/i.test(kindnessChallenge.title)) {
  fail('community name on kindness challenge: ' + kindnessChallenge.title);
}
var neighborNote = composeConnect('Leave a kind anonymous note for your neighbor, just leave it', 'Neighbors');
if (neighborNote && /basketball/i.test(neighborNote.title)) {
  fail('community name on neighbor note: ' + neighborNote.title);
}
var sportsLeague = composeConnect('Join a local recreational sports league this season', 'Belonging');
if (!sportsLeague || !/basketball/i.test(sportsLeague.title) || /join a local recreational/i.test(sportsLeague.title)) {
  fail('sports league should become a named hang: ' + (sportsLeague && sportsLeague.title));
}
var communityGarden = composeConnect('Join a community garden and contribute one full afternoon', 'Community');
if (!communityGarden || !/basketball/i.test(communityGarden.title) || /community garden/i.test(communityGarden.title)) {
  fail('community garden should become a named hang: ' + (communityGarden && communityGarden.title));
}
var communityEvent = composeConnect('Attend a community event you would normally scroll past', 'Community');
if (!communityEvent || !/basketball/i.test(communityEvent.title) || /community event/i.test(communityEvent.title)) {
  fail('community event should become a named hang: ' + (communityEvent && communityEvent.title));
}
var gathering = composeConnect('Organize a small neighborhood gathering, just snacks and time', 'Belonging');
if (!gathering || !/basketball/i.test(gathering.title) || /organize a small neighborhood gathering/i.test(gathering.title)) {
  fail('community hang should be a broad plan with the name: ' + (gathering && gathering.title));
}
var teach = composeConnect('Teach something you are actually good at to someone in your community', 'Belonging');
if (!teach || !/basketball/i.test(teach.title) || /teach something/i.test(teach.title)) {
  fail('community hang should not prefix teach: ' + (teach && teach.title));
}

var sewingCommunity = baseProfile({
  connectTargets: ['community'],
  communityName: 'sewing circle',
  communityNames: ['sewing circle']
});
function composeSew(text, tag) {
  return sandbox.PFDRecommendationComposer.compose({
    id: 'sew-test-' + text.slice(0, 24),
    text: text,
    tag: tag,
    categoryId: 'connect',
    connectTargetTags: ['community']
  }, sewingCommunity, 'connect');
}
var sewGarden = composeSew('Join a community garden and contribute one full afternoon', 'Community');
if (!sewGarden || !/sewing/i.test(sewGarden.title) || /community garden/i.test(sewGarden.title)) {
  fail('sewing hang should replace garden hunt: ' + (sewGarden && sewGarden.title));
}
var sewTeach = composeSew('Teach something you are actually good at to someone in your community', 'Belonging');
if (!sewTeach || !/sewing/i.test(sewTeach.title) || /teach something/i.test(sewTeach.title)) {
  fail('sewing hang should be a broad plan: ' + (sewTeach && sewTeach.title));
}

var twoNames = baseProfile({
  connectTargets: ['community'],
  communityName: 'basketball team',
  communityNames: ['basketball team', 'sewing circle']
});
var twoHang = sandbox.PFDRecommendationComposer.compose({
  id: 'two-name-garden',
  text: 'Join a community garden and contribute one full afternoon',
  tag: 'Community',
  categoryId: 'connect',
  connectTargetTags: ['community']
}, twoNames, 'connect');
if (!twoHang || !/(basketball team|sewing circle)/i.test(twoHang.title) || /community garden/i.test(twoHang.title)) {
  fail('two community names should appear as a hang: ' + (twoHang && twoHang.title));
}
var twoHangB = sandbox.PFDRecommendationComposer.compose({
  id: 'two-name-event',
  text: 'Attend a community event you would normally scroll past',
  tag: 'Community',
  categoryId: 'connect',
  connectTargetTags: ['community']
}, twoNames, 'connect');
var twoSeen = [twoHang && twoHang.title, twoHangB && twoHangB.title].join(' ');
if (!/basketball team/i.test(twoSeen) || !/sewing circle/i.test(twoSeen)) {
  fail('two community names should rotate across shuffles: ' + twoSeen);
}

var twoFriends = baseProfile({
  connectTargets: ['friends'],
  friendNames: ['Maya', 'Jordan']
});
var friendA = sandbox.PFDRecommendationComposer.compose({
  id: 'friend-rotate-a',
  text: 'Grab coffee with a friend this week',
  tag: 'Friends',
  categoryId: 'connect',
  connectTargetTags: ['friends']
}, twoFriends, 'connect');
var friendB = sandbox.PFDRecommendationComposer.compose({
  id: 'friend-rotate-b',
  text: 'Go for a walk with a friend',
  tag: 'Friends',
  categoryId: 'connect',
  connectTargetTags: ['friends']
}, twoFriends, 'connect');
var friendSeen = [friendA && friendA.title, friendB && friendB.title].join(' ');
if (!/Maya/i.test(friendSeen) || !/Jordan/i.test(friendSeen)) {
  fail('two friend names should rotate across shuffles: ' + friendSeen);
}

var twoFamily = baseProfile({
  connectTargets: ['family'],
  familyNames: ['Mom', 'Dad']
});
var familyA = sandbox.PFDRecommendationComposer.compose({
  id: 'family-rotate-a',
  text: 'Call someone in your family just to catch up',
  tag: 'Family',
  categoryId: 'connect',
  connectTargetTags: ['family']
}, twoFamily, 'connect');
var familyB = sandbox.PFDRecommendationComposer.compose({
  id: 'family-rotate-b',
  text: 'Plan a simple meal with family',
  tag: 'Family',
  categoryId: 'connect',
  connectTargetTags: ['family']
}, twoFamily, 'connect');
var familySeen = [familyA && familyA.title, familyB && familyB.title].join(' ');
if (!/Mom/i.test(familySeen) || !/Dad/i.test(familySeen)) {
  fail('two family names should rotate across shuffles: ' + familySeen);
}

if (failures.length) {
  console.error('\nFAILED (' + failures.length + ')');
  failures.slice(0, 50).forEach(function (msg) { console.error(' - ' + msg); });
  process.exit(1);
}

console.log('Personalization guardrails passed.');
