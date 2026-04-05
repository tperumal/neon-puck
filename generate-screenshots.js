#!/usr/bin/env node
// Generate brutalist App Store screenshots for Neon Puck
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');

// Device sizes (landscape)
const DEVICES = {
  iphone_67: { w: 2868, h: 1320, scale: 3, statusBar: 60, homeBar: 30 },
  ipad_13:   { w: 2752, h: 2064, scale: 2, statusBar: 50, homeBar: 30 },
};

// Colors
const BG = '#0a0a0a';
const TABLE = '#111111';
const LINE = '#333333';
const P1 = '#ff0033';
const P2 = '#0038FF';
const WHITE = '#ffffff';
const MUTED = '#555555';

function drawStatusBar(ctx, w, h, device) {
  // Minimal status bar indicators
  ctx.fillStyle = '#999';
  ctx.font = `500 ${device.statusBar * 0.55}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  const y = device.statusBar * 0.5;
  ctx.textAlign = 'left';
  ctx.fillText('9:41', 40, y);
  ctx.textAlign = 'right';
  ctx.fillText('100%', w - 40, y);
}

function drawSoundBtn(ctx, w, device) {
  const size = 40;
  const x = w - 52;
  const y = device.statusBar + 12;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = WHITE;
  ctx.font = `${size * 0.55}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u{1F50A}', x + size/2, y + size/2);
}

function drawTable(ctx, w, h, device) {
  const top = device.statusBar;
  const bottom = h - device.homeBar;
  const tableH = bottom - top;

  // Table background
  ctx.fillStyle = TABLE;
  ctx.fillRect(0, top, w, tableH);

  // Border
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, top + 1, w - 2, tableH - 2);

  // Center line
  ctx.beginPath();
  ctx.moveTo(w / 2, top);
  ctx.lineTo(w / 2, bottom);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(w / 2, top + tableH / 2, tableH * 0.12, 0, Math.PI * 2);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Goals
  const goalH = tableH * 0.35;
  const goalTop = top + (tableH - goalH) / 2;
  const goalW = 16;

  // Left goal (P2 scores here)
  ctx.fillStyle = P2 + '33';
  ctx.fillRect(0, goalTop, goalW, goalH);
  ctx.strokeStyle = P2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(goalW, goalTop);
  ctx.lineTo(0, goalTop);
  ctx.lineTo(0, goalTop + goalH);
  ctx.lineTo(goalW, goalTop + goalH);
  ctx.stroke();

  // Right goal (P1 scores here)
  ctx.fillStyle = P1 + '33';
  ctx.fillRect(w - goalW, goalTop, goalW, goalH);
  ctx.strokeStyle = P1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w - goalW, goalTop);
  ctx.lineTo(w, goalTop);
  ctx.lineTo(w, goalTop + goalH);
  ctx.lineTo(w - goalW, goalTop + goalH);
  ctx.stroke();

  return { top, bottom, tableH };
}

function drawPaddle(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 2, 0, Math.PI * 2);
  ctx.fillStyle = color + '66';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPuck(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = WHITE;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();
}

function drawOverlay(ctx, w, h, alpha) {
  ctx.fillStyle = `rgba(10, 10, 10, ${alpha})`;
  ctx.fillRect(0, 0, w, h);
}

// --- MENU SCREEN ---
function drawMenuScreen(w, h, device) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');

  // Background with faint table
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  drawTable(ctx, w, h, device);
  drawOverlay(ctx, w, h, 0.92);

  drawStatusBar(ctx, w, h, device);
  drawSoundBtn(ctx, w, device);

  const cx = w / 2;
  const cy = h / 2;

  // Title
  ctx.fillStyle = WHITE;
  ctx.font = '900 120px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '14px';
  ctx.fillText('NEON PUCK', cx, cy - 80);

  // Subtitle
  ctx.fillStyle = '#999';
  ctx.font = '400 32px "Courier New", monospace';
  ctx.letterSpacing = '10px';
  ctx.fillText('AIR HOCKEY', cx, cy - 20);

  // Play button
  const btnW = 400;
  const btnH = 60;
  const btnX = cx - btnW / 2;
  const btnY = cy + 50;
  ctx.fillStyle = WHITE;
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#000';
  ctx.font = '700 24px "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('PLAY', cx, btnY + btnH / 2);

  return c;
}

