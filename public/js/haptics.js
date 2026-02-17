// haptics.js - Capacitor Haptics wrapper (no-ops on web)
(function () {
  'use strict';

  var haptics = null;
  var available = false;

  function init() {
    if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
      haptics = window.Capacitor.Plugins.Haptics;
      available = true;
    }
  }

  window.Haptics = {
    init: init,

    light: function () {
      if (!available) return;
      haptics.impact({ style: 'LIGHT' });
    },

    medium: function () {
      if (!available) return;
      haptics.impact({ style: 'MEDIUM' });
    },

    heavy: function () {
      if (!available) return;
      haptics.impact({ style: 'HEAVY' });
    },

    notification: function (type) {
      if (!available) return;
      haptics.notification({ type: type || 'SUCCESS' });
    }
  };
})();
