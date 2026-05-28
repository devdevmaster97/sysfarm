import fs from 'fs';

const makeSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.16}" fill="#5A5A40"/>
  <text x="${size/2}" y="${size * 0.72}" font-size="${size * 0.55}" text-anchor="middle" fill="#f5f5f0" font-family="serif">☕</text>
</svg>`;

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/pwa-192x192.svg', makeSVG(192));
fs.writeFileSync('public/pwa-512x512.svg', makeSVG(512));
console.log('SVG icons created');
