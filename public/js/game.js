// game.js - Main game controller: state machine, rendering, game loop
(function () {
  'use strict';

  var canvas, ctx;
  var W, H, scale;
  var state = null; // Physics game state
  var mode = null; // 'local' | 'online'
  var gamePhase = 'menu'; // menu | countdown | playing | goal | gameover
  var countdownValue = 3;
  var countdownTimer = null;
  var particles = [];
  var trailPoints = [];
  var screenShake = 0;
  var goalFlashAlpha = 0;

  function hexToRgba(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',1)';
  }

  // Colors
  var P1_COLOR = '#ff6b6b';
  var P2_COLOR = '#4ecdc4';
  var PUCK_COLOR = '#ffffff';
  var BG_COLOR = '#1a1a2e';
  var TABLE_COLOR = '#16213e';
  var LINE_COLOR = '#0f3460';

  // --- Canvas Setup ---
  function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Fit 800x400 (2:1) into available space
    var gameAspect = Physics.WIDTH / Physics.HEIGHT;
    var screenAspect = w / h;

    if (screenAspect > gameAspect) {
      // Screen is wider - fit to height
      H = h;
      W = h * gameAspect;
    } else {
      // Screen is taller - fit to width
      W = w;
      H = w / gameAspect;
    }

    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.style.left = ((w - W) / 2) + 'px';
    canvas.style.top = ((h - H) / 2) + 'px';

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    scale = W / Physics.WIDTH;
  }

  // --- Drawing ---
  function sx(x) { return x * scale; }
  function sy(y) { return y * scale; }

  function drawTable() {
    // Background
    ctx.fillStyle = TABLE_COLOR;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Center line
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, sx(50), 0, Math.PI * 2);
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Goals
    var goalTop = sy(Physics.GOAL_TOP);
    var goalBottom = sy(Physics.GOAL_BOTTOM);

    // Left goal
    ctx.fillStyle = P2_COLOR + '33';
    ctx.fillRect(0, goalTop, sx(8), goalBottom - goalTop);
    ctx.strokeStyle = P2_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx(8), goalTop);
    ctx.lineTo(0, goalTop);
    ctx.lineTo(0, goalBottom);
    ctx.lineTo(sx(8), goalBottom);
    ctx.stroke();

    // Right goal
    ctx.fillStyle = P1_COLOR + '33';
    ctx.fillRect(W - sx(8), goalTop, sx(8), goalBottom - goalTop);
    ctx.strokeStyle = P1_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W - sx(8), goalTop);
    ctx.lineTo(W, goalTop);
    ctx.lineTo(W, goalBottom);
    ctx.lineTo(W - sx(8), goalBottom);
    ctx.stroke();
  }

  function drawPuck(puck) {
    var x = sx(puck.x);
    var y = sy(puck.y);
    var r = sx(puck.radius);

    // Trail
    trailPoints.push({ x: x, y: y, alpha: 1 });
    if (trailPoints.length > 12) trailPoints.shift();

    for (var i = 0; i < trailPoints.length - 1; i++) {
      var tp = trailPoints[i];
      tp.alpha -= 0.08;
      if (tp.alpha > 0) {
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, r * 0.6 * tp.alpha, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (tp.alpha * 0.3) + ')';
        ctx.fill();
      }
    }

    // Glow
    ctx.save();
    ctx.shadowColor = PUCK_COLOR;
    ctx.shadowBlur = 15;

    // Puck body
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = PUCK_COLOR;
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    ctx.restore();
  }

  function drawPaddle(paddle, color) {
    var x = sx(paddle.x);
    var y = sy(paddle.y);
    var r = sx(paddle.radius);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0, Math.PI * 2);
    ctx.fillStyle = color + '88';
    ctx.fill();

    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  function drawScores() {
    if (!state) return;
    ctx.save();
    ctx.font = 'bold ' + Math.round(sx(40)) + 'px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Player 1 score (left side)
    ctx.fillStyle = P1_COLOR + '88';
    ctx.fillText(state.scores[0], W * 0.3, sy(15));

    // Player 2 score (right side)
    ctx.fillStyle = P2_COLOR + '88';
    ctx.fillText(state.scores[1], W * 0.7, sy(15));

    ctx.restore();
  }

  function drawParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('1)', p.life + ')');
      ctx.fill();
    }
  }

  function spawnGoalParticles(goalSide) {
    var x = goalSide === 1 ? W : 0;
    var y = H / 2;
    var color = goalSide === 1 ? P1_COLOR : P2_COLOR;
    for (var i = 0; i < 40; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 5;
      particles.push({
        x: x,
        y: y + (Math.random() - 0.5) * sy(Physics.GOAL_HEIGHT),
        vx: Math.cos(angle) * speed * (goalSide === 1 ? -1 : 1),
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        color: hexToRgba(color)
      });
    }
  }

  function spawnWinParticles() {
    for (var i = 0; i < 80; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 6;
      var colors = [P1_COLOR, P2_COLOR, '#ffd93d', PUCK_COLOR];
      var c = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.5,
        y: H / 2 + (Math.random() - 0.5) * H * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        life: 1,
        decay: 0.008 + Math.random() * 0.008,
        color: hexToRgba(c)
      });
    }
  }

  function render() {
    ctx.save();

    // Screen shake
    if (screenShake > 0) {
      var sx2 = (Math.random() - 0.5) * screenShake;
      var sy2 = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx2, sy2);
      screenShake *= 0.9;
      if (screenShake < 0.5) screenShake = 0;
    }

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    drawTable();

    if (state && gamePhase !== 'menu') {
      drawPuck(state.puck);
      drawPaddle(state.paddles[0], P1_COLOR);
      drawPaddle(state.paddles[1], P2_COLOR);
      drawScores();
    }

    drawParticles();

    // Goal flash
    if (goalFlashAlpha > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + goalFlashAlpha + ')';
      ctx.fillRect(0, 0, W, H);
      goalFlashAlpha -= 0.03;
    }

    ctx.restore();
  }

  // --- Game Loop ---
  function localGameLoop() {
    if (gamePhase !== 'playing' || mode !== 'local') return;

    var event = Physics.step(state);
    if (event === 'wallHit') Sound.wallHit();
    if (event === 'paddleHit') Sound.paddleHit();
    if (event === 'goal') {
      gamePhase = 'goal';
      Sound.goal();
      spawnGoalParticles(state.lastGoalBy);
      screenShake = 10;
      goalFlashAlpha = 0.4;
      UI.showGoal();
      var serveDir = state.lastGoalBy === 1 ? -1 : 1; // serve toward the scored-on player
      setTimeout(function () {
        Physics.resetPuck(state, serveDir);
        trailPoints = [];
        startCountdown(function () {
          gamePhase = 'playing';
        });
      }, 1200);
    }
    if (event === 'win') {
      gamePhase = 'gameover';
      Sound.win();
      spawnWinParticles();
      screenShake = 15;
      goalFlashAlpha = 0.5;
      setTimeout(function () {
        UI.showGameOver(state.lastGoalBy, state.scores);
      }, 1500);
    }
  }

  function renderLoop() {
    try {
      if (mode === 'local' && gamePhase === 'playing') {
        localGameLoop();
      }
      render();
    } catch (e) {
      console.error('Render error:', e);
    }
    requestAnimationFrame(renderLoop);
  }

  // --- Countdown ---
  function startCountdown(onComplete) {
    countdownValue = 3;
    gamePhase = 'countdown';
    UI.showCountdown(countdownValue);
    Sound.countdown();

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      countdownValue--;
      if (countdownValue > 0) {
        UI.showCountdown(countdownValue);
        Sound.countdown();
      } else if (countdownValue === 0) {
        UI.showCountdown(0);
        Sound.countdownGo();
      } else {
        clearInterval(countdownTimer);
        countdownTimer = null;
        UI.hideCountdown();
        if (onComplete) onComplete();
      }
    }, 700);
  }

  // --- Input Handler ---
  function handlePaddleMove(playerId, x, y) {
    if (!state) return;

    if (mode === 'online') {
      // In online mode, send to server
      Network.sendPaddle(x, y);
      // Also update local paddle for immediate feedback
      var myNum = Network.getPlayerNumber();
      var paddle = state.paddles[myNum - 1];
      paddle.x = x;
      paddle.y = y;
      Physics.clampPaddlePosition(paddle);
    } else if (mode === 'local') {
      var paddle = state.paddles[playerId - 1];
      paddle.x = x;
      paddle.y = y;
      Physics.clampPaddlePosition(paddle);
    }
  }

  // --- Mode Start ---
  function startLocal() {
    mode = 'local';
    Input.onlinePlayer = 0;
    state = Physics.createGameState();
    trailPoints = [];
    particles = [];
    UI.hideAllScreens();
    startCountdown(function () {
      gamePhase = 'playing';
    });
  }

  function startOnline(asCreator) {
    mode = 'online';
    state = Physics.createGameState();
    trailPoints = [];
    particles = [];

    // Set up network callbacks
    Network.on('onRoomCreated', function (code) {
      UI.setRoomCode(code);
    });

    Network.on('onOpponentJoined', function () {
      UI.setCreateStatus('Opponent connected!');
      Input.onlinePlayer = Network.getPlayerNumber();
      UI.hideAllScreens();
      // Server will send countdown
    });

    Network.on('onRoomJoined', function (code, playerNum) {
      Input.onlinePlayer = playerNum;
      UI.hideAllScreens();
      // Server will send countdown
    });

    Network.on('onJoinError', function (msg) {
      UI.setJoinError(msg);
    });

    Network.on('onOpponentLeft', function () {
      // Go back to menu if opponent disconnects during game
      if (gamePhase === 'playing' || gamePhase === 'countdown') {
        gamePhase = 'menu';
        mode = null;
        UI.showScreen('menu');
      }
    });

    Network.on('onGameState', function (data) {
      if (!state) return;
      // Update puck from server
      state.puck.x = data.puck.x;
      state.puck.y = data.puck.y;
      state.puck.vx = data.puck.vx;
      state.puck.vy = data.puck.vy;

      // Update opponent paddle
      var myNum = Network.getPlayerNumber();
      var oppIdx = myNum === 1 ? 1 : 0;
      state.paddles[oppIdx].x = data.paddles[oppIdx].x;
      state.paddles[oppIdx].y = data.paddles[oppIdx].y;

      state.scores = data.scores;
    });

    Network.on('onGoal', function (data) {
      gamePhase = 'goal';
      state.scores = data.scores;
      Sound.goal();
      spawnGoalParticles(data.scorer);
      screenShake = 10;
      goalFlashAlpha = 0.4;
      UI.showGoal();
      // Server will reset and send countdown
    });

    Network.on('onGameOver', function (data) {
      gamePhase = 'gameover';
      state.scores = data.scores;
      Sound.win();
      spawnWinParticles();
      screenShake = 15;
      goalFlashAlpha = 0.5;
      setTimeout(function () {
        UI.showGameOver(data.winner, data.scores);
      }, 1500);
    });

    Network.on('onCountdown', function (data) {
      if (data.value === 3) {
        state = Physics.createGameState();
        trailPoints = [];
        gamePhase = 'countdown';
      }
      if (data.value > 0) {
        UI.showCountdown(data.value);
        Sound.countdown();
      } else if (data.value === 0) {
        UI.showCountdown(0);
        Sound.countdownGo();
      } else {
        // -1 means go
        UI.hideCountdown();
        gamePhase = 'playing';
      }
    });

    Network.on('onRematch', function () {
      UI.hideAllScreens();
      state = Physics.createGameState();
      trailPoints = [];
      particles = [];
      // Server will send countdown
    });

    if (asCreator) {
      Network.createRoom();
      UI.showScreen('create');
    }
    // join is triggered by the join button handler
  }

  // --- Init ---
  function init() {
    initCanvas();
    UI.init();
    Input.init(canvas, handlePaddleMove);

    // Sound button
    var soundBtn = document.getElementById('btn-sound');
    UI.updateSoundButton(Sound.isMuted());
    soundBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var muted = Sound.toggleMute();
      UI.updateSoundButton(muted);
    });

    // Menu buttons
    document.getElementById('btn-play').addEventListener('click', function () {
      Sound.init();
      UI.showScreen('mode');
    });

    document.getElementById('btn-local').addEventListener('click', function () {
      startLocal();
    });

    document.getElementById('btn-create').addEventListener('click', function () {
      startOnline(true);
    });

    document.getElementById('btn-join').addEventListener('click', function () {
      startOnline(false);
      UI.clearCodeInput();
      UI.setJoinError('');
      UI.showScreen('join');
    });

    document.getElementById('btn-join-go').addEventListener('click', function () {
      var code = UI.getCodeInput();
      if (code.length !== 4) {
        UI.setJoinError('Enter a 4-letter code');
        return;
      }
      UI.setJoinError('');
      Network.joinRoom(code);
    });

    // Back buttons
    document.getElementById('btn-back-mode').addEventListener('click', function () {
      UI.showScreen('menu');
    });

    document.getElementById('btn-back-create').addEventListener('click', function () {
      Network.leaveRoom();
      mode = null;
      UI.showScreen('mode');
    });

    document.getElementById('btn-back-join').addEventListener('click', function () {
      Network.leaveRoom();
      mode = null;
      UI.showScreen('mode');
    });

    document.getElementById('btn-rematch').addEventListener('click', function () {
      if (mode === 'online') {
        Network.requestRematch();
        UI.hideAllScreens();
        // Wait for server rematchStart
      } else {
        startLocal();
      }
    });

    document.getElementById('btn-back-gameover').addEventListener('click', function () {
      if (mode === 'online') {
        Network.leaveRoom();
      }
      mode = null;
      gamePhase = 'menu';
      UI.showScreen('menu');
    });

    // Start render loop
    UI.showScreen('menu');
    requestAnimationFrame(renderLoop);
  }

  // Go!
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
