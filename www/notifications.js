/**
 * Passion Flow Daily — local notifications + App Store review (native iOS)
 */
(function (global) {
  var MORNING_NOTIF_ID = 1001;
  var EVENING_NOTIF_ID = 1002;
  var PAYWALL_COMEBACK_ID = 1003;
  var PAYWALL_COMEBACK_MS = 2 * 60 * 1000;

  var MORNING_TIMES = [
    '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM',
    '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM'
  ];
  var EVENING_TIMES = [
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
    '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'
  ];

  function isNative() {
    return !!(
      global.Capacitor &&
      (global.Capacitor.isNativePlatform
        ? global.Capacitor.isNativePlatform()
        : global.Capacitor.isNative)
    );
  }

  function getLocalNotifications() {
    return global.Capacitor &&
      global.Capacitor.Plugins &&
      global.Capacitor.Plugins.LocalNotifications;
  }

  function getInAppReview() {
    return global.Capacitor &&
      global.Capacitor.Plugins &&
      global.Capacitor.Plugins.InAppReview;
  }

  function ratingRequestedKey(uid) {
    return uid ? 'pfd_rating_requested_' + uid : 'pfd_rating_requested';
  }

  function parseTimeLabel(label) {
    if (!label || typeof label !== 'string') return { hour: 8, minute: 0 };
    var m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return { hour: 8, minute: 0 };
    var hour = parseInt(m[1], 10);
    var minute = parseInt(m[2], 10);
    var mer = m[3].toUpperCase();
    if (mer === 'PM' && hour !== 12) hour += 12;
    if (mer === 'AM' && hour === 12) hour = 0;
    return { hour: hour, minute: minute };
  }

  function requestNotificationPermission() {
    var LN = getLocalNotifications();
    if (!LN) return Promise.resolve(false);
    return LN.requestPermissions().then(function (res) {
      return !!(res && (res.display === 'granted' || res.display === 'limited'));
    }).catch(function () {
      return false;
    });
  }

  function cancelIds(ids) {
    var LN = getLocalNotifications();
    if (!LN || !ids.length) return Promise.resolve();
    return LN.cancel({ notifications: ids.map(function (id) { return { id: id }; }) }).catch(function () {});
  }

  function scheduleDaily(id, title, body, timeLabel) {
    var LN = getLocalNotifications();
    if (!LN) return Promise.resolve(false);
    var parts = parseTimeLabel(timeLabel);
    return cancelIds([id]).then(function () {
      return LN.schedule({
        notifications: [{
          id: id,
          title: title,
          body: body,
          extra: { action: id === MORNING_NOTIF_ID ? 'open_daily_flow' : 'open_app' },
          schedule: {
            on: { hour: parts.hour, minute: parts.minute },
            every: 'day'
          }
        }]
      });
    }).then(function () {
      return true;
    }).catch(function (e) {
      if (global.__PFD_DEBUG__) console.warn('[PFD notifications] schedule failed', e);
      return false;
    });
  }

  function syncFromPrefs(prefs) {
    if (!isNative()) return Promise.resolve();
    var LN = getLocalNotifications();
    if (!LN) return Promise.resolve();
    prefs = prefs || {};
    var morningEnabled = !!prefs.morningEnabled;
    var eveningEnabled = !!prefs.eveningEnabled;
    if (!morningEnabled && !eveningEnabled) {
      return cancelIds([MORNING_NOTIF_ID, EVENING_NOTIF_ID]);
    }
    return LN.checkPermissions().then(function (res) {
        var granted = res && (res.display === 'granted' || res.display === 'limited');
        if (!granted) return cancelIds([MORNING_NOTIF_ID, EVENING_NOTIF_ID]);
        var chain = Promise.resolve();
        if (morningEnabled) {
          chain = chain.then(function () {
            return scheduleDaily(
              MORNING_NOTIF_ID,
              'Your Daily Flow is ready ✨',
              'Five little ideas, personalized for you today.',
              prefs.morningTime || '8:00 AM'
            );
          });
        } else {
          chain = chain.then(function () { return cancelIds([MORNING_NOTIF_ID]); });
        }
        if (eveningEnabled) {
          chain = chain.then(function () {
            return scheduleDaily(
              EVENING_NOTIF_ID,
              'A little check-in before the day ends 🌙',
              'See what you did today and take a moment to reflect.',
              prefs.eveningTime || '8:00 PM'
            );
          });
        } else {
          chain = chain.then(function () { return cancelIds([EVENING_NOTIF_ID]); });
        }
        return chain;
      }).catch(function () {
        return cancelIds([MORNING_NOTIF_ID, EVENING_NOTIF_ID]);
      });
  }

  function enableDailyReminders(prefs) {
    if (!isNative()) return Promise.resolve(false);
    prefs = prefs || {};
    return requestNotificationPermission().then(function (granted) {
      if (!granted) return false;
      return syncFromPrefs({
        morningEnabled: true,
        morningTime: prefs.morningTime || '8:00 AM',
        eveningEnabled: true,
        eveningTime: prefs.eveningTime || '8:00 PM'
      }).then(function () {
        return true;
      });
    });
  }

  function enableMorningReminders(timeLabel) {
    if (!isNative()) return Promise.resolve(false);
    return requestNotificationPermission().then(function (granted) {
      if (!granted) return false;
      return scheduleDaily(
        MORNING_NOTIF_ID,
        'Your Daily Flow is ready ✨',
        'Five little ideas, personalized for you today.',
        timeLabel || '8:00 AM'
      );
    });
  }

  function paywallComebackKey(uid) {
    return uid ? 'pfd_paywall_comeback_' + uid : 'pfd_paywall_comeback';
  }

  function paywallComebackAtKey(uid) {
    return paywallComebackKey(uid) + '_at';
  }

  function paywallComebackAlreadySent(uid) {
    try {
      return localStorage.getItem(paywallComebackKey(uid)) === '1';
    } catch (e) {
      return false;
    }
  }

  function markPaywallComebackSent(uid) {
    try {
      localStorage.setItem(paywallComebackKey(uid), '1');
      localStorage.removeItem(paywallComebackAtKey(uid));
    } catch (e) {}
  }

  function setPaywallComebackPendingAt(uid, at) {
    try {
      localStorage.setItem(paywallComebackAtKey(uid), String(at));
    } catch (e) {}
  }

  function clearPaywallComebackPending(uid) {
    try {
      localStorage.removeItem(paywallComebackAtKey(uid));
    } catch (e) {}
  }

  function cancelPaywallComeback(alsoRemoveDelivered) {
    return cancelIds([PAYWALL_COMEBACK_ID]).then(function () {
      if (!alsoRemoveDelivered) return;
      var LN = getLocalNotifications();
      if (!LN || !LN.removeDeliveredNotifications) return;
      // Pull the banner out of Notification Center so a new subscriber is not
      // still looking at an upsell they already paid for.
      return LN.removeDeliveredNotifications({
        notifications: [{ id: PAYWALL_COMEBACK_ID }]
      }).catch(function () {});
    }).catch(function () {});
  }

  /**
   * On foreground: a pending comeback that already passed its fire time was
   * delivered, so it counts as used. One that has not fired yet is cancelled
   * and given back, since the user returned on their own.
   */
  function resolvePaywallComebackOnForeground(uid) {
    var at = 0;
    try {
      at = parseInt(localStorage.getItem(paywallComebackAtKey(uid)) || '0', 10) || 0;
    } catch (e) {
      at = 0;
    }
    if (!at) return cancelPaywallComeback().then(function () { return false; });
    if (Date.now() >= at) {
      markPaywallComebackSent(uid);
      return cancelPaywallComeback().then(function () { return true; });
    }
    clearPaywallComebackPending(uid);
    return cancelPaywallComeback().then(function () { return false; });
  }

  function schedulePaywallComeback(uid) {
    if (!isNative()) return Promise.resolve(false);
    if (paywallComebackAlreadySent(uid)) return Promise.resolve(false);
    var LN = getLocalNotifications();
    if (!LN) return Promise.resolve(false);
    return LN.checkPermissions().then(function (res) {
      var granted = res && (res.display === 'granted' || res.display === 'limited');
      if (!granted) return false;
      var fireAt = Date.now() + PAYWALL_COMEBACK_MS;
      return cancelIds([PAYWALL_COMEBACK_ID]).then(function () {
        return LN.schedule({
          notifications: [{
            id: PAYWALL_COMEBACK_ID,
            title: 'Your Daily Flow is waiting ✨',
            body: 'Five ideas, picked around you, are ready.',
            extra: { action: 'open_paywall' },
            schedule: { at: new Date(fireAt) }
          }]
        });
      }).then(function () {
        setPaywallComebackPendingAt(uid, fireAt);
        return true;
      });
    }).catch(function (e) {
      if (global.__PFD_DEBUG__) console.warn('[PFD notifications] paywall comeback failed', e);
      return false;
    });
  }

  function requestAppReview(uid) {
    if (!isNative()) return;
    try {
      if (global.localStorage.getItem(ratingRequestedKey(uid)) === '1') return;
      global.localStorage.setItem(ratingRequestedKey(uid), '1');
    } catch (e) {
      return;
    }
    var review = getInAppReview();
    if (!review || !review.requestReview) return;
    setTimeout(function () {
      review.requestReview().catch(function () {});
      if (global.trackEvent) global.trackEvent('app_review_requested');
    }, 1600);
  }

  global.PFDNotifications = {
    MORNING_NOTIF_ID: MORNING_NOTIF_ID,
    EVENING_NOTIF_ID: EVENING_NOTIF_ID,
    PAYWALL_COMEBACK_ID: PAYWALL_COMEBACK_ID,
    MORNING_TIMES: MORNING_TIMES,
    EVENING_TIMES: EVENING_TIMES,
    isNative: isNative,
    parseTimeLabel: parseTimeLabel,
    enableDailyReminders: enableDailyReminders,
    enableMorningReminders: enableMorningReminders,
    syncFromPrefs: syncFromPrefs,
    requestAppReview: requestAppReview,
    requestNotificationPermission: requestNotificationPermission,
    schedulePaywallComeback: schedulePaywallComeback,
    cancelPaywallComeback: cancelPaywallComeback,
    markPaywallComebackSent: markPaywallComebackSent,
    paywallComebackAlreadySent: paywallComebackAlreadySent,
    clearPaywallComebackPending: clearPaywallComebackPending,
    resolvePaywallComebackOnForeground: resolvePaywallComebackOnForeground
  };
})(window);
