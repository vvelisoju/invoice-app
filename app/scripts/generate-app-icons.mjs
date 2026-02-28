#!/usr/bin/env node
/**
 * Generate all Android and iOS app icons + splash screens from source brand assets.
 * Uses `sharp` (already in devDependencies).
 *
 * Usage:  node scripts/generate-app-icons.mjs
 *
 * Source files (from app/public/assets/brand/):
 *   - icon.png          → App icons (all sizes)
 *   - icon-transparent.png → Android adaptive foreground + notification icon
 *   - logo-full-transparent.png → Splash screen center logo
 */

import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const BRAND = join(ROOT, 'public', 'assets', 'brand')
const ICON_SRC = join(BRAND, 'icon.png')
const ICON_TRANSPARENT_SRC = join(BRAND, 'icon-transparent.png')
const LOGO_SRC = join(BRAND, 'logo-full-transparent.png')

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// ─── Android App Icons ──────────────────────────────────────────────
const ANDROID_RES = join(ROOT, 'android', 'app', 'src', 'main', 'res')

const ANDROID_ICON_SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

// Adaptive icon foreground sizes (108dp with 18dp padding = icon centered in 108dp canvas)
const ANDROID_ADAPTIVE_SIZES = [
  { dir: 'mipmap-mdpi', size: 108 },
  { dir: 'mipmap-hdpi', size: 162 },
  { dir: 'mipmap-xhdpi', size: 216 },
  { dir: 'mipmap-xxhdpi', size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
]

// Notification icon sizes (white silhouette on transparent)
const ANDROID_NOTIF_SIZES = [
  { dir: 'drawable-mdpi', size: 24 },
  { dir: 'drawable-hdpi', size: 36 },
  { dir: 'drawable-xhdpi', size: 48 },
  { dir: 'drawable-xxhdpi', size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 },
]

// Splash screen sizes (portrait)
const ANDROID_SPLASH_SIZES = [
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 1080, h: 1920 },
  { dir: 'drawable-port-xxxhdpi', w: 1440, h: 2560 },
]

// Splash screen sizes (landscape)
const ANDROID_SPLASH_LAND = [
  { dir: 'drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'drawable-land-xxhdpi', w: 1920, h: 1080 },
  { dir: 'drawable-land-xxxhdpi', w: 2560, h: 1440 },
]

// ─── iOS App Icons ──────────────────────────────────────────────────
const IOS_ICONS = join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset')
const IOS_SPLASH = join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')

const IOS_ICON_SIZES = [
  { name: 'AppIcon-20x20@1x.png', size: 20 },
  { name: 'AppIcon-20x20@2x.png', size: 40 },
  { name: 'AppIcon-20x20@3x.png', size: 60 },
  { name: 'AppIcon-29x29@1x.png', size: 29 },
  { name: 'AppIcon-29x29@2x.png', size: 58 },
  { name: 'AppIcon-29x29@3x.png', size: 87 },
  { name: 'AppIcon-40x40@1x.png', size: 40 },
  { name: 'AppIcon-40x40@2x.png', size: 80 },
  { name: 'AppIcon-40x40@3x.png', size: 120 },
  { name: 'AppIcon-60x60@2x.png', size: 120 },
  { name: 'AppIcon-60x60@3x.png', size: 180 },
  { name: 'AppIcon-76x76@1x.png', size: 76 },
  { name: 'AppIcon-76x76@2x.png', size: 152 },
  { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
  { name: 'AppIcon-512@2x.png', size: 1024 },
]

// ─── Generate Functions ─────────────────────────────────────────────

async function generateAndroidIcons() {
  console.log('\n📱 Generating Android app icons...')

  for (const { dir, size } of ANDROID_ICON_SIZES) {
    const outDir = join(ANDROID_RES, dir)
    ensureDir(outDir)

    // Standard icon
    await sharp(ICON_SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'ic_launcher.png'))

    // Round icon
    const roundMask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    )
    await sharp(ICON_SRC)
      .resize(size, size, { fit: 'cover' })
      .composite([{ input: roundMask, blend: 'dest-in' }])
      .png()
      .toFile(join(outDir, 'ic_launcher_round.png'))

    console.log(`  ✓ ${dir}: ${size}x${size}`)
  }

  // Adaptive icon foreground
  for (const { dir, size } of ANDROID_ADAPTIVE_SIZES) {
    const outDir = join(ANDROID_RES, dir)
    ensureDir(outDir)

    // Place icon at 66% of canvas (centered with 17% padding on each side)
    const iconSize = Math.round(size * 0.66)
    const padding = Math.round((size - iconSize) / 2)

    await sharp(ICON_TRANSPARENT_SRC)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: size - iconSize - padding,
        left: padding,
        right: size - iconSize - padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(join(outDir, 'ic_launcher_foreground.png'))

    console.log(`  ✓ ${dir}: foreground ${size}x${size}`)
  }
}

