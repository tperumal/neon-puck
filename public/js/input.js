// input.js - Touch and mouse input handling
(function () {
  'use strict';

  var canvas = null;
  var touches = {}; // touchId -> { playerId, x, y }
  var mouseDown = false;
  var mousePlayer = 0;
  var onMove = null; // callback(playerId, x, y) in game coordinates

  // Convert page coordinates to game (physics) coordinates
  function pageToGame(pageX, pageY) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = Physics.WIDTH / rect.width;
    var scaleY = Physics.HEIGHT / rect.height;
    return {
      x: (pageX - rect.left) * scaleX,
      y: (pageY - rect.top) * scaleY
    };
  }

  // Determine which player a position belongs to (for local mode)
  function playerForX(gameX) {
    return gameX < Physics.WIDTH / 2 ? 1 : 2;
  }

  // --- Touch Events ---
  function handleTouchStart(e) {
    e.preventDefault();
    Sound.init();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var pos = pageToGame(t.pageX, t.pageY);
      var player = playerForX(pos.x);

      // In online mode, Input.onlinePlayer is set - only track that player
      if (Input.onlinePlayer) {
        player = Input.onlinePlayer;
      }

      touches[t.identifier] = { playerId: player, x: pos.x, y: pos.y };
      if (onMove) onMove(player, pos.x, pos.y);
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var info = touches[t.identifier];
      if (!info) continue;
      var pos = pageToGame(t.pageX, t.pageY);
      info.x = pos.x;
      info.y = pos.y;
      if (onMove) onMove(info.playerId, pos.x, pos.y);
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      delete touches[e.changedTouches[i].identifier];
    }
  }

  // --- Mouse Events ---
  function handleMouseDown(e) {
    Sound.init();
    mouseDown = true;
    var pos = pageToGame(e.pageX, e.pageY);
    mousePlayer = Input.onlinePlayer || playerForX(pos.x);
    if (onMove) onMove(mousePlayer, pos.x, pos.y);
  }

  function handleMouseMove(e) {
    if (!mouseDown) return;
    var pos = pageToGame(e.pageX, e.pageY);
    if (onMove) onMove(mousePlayer, pos.x, pos.y);
  }

  function handleMouseUp() {
    mouseDown = false;
  }

  // Prevent Safari gestures
  function preventGestures(e) {
    e.preventDefault();
  }

  window.Input = {
    onlinePlayer: 0, // 0 = local mode, 1 or 2 = online player number

    init: function (canvasEl, moveCallback) {
      canvas = canvasEl;
      onMove = moveCallback;

      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // Prevent Safari double-tap zoom and pinch
      document.addEventListener('gesturestart', preventGestures, { passive: false });
      document.addEventListener('gesturechange', preventGestures, { passive: false });
      document.addEventListener('gestureend', preventGestures, { passive: false });
    },

    destroy: function () {
      if (!canvas) return;
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    },

    pageToGame: pageToGame
  };
})();
