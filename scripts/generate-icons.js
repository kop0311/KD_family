#!/usr/bin/env node

/**
 * Generate placeholder icons for KD Family PWA
 * Creates simple SVG-based icons in different sizes
 */

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the KD Family icon
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold"
        text-anchor="middle" dominant-baseline="central" fill="white">KD</text>
</svg>`;

// Icon sizes to generate
const iconSizes = [16, 32, 192, 512, 180];

console.log('🎨 Generating KD Family PWA icons...');

iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  let filename;

  if (size === 180) {
    filename = 'apple-touch-icon.svg';
  } else {
    filename = `icon-${size}x${size}.svg`;
  }

  const filePath = path.join(iconsDir, filename);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${filename}`);
});

// Create favicon.ico placeholder (as SVG for now)
const faviconSVG = createSVGIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSVG);
console.log('✅ Created favicon.svg');

// Create a simple favicon.ico placeholder
const faviconICO = `data:image/svg+xml,${encodeURIComponent(faviconSVG)}`;
console.log('✅ Favicon placeholder ready');

console.log('\n🎉 Icon generation complete!');
console.log('📝 Note: SVG icons created. For production, consider converting to PNG format.');
console.log('🔧 You can use tools like sharp or imagemagick to convert SVG to PNG if needed.');