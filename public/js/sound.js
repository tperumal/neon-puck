// sound.js - Web Audio API synthesized sound effects
(function () {
  'use strict';

  var ctx = null;
  var muted = localStorage.getItem('neonpuck_muted') === 'true';

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freq, duration, type, volume, ramp) {
    if (muted) return;
    var c = ensureContext();
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    if (ramp !== false) {
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function playNoise(duration, volume) {
    if (muted) return;
    var c = ensureContext();
    var bufferSize = c.sampleRate * duration;
    var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    var src = c.createBufferSource();
    src.buffer = buffer;
    var gain = c.createGain();
    gain.gain.setValueAtTime(volume || 0.1, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    var filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start();
  }

  window.Sound = {
    init: function () {
      ensureContext();
    },

    wallHit: function () {
      playNoise(0.08, 0.1);
      playTone(300, 0.08, 'square', 0.06);
    },

    paddleHit: function () {
      playTone(500, 0.12, 'triangle', 0.15);
      playTone(700, 0.08, 'sine', 0.08);
    },

    goal: function () {
      playTone(523, 0.15, 'square', 0.2);
      setTimeout(function () { playTone(659, 0.15, 'square', 0.2); }, 100);
      setTimeout(function () { playTone(784, 0.3, 'square', 0.2); }, 200);
    },

    countdown: function () {
      playTone(440, 0.15, 'sine', 0.2);
    },

    countdownGo: function () {
      playTone(880, 0.3, 'sine', 0.25);
    },

    win: function () {
      var notes = [523, 659, 784, 1047, 784, 1047];
      var times = [0, 120, 240, 360, 480, 600];
      for (var i = 0; i < notes.length; i++) {
        (function (n, t) {
          setTimeout(function () { playTone(n, 0.25, 'square', 0.15); }, t);
        })(notes[i], times[i]);
      }
    },

    isMuted: function () {
      return muted;
    },

    toggleMute: function () {
      muted = !muted;
      localStorage.setItem('neonpuck_muted', muted);
      return muted;
    }
  };
})();
