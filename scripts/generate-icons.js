import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. High-contrast, clean SVG Icon for CutiSG (Singapore Leave & MOM Holiday Planner)
// Primary brand colors: Singapore Red (#EE2C38 / #D32F2F), Warm Sand, Tropical Palm / Vacation Leaf Green (#0D9488 / #10B981), Clean White (#FFFFFF)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EE2C38"/>
      <stop offset="100%" stop-color="#B71C1C"/>
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
    </filter>
  </defs>

  <!-- Background Base with Squircle Corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

  <!-- Calendar Container Card -->
  <g filter="url(#shadow)">
    <!-- Calendar Body -->
    <rect x="76" y="96" width="360" height="340" rx="36" fill="#FFFFFF"/>
    <!-- Calendar Header (Singapore Crimson) -->
    <path d="M 76 132 C 76 112, 92 96, 112 96 L 400 96 C 420 96, 436 112, 436 132 L 436 184 L 76 184 Z" fill="#EE2C38"/>
  </g>

  <!-- Calendar Rings / Binder Clips -->
  <rect x="156" y="70" width="24" height="54" rx="12" fill="#FFFFFF" stroke="#D32F2F" stroke-width="4"/>
  <rect x="332" y="70" width="24" height="54" rx="12" fill="#FFFFFF" stroke="#D32F2F" stroke-width="4"/>

  <!-- Calendar Header Text / Monogram -->
  <text x="256" y="152" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" text-anchor="middle" letter-spacing="4">CUTI SG</text>

  <!-- Singapore Crescent & Stars Symbolism inside Header (Subtle Gold/White) -->
  <circle cx="120" cy="140" r="14" fill="#FFFFFF" opacity="0.3"/>
  <circle cx="124" cy="140" r="11" fill="#EE2C38"/>

  <!-- Tropical Vacation Palm Leaf / Leave Approved Icon in Calendar Center -->
  <g transform="translate(146, 210)">
    <!-- Tropical Palm Leaf shape -->
    <path d="M 110 20 C 180 30, 200 110, 180 180 C 130 190, 40 160, 30 100 C 25 70, 60 30, 110 20 Z" fill="url(#leafGrad)"/>
    <path d="M 30 100 Q 110 110 180 180" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/>
    <path d="M 70 80 Q 95 100 120 115" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M 100 60 Q 120 85 145 105" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M 130 45 Q 145 70 165 95" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
  </g>

  <!-- Vibrant Checkmark Badge in Bottom Right -->
  <g filter="url(#shadow)" transform="translate(320, 320)">
    <circle cx="50" cy="50" r="48" fill="#10B981" stroke="#FFFFFF" stroke-width="6"/>
    <path d="M 34 50 L 46 62 L 68 38" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// 2. Maskable Icon with 15% safe margin (essential graphics inside central 80% circle)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EE2C38"/>
      <stop offset="100%" stop-color="#B71C1C"/>
    </linearGradient>
    <linearGradient id="leafGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="shadowMask" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Full-bleed background extending to outer edges -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>

  <!-- Scaled content inside central 76% safe zone (center 256, 256) -->
  <g transform="translate(256, 256) scale(0.76) translate(-256, -256)">
    <!-- Calendar Container Card -->
    <g filter="url(#shadowMask)">
      <rect x="76" y="96" width="360" height="340" rx="36" fill="#FFFFFF"/>
      <path d="M 76 132 C 76 112, 92 96, 112 96 L 400 96 C 420 96, 436 112, 436 132 L 436 184 L 76 184 Z" fill="#EE2C38"/>
    </g>

    <!-- Calendar Rings -->
    <rect x="156" y="70" width="24" height="54" rx="12" fill="#FFFFFF" stroke="#D32F2F" stroke-width="4"/>
    <rect x="332" y="70" width="24" height="54" rx="12" fill="#FFFFFF" stroke="#D32F2F" stroke-width="4"/>

    <!-- Calendar Header Text -->
    <text x="256" y="152" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" text-anchor="middle" letter-spacing="4">CUTI SG</text>

    <!-- Tropical Palm Leaf -->
    <g transform="translate(146, 210)">
      <path d="M 110 20 C 180 30, 200 110, 180 180 C 130 190, 40 160, 30 100 C 25 70, 60 30, 110 20 Z" fill="url(#leafGradMask)"/>
      <path d="M 30 100 Q 110 110 180 180" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/>
    </g>

    <!-- Checkmark Badge in Bottom Right -->
    <g filter="url(#shadowMask)" transform="translate(320, 320)">
      <circle cx="50" cy="50" r="48" fill="#10B981" stroke="#FFFFFF" stroke-width="6"/>
      <path d="M 34 50 L 46 62 L 68 38" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;

async function generateAll() {
  // Save icon.svg and favicon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg, 'utf-8');
  console.log('Saved public/icon.svg and public/favicon.svg');

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate 192x192 PNG
  await sharp(standardBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // Generate 512x512 PNG
  await sharp(standardBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // Generate 180x180 Apple Touch Icon (Required PNG for iOS Safari)
  await sharp(standardBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // Generate 512x512 Maskable PNG
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png');
}

generateAll().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