async function generateAndroidNotificationIcon() {
  console.log('\n🔔 Generating Android notification icons...')

  for (const { dir, size } of ANDROID_NOTIF_SIZES) {
    const outDir = join(ANDROID_RES, dir)
    ensureDir(outDir)

    // Convert to white silhouette: extract alpha from transparent icon, fill white
    await sharp(ICON_TRANSPARENT_SRC)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extractChannel('alpha')
      .toColourspace('b-w')
      .negate() // Make it white-on-transparent
      .toFile(join(outDir, 'ic_notification.png'))

    console.log(`  ✓ ${dir}: ${size}x${size}`)
  }
}

async function generateAndroidSplash() {
  console.log('\n🖼️  Generating Android splash screens...')

  const allSplash = [...ANDROID_SPLASH_SIZES, ...ANDROID_SPLASH_LAND]

  for (const { dir, w, h } of allSplash) {
    const outDir = join(ANDROID_RES, dir)
    ensureDir(outDir)

    // White background with centered logo (30% of shorter dimension)
    const logoHeight = Math.round(Math.min(w, h) * 0.15)

    const logo = await sharp(LOGO_SRC)
      .resize({ height: logoHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()

    await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png()
      .toFile(join(outDir, 'splash.png'))

    console.log(`  ✓ ${dir}: ${w}x${h}`)
  }
}

async function generateIOSIcons() {
  console.log('\n🍎 Generating iOS app icons...')
  ensureDir(IOS_ICONS)

  for (const { name, size } of IOS_ICON_SIZES) {
    await sharp(ICON_SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(IOS_ICONS, name))

    console.log(`  ✓ ${name}: ${size}x${size}`)
  }

  // Generate Contents.json for Xcode
  const contents = {
    images: IOS_ICON_SIZES.map(({ name, size }) => {
      // Parse scale from filename
      const scaleMatch = name.match(/@(\d)x/)
      const scale = scaleMatch ? parseInt(scaleMatch[1]) : 1
      const points = size / scale

      // Determine idiom
      let idiom = 'iphone'
      if (points === 76 || points === 83.5) idiom = 'ipad'
      if (points === 20 || points === 29 || points === 40) {
        // These sizes are used for both
        if (scale === 1) idiom = 'ipad'
      }
      if (size === 1024) idiom = 'ios-marketing'

      return {
        filename: name,
        idiom,
        scale: `${scale}x`,
        size: `${points}x${points}`,
      }
    }),
    info: { author: 'xcode', version: 1 }
  }

  const { writeFileSync } = await import('fs')
  writeFileSync(join(IOS_ICONS, 'Contents.json'), JSON.stringify(contents, null, 2))
  console.log('  ✓ Contents.json')
}

async function generateIOSSplash() {
  console.log('\n🍎 Generating iOS splash screen...')
  ensureDir(IOS_SPLASH)

  const sizes = [
    { name: 'splash-2732x2732.png', size: 2732 },
    { name: 'splash-2732x2732-1.png', size: 2732 },
    { name: 'splash-2732x2732-2.png', size: 2732 },
  ]

  const logoHeight = Math.round(2732 * 0.08)
  const logo = await sharp(LOGO_SRC)
    .resize({ height: logoHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  for (const { name, size } of sizes) {
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png()
      .toFile(join(IOS_SPLASH, name))

    console.log(`  ✓ ${name}: ${size}x${size}`)
  }
}

async function generateStoreIcon() {
  console.log('\n🏪 Generating store listing icon (512x512)...')

  const outDir = join(ROOT, 'public', 'assets', 'brand')
  await sharp(ICON_SRC)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(outDir, 'icon-512.png'))

  console.log('  ✓ icon-512.png')
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Invoice Baba — App Icon & Splash Generator')
  console.log('='.repeat(50))

  try {
    await generateAndroidIcons()
    await generateAndroidNotificationIcon()
    await generateAndroidSplash()
    await generateIOSIcons()
    await generateIOSSplash()
    await generateStoreIcon()

    console.log('\n✅ All assets generated successfully!')
    console.log('\nNext steps:')
    console.log('  1. Replace TEAM_ID in .well-known/apple-app-site-association')
    console.log('  2. Replace SHA256 fingerprint in .well-known/assetlinks.json')
    console.log('  3. Run: npm run cap:sync')
    console.log('  4. Verify icons in Android Studio / Xcode')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
