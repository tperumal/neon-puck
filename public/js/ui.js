// ui.js - Menu screens and overlays
(function () {
  'use strict';

  var screens = {};
  var overlays = {};

  function getEl(id) {
    return document.getElementById(id);
  }

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.remove('active');
    });
    if (screens[name]) {
      screens[name].classList.add('active');
    }
  }

  function showOverlay(name) {
    if (overlays[name]) {
      overlays[name].classList.add('active');
    }
  }

  function hideOverlay(name) {
    if (overlays[name]) {
      overlays[name].classList.remove('active');
    }
  }

  function hideAllScreens() {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.remove('active');
    });
  }

  window.UI = {
    init: function () {
      screens = {
        menu: getEl('menu-screen'),
        mode: getEl('mode-screen'),
        create: getEl('create-screen'),
        join: getEl('join-screen'),
        gameover: getEl('gameover-screen')
      };
      overlays = {
        countdown: getEl('countdown-overlay'),
        goal: getEl('goal-overlay')
      };
    },

    showScreen: showScreen,
    hideAllScreens: hideAllScreens,
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,

    setRoomCode: function (code) {
      getEl('room-code').textContent = code;
    },

    setCreateStatus: function (msg) {
      getEl('create-status').textContent = msg;
    },

    setJoinError: function (msg) {
      getEl('join-error').textContent = msg;
    },

    getCodeInput: function () {
      return getEl('code-input').value.toUpperCase().trim();
    },

    clearCodeInput: function () {
      getEl('code-input').value = '';
    },

    showCountdown: function (number) {
      var text = getEl('countdown-text');
      text.textContent = number === 0 ? 'GO!' : number;
      // Re-trigger animation
      text.style.animation = 'none';
      // Force reflow
      void text.offsetHeight;
      text.style.animation = '';
      showOverlay('countdown');
    },

    hideCountdown: function () {
      hideOverlay('countdown');
    },

    showGoal: function () {
      showOverlay('goal');
      setTimeout(function () {
        hideOverlay('goal');
      }, 1000);
    },

    showGameOver: function (winnerPlayer, scores) {
      var winnerText = getEl('winner-text');
      winnerText.textContent = 'PLAYER ' + winnerPlayer + ' WINS!';
      winnerText.className = 'winner-text p' + winnerPlayer;
      getEl('final-score').textContent = scores[0] + ' - ' + scores[1];
      showScreen('gameover');
    },

    updateSoundButton: function (muted) {
      var btn = getEl('btn-sound');
      btn.textContent = muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
      btn.classList.toggle('muted', muted);
    }
  };
})();
