// physics.js - UMD module for shared client/server physics
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Physics = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Constants ---
  var WIDTH = 800;
  var HEIGHT = 400;
  var PUCK_RADIUS = 15;
  var PADDLE_RADIUS = 25;
  var PUCK_FRICTION = 0.995;
  var PUCK_MAX_SPEED = 15;
  var GOAL_HEIGHT = 140;
  var GOAL_TOP = (HEIGHT - GOAL_HEIGHT) / 2;
  var GOAL_BOTTOM = GOAL_TOP + GOAL_HEIGHT;
  var WIN_SCORE = 7;
  var WALL_BOUNCE = 0.8;
  var PADDLE_BOUNCE = 1.1;

  function createPuck() {
    return {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: PUCK_RADIUS
    };
  }

  function createPaddle(player) {
    return {
      x: player === 1 ? 100 : WIDTH - 100,
      y: HEIGHT / 2,
      prevX: player === 1 ? 100 : WIDTH - 100,
      prevY: HEIGHT / 2,
      radius: PADDLE_RADIUS,
      player: player
    };
  }

  function createGameState() {
    return {
      puck: createPuck(),
      paddles: [createPaddle(1), createPaddle(2)],
      scores: [0, 0],
      lastGoalBy: 0
    };
  }

  function clampPaddlePosition(paddle) {
    var minY = paddle.radius;
    var maxY = HEIGHT - paddle.radius;
    paddle.y = Math.max(minY, Math.min(maxY, paddle.y));

    var minX = paddle.radius;
    var maxX = WIDTH - paddle.radius;

    if (paddle.player === 1) {
      // Left half only
      paddle.x = Math.max(minX, Math.min(WIDTH / 2 - paddle.radius, paddle.x));
    } else {
      // Right half only
      paddle.x = Math.max(WIDTH / 2 + paddle.radius, Math.min(maxX, paddle.x));
    }
  }

  function circleCollision(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minDist = a.radius + b.radius;
    return dist < minDist ? { dx: dx, dy: dy, dist: dist, minDist: minDist } : null;
  }

  function resolvePaddlePuckCollision(paddle, puck) {
    var col = circleCollision(paddle, puck);
    if (!col) return false;

    // Separate puck from paddle
    var overlap = col.minDist - col.dist;
    var nx = col.dx / col.dist;
    var ny = col.dy / col.dist;
    puck.x += nx * overlap;
    puck.y += ny * overlap;

    // Paddle velocity (from position change)
    var pvx = paddle.x - paddle.prevX;
    var pvy = paddle.y - paddle.prevY;

    // Relative velocity
    var dvx = puck.vx - pvx;
    var dvy = puck.vy - pvy;

    // Only resolve if objects are moving toward each other
    var dot = dvx * nx + dvy * ny;
    if (dot > 0) return true; // Already separating

    // Reflect puck velocity along collision normal and add paddle velocity
    puck.vx -= (1 + PADDLE_BOUNCE) * dot * nx;
    puck.vy -= (1 + PADDLE_BOUNCE) * dot * ny;

    // Clamp puck speed
    var speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
    if (speed > PUCK_MAX_SPEED) {
      puck.vx = (puck.vx / speed) * PUCK_MAX_SPEED;
      puck.vy = (puck.vy / speed) * PUCK_MAX_SPEED;
    }

    return true;
  }

  function updatePuck(puck) {
    puck.x += puck.vx;
    puck.y += puck.vy;
    puck.vx *= PUCK_FRICTION;
    puck.vy *= PUCK_FRICTION;

    // Stop very slow pucks
    if (Math.abs(puck.vx) < 0.01) puck.vx = 0;
    if (Math.abs(puck.vy) < 0.01) puck.vy = 0;
  }

  // Returns: 0 = no goal, 1 = player 1 scored (puck entered right goal), 2 = player 2 scored (puck entered left goal)
  function checkGoal(puck) {
    // Right goal (player 1 scores)
    if (puck.x + puck.radius >= WIDTH && puck.y >= GOAL_TOP && puck.y <= GOAL_BOTTOM) {
      return 1;
    }
    // Left goal (player 2 scores)
    if (puck.x - puck.radius <= 0 && puck.y >= GOAL_TOP && puck.y <= GOAL_BOTTOM) {
      return 2;
    }
    return 0;
  }

  function wallCollision(puck) {
    var hit = false;

    // Top wall
    if (puck.y - puck.radius <= 0) {
      puck.y = puck.radius;
      puck.vy = -puck.vy * WALL_BOUNCE;
      hit = true;
    }
    // Bottom wall
    if (puck.y + puck.radius >= HEIGHT) {
      puck.y = HEIGHT - puck.radius;
      puck.vy = -puck.vy * WALL_BOUNCE;
      hit = true;
    }
    // Left wall (outside goal area)
    if (puck.x - puck.radius <= 0 && (puck.y < GOAL_TOP || puck.y > GOAL_BOTTOM)) {
      puck.x = puck.radius;
      puck.vx = -puck.vx * WALL_BOUNCE;
      hit = true;
    }
    // Right wall (outside goal area)
    if (puck.x + puck.radius >= WIDTH && (puck.y < GOAL_TOP || puck.y > GOAL_BOTTOM)) {
      puck.x = WIDTH - puck.radius;
      puck.vx = -puck.vx * WALL_BOUNCE;
      hit = true;
    }

    // Goal post collisions (corners of goal openings)
    var goalPosts = [
      { x: 0, y: GOAL_TOP },
      { x: 0, y: GOAL_BOTTOM },
      { x: WIDTH, y: GOAL_TOP },
      { x: WIDTH, y: GOAL_BOTTOM }
    ];
    for (var i = 0; i < goalPosts.length; i++) {
      var post = goalPosts[i];
      var dx = puck.x - post.x;
      var dy = puck.y - post.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < puck.radius) {
        var nx = dx / dist;
        var ny = dy / dist;
        puck.x = post.x + nx * puck.radius;
        puck.y = post.y + ny * puck.radius;
        var dot = puck.vx * nx + puck.vy * ny;
        puck.vx -= 2 * dot * nx;
        puck.vy -= 2 * dot * ny;
        puck.vx *= WALL_BOUNCE;
        puck.vy *= WALL_BOUNCE;
        hit = true;
      }
    }

    return hit;
  }

  // Run one frame of physics. Returns event string or null.
  function step(state) {
    var puck = state.puck;
    var paddles = state.paddles;

    // Clamp paddles
    clampPaddlePosition(paddles[0]);
    clampPaddlePosition(paddles[1]);

    // Paddle-puck collisions
    var paddleHit = false;
    for (var i = 0; i < 2; i++) {
      if (resolvePaddlePuckCollision(paddles[i], puck)) {
        paddleHit = true;
      }
    }

    // Move puck
    updatePuck(puck);

    // Wall collisions
    var wallHit = wallCollision(puck);

    // Goal check
    var goal = checkGoal(puck);

    // Update paddle prev positions
    paddles[0].prevX = paddles[0].x;
    paddles[0].prevY = paddles[0].y;
    paddles[1].prevX = paddles[1].x;
    paddles[1].prevY = paddles[1].y;

    if (goal > 0) {
      state.scores[goal - 1]++;
      state.lastGoalBy = goal;
      return state.scores[goal - 1] >= WIN_SCORE ? 'win' : 'goal';
    }
    if (paddleHit) return 'paddleHit';
    if (wallHit) return 'wallHit';
    return null;
  }

  function resetPuck(state) {
    var puck = state.puck;
    puck.x = WIDTH / 2;
    puck.y = HEIGHT / 2;
    puck.vx = 0;
    puck.vy = 0;
  }

  function resetFull(state) {
    resetPuck(state);
    state.scores = [0, 0];
    state.lastGoalBy = 0;
    state.paddles[0].x = 100;
    state.paddles[0].y = HEIGHT / 2;
    state.paddles[1].x = WIDTH - 100;
    state.paddles[1].y = HEIGHT / 2;
    state.paddles[0].prevX = state.paddles[0].x;
    state.paddles[0].prevY = state.paddles[0].y;
    state.paddles[1].prevX = state.paddles[1].x;
    state.paddles[1].prevY = state.paddles[1].y;
  }

  return {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    PUCK_RADIUS: PUCK_RADIUS,
    PADDLE_RADIUS: PADDLE_RADIUS,
    GOAL_HEIGHT: GOAL_HEIGHT,
    GOAL_TOP: GOAL_TOP,
    GOAL_BOTTOM: GOAL_BOTTOM,
    WIN_SCORE: WIN_SCORE,
    createPuck: createPuck,
    createPaddle: createPaddle,
    createGameState: createGameState,
    clampPaddlePosition: clampPaddlePosition,
    step: step,
    resetPuck: resetPuck,
    resetFull: resetFull
  };
});
