/**
 * Passion Flow Daily — Firebase Analytics wrapper
 */
(function (global) {
  function trackEvent(name, params) {
    if (!name) return;
    var payload = params || {};
    try {
      if (global.firebase && global.firebase.analytics) {
        global.firebase.analytics().logEvent(name, payload);
      }
    } catch (e) {
      /* analytics unavailable (offline, blocked, etc.) */
    }
    if (global.__PFD_DEBUG__) {
      console.log('[PFD analytics]', name, payload);
    }
  }

  global.PFDAnalytics = { trackEvent: trackEvent };
  global.trackEvent = trackEvent;
})(window);
