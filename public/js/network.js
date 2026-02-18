// network.js - Socket.io client wrapper
(function () {
  'use strict';

  var socket = null;
  var roomCode = null;
  var playerNumber = 0;
  var connected = false;

  // Callbacks set by game.js
  var callbacks = {
    onRoomCreated: null,
    onRoomJoined: null,
    onJoinError: null,
    onOpponentJoined: null,
    onOpponentLeft: null,
    onGameState: null,
    onGoal: null,
    onGameOver: null,
    onCountdown: null,
    onRematch: null
  };

  function getServerUrl() {
    // When running inside Capacitor, connect to the Render server explicitly
    // instead of same-origin (which would be capacitor://localhost).
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return 'https://neon-puck.onrender.com';
    }
    return undefined; // same-origin when served from Express
  }

  function connect() {
    if (socket) return;
    var url = getServerUrl();
    var opts = { reconnection: true, reconnectionDelay: 500, reconnectionAttempts: 10 };
    // In Capacitor's WKWebView, XHR polling from capacitor:// origin is
    // blocked by CORS. Force WebSocket transport to skip polling handshake.
    if (url) {
      opts.transports = ['websocket'];
    }
    socket = io(url, opts);

    socket.on('connect', function () {
      connected = true;
    });

    socket.on('disconnect', function () {
      connected = false;
    });

    socket.on('roomCreated', function (data) {
      roomCode = data.code;
      playerNumber = 1;
      if (callbacks.onRoomCreated) callbacks.onRoomCreated(data.code);
    });

    socket.on('roomJoined', function (data) {
      roomCode = data.code;
      playerNumber = data.playerNumber;
      if (callbacks.onRoomJoined) callbacks.onRoomJoined(data.code, data.playerNumber);
    });

    socket.on('joinError', function (data) {
      if (callbacks.onJoinError) callbacks.onJoinError(data.message);
    });

    socket.on('opponentJoined', function () {
      if (callbacks.onOpponentJoined) callbacks.onOpponentJoined();
    });

    socket.on('opponentLeft', function () {
      if (callbacks.onOpponentLeft) callbacks.onOpponentLeft();
    });

    socket.on('gameState', function (data) {
      if (callbacks.onGameState) callbacks.onGameState(data);
    });

    socket.on('goal', function (data) {
      if (callbacks.onGoal) callbacks.onGoal(data);
    });

    socket.on('gameOver', function (data) {
      if (callbacks.onGameOver) callbacks.onGameOver(data);
    });

    socket.on('countdown', function (data) {
      if (callbacks.onCountdown) callbacks.onCountdown(data);
    });

    socket.on('rematchStart', function () {
      if (callbacks.onRematch) callbacks.onRematch();
    });
  }

  window.Network = {
    connect: connect,

    on: function (event, cb) {
      callbacks[event] = cb;
    },

    createRoom: function () {
      connect();
      socket.emit('createRoom');
    },

    joinRoom: function (code) {
      connect();
      socket.emit('joinRoom', { code: code.toUpperCase() });
    },

    sendPaddle: function (x, y) {
      if (!socket || !connected) return;
      socket.volatile.emit('paddle', { x: x, y: y });
    },

    requestRematch: function () {
      if (!socket) return;
      socket.emit('rematch');
    },

    leaveRoom: function () {
      if (!socket) return;
      socket.emit('leaveRoom');
      roomCode = null;
      playerNumber = 0;
    },

    getPlayerNumber: function () {
      return playerNumber;
    },

    getRoomCode: function () {
      return roomCode;
    },

    isConnected: function () {
      return connected;
    }
  };
})();