// --- MODE SELECT SCREEN ---
function drawModeScreen(w, h, device) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  drawTable(ctx, w, h, device);
  drawOverlay(ctx, w, h, 0.92);

  drawStatusBar(ctx, w, h, device);
  drawSoundBtn(ctx, w, device);

  const cx = w / 2;
  const cy = h / 2;

  // Title
  ctx.fillStyle = WHITE;
  ctx.font = '900 64px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText('SELECT MODE', cx, cy - 130);

  // Buttons
  const btnW = 400;
  const btnH = 56;
  const gap = 14;
  const buttons = [
    { label: 'LOCAL 2-PLAYER', filled: false },
    { label: 'CREATE ROOM', filled: false },
    { label: 'JOIN ROOM', filled: false },
    { label: 'BACK', filled: false, muted: true },
  ];

  const startY = cy - 60;
  buttons.forEach((btn, i) => {
    const btnX = cx - btnW / 2;
    const btnY = startY + i * (btnH + gap);

    ctx.strokeStyle = btn.muted ? '#333' : WHITE;
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = btn.muted ? '#555' : WHITE;
    ctx.font = '700 22px "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(btn.label, cx, btnY + btnH / 2);
  });

  return c;
}

// --- GAMEPLAY SCREEN ---
function drawGameplayScreen(w, h, device) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  const { top, tableH } = drawTable(ctx, w, h, device);

  const midY = top + tableH / 2;
  const paddleR = tableH * 0.09;
  const puckR = tableH * 0.05;

  // Paddles
  drawPaddle(ctx, w * 0.22, midY - tableH * 0.1, paddleR, P1);
  drawPaddle(ctx, w * 0.78, midY + tableH * 0.15, paddleR, P2);

  // Puck
  drawPuck(ctx, w * 0.45, midY + tableH * 0.05, puckR);

  // Scores
  ctx.font = `900 ${tableH * 0.1}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = P1 + '88';
  ctx.fillText('3', w * 0.3, top + tableH * 0.04);
  ctx.fillStyle = P2 + '88';
  ctx.fillText('2', w * 0.7, top + tableH * 0.04);

  drawSoundBtn(ctx, w, device);

  return c;
}

// --- ROOM CODE SCREEN ---
function drawRoomScreen(w, h, device) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  drawTable(ctx, w, h, device);
  drawOverlay(ctx, w, h, 0.92);

  drawStatusBar(ctx, w, h, device);
  drawSoundBtn(ctx, w, device);

  const cx = w / 2;
  const cy = h / 2;

  // Title
  ctx.fillStyle = WHITE;
  ctx.font = '900 64px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText('YOUR ROOM CODE', cx, cy - 120);

  // Room code
  ctx.font = '700 120px "Courier New", monospace';
  ctx.letterSpacing = '30px';
  ctx.fillText('ABCD', cx, cy);

  // Hint
  ctx.fillStyle = '#555';
  ctx.font = '400 24px "Courier New", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText('SHARE THIS CODE WITH YOUR OPPONENT', cx, cy + 70);

  // Status
  ctx.fillStyle = WHITE;
  ctx.font = '400 22px "Courier New", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText('WAITING FOR OPPONENT...', cx, cy + 120);

  // Cancel button
  const btnW = 400;
  const btnH = 56;
  const btnX = cx - btnW / 2;
  const btnY = cy + 170;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#555';
  ctx.font = '700 22px "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('CANCEL', cx, btnY + btnH / 2);

  return c;
}

// --- Generate all screenshots ---
const screens = [
  { name: 'menu', fn: drawMenuScreen },
  { name: 'mode', fn: drawModeScreen },
  { name: 'gameplay', fn: drawGameplayScreen },
  { name: 'room', fn: drawRoomScreen },
];

for (const [deviceName, device] of Object.entries(DEVICES)) {
  for (const screen of screens) {
    const canvas = screen.fn(device.w, device.h, device);
    const filename = `screenshots/${deviceName}_${screen.name}.png`;
    fs.writeFileSync(filename, canvas.toBuffer('image/png'));
    console.log(`  ${filename} (${device.w}x${device.h})`);
  }
}

console.log('\nDone. All 8 screenshots generated.');
