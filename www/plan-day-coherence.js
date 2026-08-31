/**
 * Passion Flow Daily — Plan My Day coherence validator
 */
(function (global) {
  function effortOf(item) {
    return (item && item.effortScore) || 2;
  }

  function totalEffort(plan) {
    var sum = 0;
    var n = 0;
    Object.keys(plan || {}).forEach(function (k) {
      if (plan[k]) { sum += effortOf(plan[k]); n++; }
    });
    return n ? sum / n : 0;
  }

  function countProductivityHeavy(plan) {
    var c = 0;
    Object.keys(plan || {}).forEach(function (k) {
      var it = plan[k];
      if (it && it.productivityHeavy) c++;
    });
    return c;
  }

  function hasNovelty(plan) {
    return Object.keys(plan || {}).some(function (k) {
      var it = plan[k];
      return it && (it.noveltyLevel >= 2 || (it.resetStyleTags || []).indexOf('solo_reset') >= 0);
    });
  }

  function hasOffline(plan) {
    return Object.keys(plan || {}).some(function (k) {
      var it = plan[k];
      return it && (it.offline || (it.helpfulForFrictions || []).indexOf('phone_overuse') >= 0);
    });
  }

  function refinePlan(plan, profile, ctx) {
    if (!plan || !global.PFDRecommendationEngine) return plan;
    var fr = profile.coreFrictions || [];
    var budget = global.PFDRecommendationEngine.dayBudget(profile);
    var avg = totalEffort(plan);
    var cats = Object.keys(plan);

    if (avg > budget.maxEffort + 0.5) {
      cats.sort(function (a, b) { return effortOf(plan[b]) - effortOf(plan[a]); });
      var heavyCat = cats[0];
      if (heavyCat) {
        var repick = global.PFDRecommendationEngine.pickForCategory(heavyCat, profile, Object.assign({}, ctx, {
          categoryId: heavyCat,
          excludeIds: cats.filter(function (c) { return c !== heavyCat; }).map(function (c) { return plan[c] && plan[c].id; }).filter(Boolean)
        }));
        if (repick && repick.effortScore < effortOf(plan[heavyCat])) plan[heavyCat] = repick;
      }
    }

    if (fr.indexOf('work_switch_off') >= 0 && countProductivityHeavy(plan) >= 2) {
      cats.forEach(function (cat) {
        if (plan[cat] && plan[cat].productivityHeavy && cat !== 'create') {
          var alt = global.PFDRecommendationEngine.pickForCategory(cat, profile, Object.assign({}, ctx, { categoryId: cat }));
          if (alt && !alt.productivityHeavy) plan[cat] = alt;
        }
      });
    }

    if (fr.indexOf('repetitive_days') >= 0 && !hasNovelty(plan)) {
      ['connect', 'move', 'nourish'].some(function (cat) {
        var alt = global.PFDRecommendationEngine.pickForCategory(cat, profile, Object.assign({}, ctx, { categoryId: cat }));
        if (alt && alt.noveltyLevel >= 2) { plan[cat] = alt; return true; }
        return false;
      });
    }

    if (fr.indexOf('phone_overuse') >= 0 && !hasOffline(plan)) {
      var resetAlt = global.PFDRecommendationEngine.pickForCategory('nourish', profile, Object.assign({}, ctx, { categoryId: 'nourish' }));
      if (resetAlt && resetAlt.offline) plan.nourish = resetAlt;
    }

    return plan;
  }

  global.PFDPlanCoherence = {
    refinePlan: refinePlan,
    totalEffort: totalEffort
  };
})(window);
