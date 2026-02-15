// Template Registry — maps template IDs to metadata
// Dynamically generated from theme system (20 layouts × 5 palettes = 100)
// Plus legacy aliases for the original 6 templates.

import { ALL_THEMES, THEME_LIST, LEGACY_MAP, CATEGORY_LABELS, makeThemeId } from './themes/index'

// ── Legacy overrides: preserve original names/descriptions for backward compat ──
const LEGACY_REGISTRY = {
  clean: {
    id: 'clean',
    name: 'Classic Clean',
    description: 'Clean and minimal layout with subtle accents',
    category: 'minimal',
    colorFamily: 'black',
    previewColor: '#1F2937',
  },
  'modern-red': {
    id: 'modern-red',
    name: 'Modern Red',
    description: 'Bold red accents with a modern sidebar layout',
    category: 'modern',
    colorFamily: 'red',
    previewColor: '#DC2626',
  },
  'classic-red': {
    id: 'classic-red',
    name: 'Classic Red',
    description: 'Traditional invoice layout with green header stripe',
    category: 'classic',
    colorFamily: 'green',
    previewColor: '#047857',
  },
  wexler: {
    id: 'wexler',
    name: 'Wexler',
    description: 'Colorful wave accent with bold typography',
    category: 'creative',
    colorFamily: 'blue',
    previewColor: '#2563EB',
  },
  plexer: {
    id: 'plexer',
    name: 'Plexer',
    description: 'Professional two-tone layout with clean lines',
    category: 'professional',
    colorFamily: 'black',
    previewColor: '#374151',
  },
  contemporary: {
    id: 'contemporary',
    name: 'Contemporary',
    description: 'Modern gradient header with spacious layout',
    category: 'modern',
    colorFamily: 'red',
    previewColor: '#E11D48',
  },
}

// ── Generate registry from all 100 themes ──
function buildRegistry() {
  const registry = {}

  // Add all 100 themed templates
  for (const theme of THEME_LIST) {
    registry[theme.id] = {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      category: theme.category,
      colorFamily: theme.colorFamily,
      previewColor: theme.previewColor,
      layoutKey: theme.layoutKey,
      paletteKey: theme.paletteKey,
    }
  }

  // Overlay legacy aliases (so old IDs still resolve correctly)
  for (const [legacyId, meta] of Object.entries(LEGACY_REGISTRY)) {
    registry[legacyId] = { ...meta }
  }

  return registry
}

export const TEMPLATE_REGISTRY = buildRegistry()

// ── Categories for UI filtering ──
export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'modern', label: 'Modern' },
  { key: 'classic', label: 'Classic' },
  { key: 'professional', label: 'Professional' },
  { key: 'creative', label: 'Creative' },
]

export const COLOR_FAMILIES = [
  { key: 'all', label: 'All', color: null },
  { key: 'black', label: 'Charcoal', color: '#374151' },
  { key: 'red', label: 'Crimson', color: '#DC2626' },
  { key: 'blue', label: 'Ocean', color: '#2563EB' },
  { key: 'green', label: 'Forest', color: '#047857' },
  { key: 'purple', label: 'Royal', color: '#7C3AED' },
]

export const getTemplateList = () => Object.values(TEMPLATE_REGISTRY)

export const getTemplateById = (id) => TEMPLATE_REGISTRY[id] || TEMPLATE_REGISTRY.clean

// Filter helpers for the selection UI
export const getTemplatesByCategory = (category) => {
  if (!category || category === 'all') return getTemplateList()
  return getTemplateList().filter(t => t.category === category)
}

export const getTemplatesByColor = (colorFamily) => {
  if (!colorFamily || colorFamily === 'all') return getTemplateList()
  return getTemplateList().filter(t => t.colorFamily === colorFamily)
}

export const getFilteredTemplates = (category, colorFamily) => {
  return getTemplateList().filter(t => {
    const catMatch = !category || category === 'all' || t.category === category
    const colorMatch = !colorFamily || colorFamily === 'all' || t.colorFamily === colorFamily
    return catMatch && colorMatch
  })
}
