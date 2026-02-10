const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Physics = require('./public/js/physics.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// --- Room Management ---
const rooms = new Map(); // code -> room object
const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // excluded I, L, O
const ROOM_CLEANUP_DELAY = 30000; // 30 seconds

function generateRoomCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

function createRoom(socketId) {
  const code = generateRoomCode();
  const room = {
    code,
    players: [socketId, null],
    state: Physics.createGameState(),
    interval: null,
    countdown: null,
    cleanupTimeout: null,
    rematchVotes: new Set()
  };
  rooms.set(code, room);
  return room;
}

function findRoomBySocket(socketId) {
  for (const [, room] of rooms) {
    if (room.players[0] === socketId || room.players[1] === socketId) {
      return room;
    }
  }
  return null;
}

function getPlayerIndex(room, socketId) {
  if (room.players[0] === socketId) return 0;
  if (room.players[1] === socketId) return 1;
  return -1;
}

function destroyRoom(room) {
  if (room.interval) clearInterval(room.interval);
  if (room.countdown) clearTimeout(room.countdown);
  if (room.cleanupTimeout) clearTimeout(room.cleanupTimeout);
  rooms.delete(room.code);
}

// --- Server Physics Loop ---
function startPhysicsLoop(room) {
  if (room.interval) clearInterval(room.interval);

  room.interval = setInterval(() => {
    const event = Physics.step(room.state);

    // Broadcast state to both players
    const stateData = {
      puck: {
        x: room.state.puck.x,
        y: room.state.puck.y,
        vx: room.state.puck.vx,
        vy: room.state.puck.vy
      },
      paddles: [
        { x: room.state.paddles[0].x, y: room.state.paddles[0].y },
        { x: room.state.paddles[1].x, y: room.state.paddles[1].y }
      ],
      scores: room.state.scores
    };

    for (let i = 0; i < 2; i++) {
      if (room.players[i]) {
        io.to(room.players[i]).volatile.emit('gameState', stateData);
      }
    }

    if (event === 'goal') {
      // Pause physics briefly for goal celebration
      clearInterval(room.interval);
      room.interval = null;

      const goalData = {
        scorer: room.state.lastGoalBy,
        scores: [...room.state.scores]
      };

      for (let i = 0; i < 2; i++) {
        if (room.players[i]) {
          io.to(room.players[i]).emit('goal', goalData);
        }
      }

      // Reset puck and restart after delay
      setTimeout(() => {
        Physics.resetPuck(room.state);
        startCountdown(room);
      }, 1500);
    }

    if (event === 'win') {
      clearInterval(room.interval);
      room.interval = null;

      const winData = {
        winner: room.state.lastGoalBy,
        scores: [...room.state.scores]
      };

      for (let i = 0; i < 2; i++) {
        if (room.players[i]) {
          io.to(room.players[i]).emit('gameOver', winData);
        }
      }
    }
  }, 1000 / 60); // 60 Hz
}

function startCountdown(room) {
  let count = 3;

  function tick() {
    for (let i = 0; i < 2; i++) {
      if (room.players[i]) {
        io.to(room.players[i]).emit('countdown', { value: count });
      }
    }

    if (count > 0) {
      count--;
      room.countdown = setTimeout(tick, 700);
    } else {
      // count === 0 means "GO!" was just sent, now send -1 to start
      room.countdown = setTimeout(() => {
        for (let i = 0; i < 2; i++) {
          if (room.players[i]) {
            io.to(room.players[i]).emit('countdown', { value: -1 });
          }
        }
        startPhysicsLoop(room);
      }, 700);
    }
  }

  tick();
}

// --- Socket.io Events ---
io.on('connection', (socket) => {
  socket.on('createRoom', () => {
    const room = createRoom(socket.id);
    socket.emit('roomCreated', { code: room.code });
  });

  socket.on('joinRoom', (data) => {
    const code = data.code.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('joinError', { message: 'Room not found' });
      return;
    }

    if (room.players[0] && room.players[1]) {
      socket.emit('joinError', { message: 'Room is full' });
      return;
    }

    // Clear any cleanup timeout
    if (room.cleanupTimeout) {
      clearTimeout(room.cleanupTimeout);
      room.cleanupTimeout = null;
    }

    // Assign to empty slot
    const slot = room.players[0] ? 1 : 0;
    room.players[slot] = socket.id;

    socket.emit('roomJoined', { code: room.code, playerNumber: slot + 1 });

    // Notify the other player
    const otherSlot = slot === 0 ? 1 : 0;
    if (room.players[otherSlot]) {
      io.to(room.players[otherSlot]).emit('opponentJoined');
    }

    // Both players connected - start game
    if (room.players[0] && room.players[1]) {
      Physics.resetFull(room.state);
      room.rematchVotes.clear();
      startCountdown(room);
    }
  });

  socket.on('paddle', (data) => {
    const room = findRoomBySocket(socket.id);
    if (!room) return;

    const idx = getPlayerIndex(room, socket.id);
    if (idx < 0) return;

    const paddle = room.state.paddles[idx];
    paddle.prevX = paddle.x;
    paddle.prevY = paddle.y;
    paddle.x = data.x;
    paddle.y = data.y;
    Physics.clampPaddlePosition(paddle);
  });

  socket.on('rematch', () => {
    const room = findRoomBySocket(socket.id);
    if (!room) return;

    room.rematchVotes.add(socket.id);

    // Both voted for rematch
    if (room.rematchVotes.size >= 2) {
      room.rematchVotes.clear();
      Physics.resetFull(room.state);

      for (let i = 0; i < 2; i++) {
        if (room.players[i]) {
          io.to(room.players[i]).emit('rematchStart');
        }
      }

      startCountdown(room);
    }
  });

  socket.on('leaveRoom', () => {
    handleDisconnect(socket.id);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket.id);
  });
});

function handleDisconnect(socketId) {
  const room = findRoomBySocket(socketId);
  if (!room) return;

  const idx = getPlayerIndex(room, socketId);
  if (idx < 0) return;

  room.players[idx] = null;

  // Stop physics
  if (room.interval) {
    clearInterval(room.interval);
    room.interval = null;
  }
  if (room.countdown) {
    clearTimeout(room.countdown);
    room.countdown = null;
  }

  // Notify other player
  const otherIdx = idx === 0 ? 1 : 0;
  if (room.players[otherIdx]) {
    io.to(room.players[otherIdx]).emit('opponentLeft');
  }

  // If room is empty, schedule cleanup
  if (!room.players[0] && !room.players[1]) {
    room.cleanupTimeout = setTimeout(() => {
      destroyRoom(room);
    }, ROOM_CLEANUP_DELAY);
  }
}

server.listen(PORT, () => {
  console.log(`Neon Puck server running on port ${PORT}`);
});
