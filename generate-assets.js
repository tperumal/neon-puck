#!/usr/bin/env node
// Generate brutalist app icon and splash screen assets
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// --- App Icon (1024x1024) ---
function generateAppIcon() {
  const size = 1024;
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');

  // Black background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  // 2px border (scaled to icon size)
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // Center line
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 120, 0, Math.PI * 2);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Puck (white circle, center)
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 60, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Inner puck dot
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 24, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // Player 1 paddle (red, left side)
  const p1x = size * 0.28;
  const p1y = size * 0.38;
  const pr = 72;

  ctx.beginPath();
  ctx.arc(p1x, p1y, pr, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff0033';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p1x, p1y, pr - 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ff003366';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p1x, p1y, pr * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0033';
  ctx.fill();

  // Player 2 paddle (blue, right side)
  const p2x = size * 0.72;
  const p2y = size * 0.62;

  ctx.beginPath();
  ctx.arc(p2x, p2y, pr, 0, Math.PI * 2);
  ctx.strokeStyle = '#0038FF';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p2x, p2y, pr - 4, 0, Math.PI * 2);
  ctx.fillStyle = '#0038FF66';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p2x, p2y, pr * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#0038FF';
  ctx.fill();

  return c;
}

// --- Splash Screen (2732x2732) ---
function generateSplash() {
  const size = 2732;
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');

  // Black background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  // "NEON PUCK" text
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 140px "Inter", "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '16px';
  ctx.fillText('NEON PUCK', size / 2, size / 2 - 30);

  // Subtitle
  ctx.fillStyle = '#555555';
  ctx.font = '400 48px "Courier New", monospace';
  ctx.letterSpacing = '14px';
  ctx.fillText('AIR HOCKEY', size / 2, size / 2 + 60);

  return c;
}

// --- Write files ---
const iconCanvas = generateAppIcon();
const splashCanvas = generateSplash();

// App icon - root and iOS
const iconPng = iconCanvas.toBuffer('image/png');
fs.writeFileSync('AppIcon.png', iconPng);
fs.writeFileSync('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', iconPng);
console.log('✔ AppIcon.png (1024x1024)');

// Splash - all 3 slots
const splashPng = splashCanvas.toBuffer('image/png');
const splashDir = 'ios/App/App/Assets.xcassets/Splash.imageset';
fs.writeFileSync(path.join(splashDir, 'splash-2732x2732.png'), splashPng);
fs.writeFileSync(path.join(splashDir, 'splash-2732x2732-1.png'), splashPng);
fs.writeFileSync(path.join(splashDir, 'splash-2732x2732-2.png'), splashPng);
console.log('✔ Splash screens (2732x2732)');

console.log('\nDone. Screenshots need to be retaken from the simulator.');
