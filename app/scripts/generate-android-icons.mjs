import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const brandDir = join(rootDir, 'public', 'assets', 'brand');
const resDir = join(rootDir, 'android', 'app', 'src', 'main', 'res');

const iconSource = join(brandDir, 'icon.png');
const iconTransparent = join(brandDir, 'icon-transparent.png');

// Android mipmap sizes
const mipmapSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground icon sizes (adaptive icon foreground is 108dp * density)
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generateIcons() {
  console.log('Generating Android icons from brand assets...');

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    const outDir = join(resDir, folder);
    mkdirSync(outDir, { recursive: true });

    // ic_launcher.png (square icon with background)
    await sharp(iconSource)
      .resize(size, size)
      .png()
      .toFile(join(outDir, 'ic_launcher.png'));
    console.log(`  ${folder}/ic_launcher.png (${size}x${size})`);

    // ic_launcher_round.png (round icon)
    const roundMask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );
    await sharp(iconSource)
      .resize(size, size)
      .composite([{ input: roundMask, blend: 'dest-in' }])
      .png()
      .toFile(join(outDir, 'ic_launcher_round.png'));
    console.log(`  ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate foreground icons for adaptive icons
  for (const [folder, size] of Object.entries(foregroundSizes)) {
    const outDir = join(resDir, folder);
    mkdirSync(outDir, { recursive: true });

    // ic_launcher_foreground.png - icon centered on transparent canvas
    const iconSize = Math.round(size * 0.65); // 65% of canvas for safe zone
    const padding = Math.round((size - iconSize) / 2);

    await sharp(iconTransparent)
      .resize(iconSize, iconSize)
      .extend({
        top: padding,
        bottom: size - iconSize - padding,
        left: padding,
        right: size - iconSize - padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(join(outDir, 'ic_launcher_foreground.png'));
    console.log(`  ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  // Generate splash screen icon
  const splashDir = join(resDir, 'drawable');
  mkdirSync(splashDir, { recursive: true });
  await sharp(iconSource)
    .resize(288, 288)
    .png()
    .toFile(join(splashDir, 'splash.png'));
  console.log('  drawable/splash.png (288x288)');

  // Generate splash for different densities
  const splashSizes = {
    'drawable-land-hdpi': [480, 320],
    'drawable-land-mdpi': [320, 240],
    'drawable-land-xhdpi': [720, 480],
    'drawable-land-xxhdpi': [960, 640],
    'drawable-land-xxxhdpi': [1280, 960],
    'drawable-port-hdpi': [320, 480],
    'drawable-port-mdpi': [240, 320],
    'drawable-port-xhdpi': [480, 720],
    'drawable-port-xxhdpi': [640, 960],
    'drawable-port-xxxhdpi': [960, 1280],
  };

  for (const [folder, [w, h]] of Object.entries(splashSizes)) {
    const dir = join(resDir, folder);
    mkdirSync(dir, { recursive: true });
    const iconSz = Math.min(w, h) * 0.5;
    await sharp(iconSource)
      .resize(Math.round(iconSz), Math.round(iconSz))
      .extend({
        top: Math.round((h - iconSz) / 2),
        bottom: Math.round((h - iconSz) / 2),
        left: Math.round((w - iconSz) / 2),
        right: Math.round((w - iconSz) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .resize(w, h)
      .png()
      .toFile(join(dir, 'splash.png'));
    console.log(`  ${folder}/splash.png (${w}x${h})`);
  }

  console.log('\nDone! All Android icons generated.');
}

generateIcons().catch(console.error);
