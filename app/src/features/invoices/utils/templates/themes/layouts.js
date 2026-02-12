// Layout Definitions — 20 distinct layout variants
// Each layout defines structural differences: header style, accent elements,
// table appearance, totals placement, address layout, etc.
// Combined with 5 palettes = 100 unique templates.

export const LAYOUTS = {
  // ─── 1. CLEAN ───────────────────────────────────────────────
  // Minimal single-column, no decorative elements
  clean: {
    key: 'clean',
    name: 'Clean',
    category: 'minimal',
    headerStyle: 'standard',        // logo+title left, meta right
    accentElement: 'none',
    tableStyle: 'simple',           // light bg header row
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'border-top',  // thick top border
    addressLayout: 'stacked',       // billTo below header
    metaStyle: 'inline',            // number/date as plain text
    showShipTo: false,
    notesStyle: 'boxed',            // light bg box
  },

  // ─── 2. SIDEBAR ─────────────────────────────────────────────
  // Thin colored sidebar on the left edge
  sidebar: {
    key: 'sidebar',
    name: 'Sidebar',
    category: 'modern',
    headerStyle: 'standard',
    accentElement: 'sidebar-left',  // 6px colored bar on left
    tableStyle: 'colored-header',   // solid color header row
    showSerialNo: false,
    altRowShading: true,
    totalsAlign: 'right',
    grandTotalStyle: 'color-border',
    addressLayout: 'two-column',
    metaStyle: 'badge-box',         // colored background box
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 3. STRIPE ──────────────────────────────────────────────
  // Thin colored stripe at page top
  stripe: {
    key: 'stripe',
    name: 'Stripe',
    category: 'classic',
    headerStyle: 'standard',
    accentElement: 'top-stripe',    // thin bar at very top
    tableStyle: 'bordered-header',  // bottom-border header
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-border',
    addressLayout: 'two-column',
    metaStyle: 'label-value',       // label: value pairs right-aligned
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 4. BANNER ──────────────────────────────────────────────
  // Full-width colored header banner
  banner: {
    key: 'banner',
    name: 'Banner',
    category: 'modern',
    headerStyle: 'full-color',      // colored header background
    accentElement: 'header-bg',
    tableStyle: 'tinted-header',    // light tinted header row
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-bar',   // full-color bar for grand total
    addressLayout: 'two-column',
    metaStyle: 'header-meta',       // meta inside colored header
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 5. EXECUTIVE ───────────────────────────────────────────
  // Bold accent band at top with logo inline
  executive: {
    key: 'executive',
    name: 'Executive',
    category: 'professional',
    headerStyle: 'accent-band',     // thick colored band with title + logo
    accentElement: 'top-band',
    tableStyle: 'tinted-header',
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-bar',
    addressLayout: 'three-column',  // from, to, ship-to side by side
    metaStyle: 'band-meta',         // meta inside accent band
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 6. COMPACT ─────────────────────────────────────────────
  // Minimal with left-border meta box
  compact: {
    key: 'compact',
    name: 'Compact',
    category: 'minimal',
    headerStyle: 'standard',
    accentElement: 'top-thin-bar',
    tableStyle: 'bordered-header',
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'border-top',
    addressLayout: 'two-column',
    metaStyle: 'left-border-box',   // meta with left accent border
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 7. ELEGANT ─────────────────────────────────────────────
  // Refined typography, subtle dividers
  elegant: {
    key: 'elegant',
    name: 'Elegant',
    category: 'professional',
    headerStyle: 'centered',        // centered logo + title
    accentElement: 'divider-line',
    tableStyle: 'minimal',          // just bottom borders
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'double-border',
    addressLayout: 'two-column',
    metaStyle: 'centered',
    showShipTo: false,
    notesStyle: 'boxed',
  },

  // ─── 8. BOLD ────────────────────────────────────────────────
  // Large title, strong visual hierarchy
  bold: {
    key: 'bold',
    name: 'Bold',
    category: 'creative',
    headerStyle: 'large-title',     // oversized title
    accentElement: 'thick-underline',
    tableStyle: 'colored-header',
    showSerialNo: false,
    altRowShading: true,
    totalsAlign: 'right',
    grandTotalStyle: 'color-bar',
    addressLayout: 'two-column',
    metaStyle: 'badge-box',
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 9. SPLIT ───────────────────────────────────────────────
  // Header split: colored left panel, white right
  split: {
    key: 'split',
    name: 'Split',
    category: 'modern',
    headerStyle: 'split-panel',
    accentElement: 'header-split',
    tableStyle: 'simple',
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-border',
    addressLayout: 'two-column',
    metaStyle: 'panel-meta',
    showShipTo: true,
    notesStyle: 'boxed',
  },

  // ─── 10. GRID ───────────────────────────────────────────────
  // Structured grid with visible cell borders
  grid: {
    key: 'grid',
    name: 'Grid',
    category: 'classic',
    headerStyle: 'standard',
    accentElement: 'none',
    tableStyle: 'full-grid',        // all cell borders visible
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'grid-total',
    addressLayout: 'grid-boxes',    // bordered address boxes
    metaStyle: 'grid-box',
    showShipTo: true,
    notesStyle: 'boxed',
  },

  // ─── 11. RIBBON ─────────────────────────────────────────────
  // Diagonal ribbon accent element
  ribbon: {
    key: 'ribbon',
    name: 'Ribbon',
    category: 'creative',
    headerStyle: 'standard',
    accentElement: 'ribbon-corner',
    tableStyle: 'tinted-header',
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-bar',
    addressLayout: 'two-column',
    metaStyle: 'badge-box',
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 12. LEDGER ─────────────────────────────────────────────
  // Traditional accounting ledger style
  ledger: {
    key: 'ledger',
    name: 'Ledger',
    category: 'classic',
    headerStyle: 'standard',
    accentElement: 'double-line',
    tableStyle: 'ledger',           // double-rule header, light grid
    showSerialNo: true,
    altRowShading: true,
    totalsAlign: 'right',
    grandTotalStyle: 'double-border',
    addressLayout: 'two-column',
    metaStyle: 'label-value',
    showShipTo: false,
    notesStyle: 'boxed',
  },

  // ─── 13. MINIMAL ────────────────────────────────────────────
  // Ultra-minimal, lots of whitespace
  minimal: {
    key: 'minimal',
    name: 'Minimal',
    category: 'minimal',
    headerStyle: 'minimal',
    accentElement: 'none',
    tableStyle: 'minimal',
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'border-top',
    addressLayout: 'stacked',
    metaStyle: 'inline',
    showShipTo: false,
    notesStyle: 'plain',
  },

  // ─── 14. PRESTIGE ───────────────────────────────────────────
  // Premium look with header badge showing total
  prestige: {
    key: 'prestige',
    name: 'Prestige',
    category: 'professional',
    headerStyle: 'full-color',
    accentElement: 'header-bg',
    tableStyle: 'tinted-header',
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-bar',
    addressLayout: 'two-column',
    metaStyle: 'header-badge',      // total badge in header
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 15. DUAL ───────────────────────────────────────────────
  // Two-column header: business left, invoice info right
  dual: {
    key: 'dual',
    name: 'Dual',
    category: 'professional',
    headerStyle: 'dual-column',
    accentElement: 'bottom-divider',
    tableStyle: 'bordered-header',
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-border',
    addressLayout: 'two-column',
    metaStyle: 'column-meta',
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 16. WAVE ───────────────────────────────────────────────
  // Decorative wave-like accent shapes
  wave: {
    key: 'wave',
    name: 'Wave',
    category: 'creative',
    headerStyle: 'standard',
    accentElement: 'wave-top',
    tableStyle: 'colored-header',
    showSerialNo: false,
    altRowShading: true,
    totalsAlign: 'right',
    grandTotalStyle: 'color-bar',
    addressLayout: 'two-column',
    metaStyle: 'badge-box',
    showShipTo: true,
    notesStyle: 'boxed',
  },

  // ─── 17. CORNER ─────────────────────────────────────────────
  // Colored corner accent block
  corner: {
    key: 'corner',
    name: 'Corner',
    category: 'modern',
    headerStyle: 'standard',
    accentElement: 'corner-block',
    tableStyle: 'simple',
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'border-top',
    addressLayout: 'two-column',
    metaStyle: 'inline',
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 18. FRAME ──────────────────────────────────────────────
  // Page border frame effect
  frame: {
    key: 'frame',
    name: 'Frame',
    category: 'classic',
    headerStyle: 'standard',
    accentElement: 'page-frame',
    tableStyle: 'bordered-header',
    showSerialNo: true,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'double-border',
    addressLayout: 'two-column',
    metaStyle: 'label-value',
    showShipTo: true,
    notesStyle: 'boxed',
  },

  // ─── 19. ACCENT ─────────────────────────────────────────────
  // Left accent bar with matching bottom bar
  accent: {
    key: 'accent',
    name: 'Accent',
    category: 'modern',
    headerStyle: 'standard',
    accentElement: 'dual-bars',     // top + bottom accent bars
    tableStyle: 'tinted-header',
    showSerialNo: false,
    altRowShading: false,
    totalsAlign: 'right',
    grandTotalStyle: 'color-border',
    addressLayout: 'two-column',
    metaStyle: 'badge-box',
    showShipTo: true,
    notesStyle: 'plain',
  },

  // ─── 20. CLASSIC ────────────────────────────────────────────
  // Traditional serif-inspired, formal layout
  classic: {
    key: 'classic',
    name: 'Classic',
    category: 'classic',
    headerStyle: 'centered',
    accentElement: 'ornamental-line',
    tableStyle: 'full-grid',
    showSerialNo: true,
    altRowShading: true,
    totalsAlign: 'right',
    grandTotalStyle: 'double-border',
    addressLayout: 'two-column',
    metaStyle: 'centered',
    showShipTo: true,
    notesStyle: 'boxed',
  },
}

export const LAYOUT_LIST = Object.values(LAYOUTS)
export const LAYOUT_KEYS = Object.keys(LAYOUTS)
