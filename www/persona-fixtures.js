/**
 * Passion Flow Daily — dev persona fixtures (console testing)
 */
(function (global) {
  var C = global.PFDConstants;
  if (!C) return;

  var personas = {
    creative_student: Object.assign(C.createEmptyProfileV3(), {
      overallGoals: ['more_creativity', 'fun_novelty'],
      coreFrictions: ['choice_overload', 'phone_overuse'],
      lifeContext: ['student'],
      dayBandwidth: 'pretty_full',
      defaultTimeBucket: 'short',
      createInterests: ['art_crafts', 'writing'],
      mindsetFormats: ['journaling'],
      connectTargets: ['friends'],
      movePreferences: ['walking'],
      resetStyles: ['offline_reset'],
      deepPersonalizationCompleted: true,
      completedAt: Date.now()
    }),
    busy_parent: Object.assign(C.createEmptyProfileV3(), {
      overallGoals: ['time_for_self', 'deeper_relationships'],
      coreFrictions: ['others_first', 'low_energy'],
      lifeContext: ['caregiver', 'work_from_home'],
      dayBandwidth: 'very_full',
      defaultTimeBucket: 'micro',
      connectTargets: ['partner', 'family'],
      partnerConnectionStyles: ['cozy'],
      partnerName: 'Alex',
      resetStyles: ['rest_reset', 'self_care'],
      deepPersonalizationCompleted: true,
      completedAt: Date.now()
    }),
    movement_seeker: Object.assign(C.createEmptyProfileV3(), {
      overallGoals: ['movement_energy', 'peace_presence'],
      coreFrictions: ['repetitive_days', 'work_switch_off'],
      lifeContext: ['full_time_work'],
      dayBandwidth: 'balanced',
      defaultTimeBucket: 'short',
      movePreferences: ['running', 'hiking', 'yoga_stretch'],
      moveDesiredFeelings: ['energizing', 'calming'],
      mindsetNeeds: ['presence'],
      resetStyles: ['nature_reset'],
      deepPersonalizationCompleted: true,
      completedAt: Date.now()
    }),
    builder: Object.assign(C.createEmptyProfileV3(), {
      overallGoals: ['structure_consistency', 'personal_growth'],
      coreFrictions: ['overthinking', 'activation_difficulty'],
      lifeContext: ['self_employed'],
      dayBandwidth: 'very_flexible',
      defaultTimeBucket: 'medium',
      createInterests: ['building_business', 'content_creation'],
      createBuildingType: 'side_hustle',
      projectNames: ['my startup'],
      mindsetNeeds: ['decision_making', 'motivation'],
      mindsetFormats: ['learning', 'podcasts'],
      deepPersonalizationCompleted: true,
      completedAt: Date.now()
    }),
    minimal_layer1: Object.assign(C.createEmptyProfileV3(), {
      overallGoals: ['peace_presence'],
      coreFrictions: ['time_pressure'],
      lifeContext: ['flexible_schedule'],
      dayBandwidth: 'balanced',
      defaultTimeBucket: 'flexible',
      deepPersonalizationCompleted: false,
      completedAt: Date.now()
    })
  };

  global.PFDPersonas = personas;
  if (global.__PFD_DEBUG__) {
    console.log('[PFD] Personas available: window.PFDPersonas — keys:', Object.keys(personas));
  }
})(window);
