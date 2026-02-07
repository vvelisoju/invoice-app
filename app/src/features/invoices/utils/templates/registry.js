// Template Registry — maps template IDs to metadata
// PDF render components are lazy-loaded from pdfTemplates.jsx

export const TEMPLATE_REGISTRY = {
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
    description: 'Traditional invoice layout with red header stripe',
    category: 'classic',
    colorFamily: 'red',
    previewColor: '#B91C1C',
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

export const COLOR_FAMILIES = [
  { key: 'all', label: 'All', color: null },
  { key: 'black', label: 'Black', color: '#1F2937' },
  { key: 'red', label: 'Red', color: '#DC2626' },
  { key: 'blue', label: 'Blue', color: '#2563EB' },
  { key: 'green', label: 'Green', color: '#16A34A' },
  { key: 'yellow', label: 'Yellow', color: '#EAB308' },
  { key: 'orange', label: 'Orange', color: '#EA580C' },
]

export const getTemplateList = () => Object.values(TEMPLATE_REGISTRY)

export const getTemplateById = (id) => TEMPLATE_REGISTRY[id] || TEMPLATE_REGISTRY.clean
