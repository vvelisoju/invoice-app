// Theme System — combines 20 layouts × 5 palettes = 100 templates
// Each theme = { id, layout, palette, name, description, category, colorFamily }

import { PALETTES, PALETTE_KEYS } from './palettes'
import { LAYOUTS, LAYOUT_KEYS } from './layouts'

// ── Backward-compatible mapping for existing 6 template IDs ──
// These map old IDs to their new layout+palette combos so existing
// invoices and configs continue to render identically.
export const LEGACY_MAP = {
  'clean':        { layout: 'clean',     palette: 'charcoal' },
  'modern-red':   { layout: 'sidebar',   palette: 'crimson' },
  'classic-red':  { layout: 'stripe',    palette: 'forest' },
  'wexler':       { layout: 'executive', palette: 'ocean' },
  'plexer':       { layout: 'compact',   palette: 'charcoal' },
  'contemporary': { layout: 'banner',    palette: 'crimson' },
}

// Human-friendly name overrides for specific combos
const NAME_OVERRIDES = {
  'clean-charcoal': 'Classic Clean',
  'sidebar-crimson': 'Modern Red',
  'stripe-forest': 'Classic Green',
  'executive-ocean': 'Wexler',
  'compact-charcoal': 'Plexer',
  'banner-crimson': 'Contemporary',
}

// Palette display names for template naming
const PALETTE_DISPLAY = {
  charcoal: 'Charcoal',
  crimson: 'Crimson',
  ocean: 'Ocean',
  forest: 'Forest',
  royal: 'Royal',
}

// Category display labels
export const CATEGORY_LABELS = {
  minimal: 'Minimal',
  modern: 'Modern',
  classic: 'Classic',
  professional: 'Professional',
  creative: 'Creative',
}

// Generate a theme ID from layout + palette
export function makeThemeId(layoutKey, paletteKey) {
  return `${layoutKey}-${paletteKey}`
}

// Generate all 100 themes
function generateThemes() {
  const themes = {}

  for (const layoutKey of LAYOUT_KEYS) {
    const layout = LAYOUTS[layoutKey]
    for (const paletteKey of PALETTE_KEYS) {
      const palette = PALETTES[paletteKey]
      const id = makeThemeId(layoutKey, paletteKey)

      themes[id] = {
        id,
        layoutKey,
        paletteKey,
        layout,
        palette,
        name: NAME_OVERRIDES[id] || `${layout.name} ${PALETTE_DISPLAY[paletteKey]}`,
        description: `${layout.name} layout with ${PALETTE_DISPLAY[paletteKey]} color scheme`,
        category: layout.category,
        colorFamily: palette.family,
        previewColor: palette.primary,
      }
    }
  }

  return themes
}

export const ALL_THEMES = generateThemes()
export const THEME_LIST = Object.values(ALL_THEMES)
export const THEME_IDS = Object.keys(ALL_THEMES)

// Resolve any template ID (legacy or new) to a theme object
export function resolveTheme(templateId) {
  // Check legacy mapping first
  if (LEGACY_MAP[templateId]) {
    const { layout, palette } = LEGACY_MAP[templateId]
    const newId = makeThemeId(layout, palette)
    return ALL_THEMES[newId] || null
  }
  // Direct lookup
  return ALL_THEMES[templateId] || null
}

// Get legacy ID if this theme corresponds to one of the original 6
export function getLegacyId(themeId) {
  for (const [legacyId, mapping] of Object.entries(LEGACY_MAP)) {
    if (makeThemeId(mapping.layout, mapping.palette) === themeId) {
      return legacyId
    }
  }
  return null
}
