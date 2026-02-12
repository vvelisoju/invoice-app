# Invoice Template System — 100 Templates Plan

## 1. Current State (6 Templates)

| # | ID | Name | Layout Style | Color | Issues |
|---|-----|------|-------------|-------|--------|
| 1 | `clean` | Classic Clean | Minimal left-aligned | Charcoal #1F2937 | OK — baseline |
| 2 | `modern-red` | Modern Red | Left sidebar accent | Red #DC2626 | OK |
| 3 | `classic-red` | Classic Red | Top bar stripe | Green #047857 | **Misleading name** — actually green |
| 4 | `wexler` | Wexler | Full header band | Navy #1E3A5F | OK |
| 5 | `plexer` | Plexer | Thin top bar + left-border meta | Gray #374151 | OK |
| 6 | `contemporary` | Contemporary | Large colored header + total badge | Rose #E11D48 | OK |

### Architecture Problems
- **Massive duplication**: Each template is ~150 lines, 90% shared logic copy-pasted
- **No shared renderer**: Header, addresses, table, totals, notes, signature repeated 6×
- **Not scalable**: 100 templates × 150 lines = 15,000 lines (unmaintainable)
- **Missing GST features**: No CGST/SGST/IGST breakup, no HSN column, no amount-in-words
- **Hardcoded preview colors** in TemplateSelectModal

---

## 2. New Architecture: Theme-Based Template Engine

### Core Concept
```
Template = LayoutVariant + ColorPalette + TypographyConfig
```

### File Structure
```
app/src/features/invoices/utils/templates/
├── registry.js                  # Template metadata (100 entries)
├── pdfTemplates.jsx             # TEMPLATE_COMPONENTS map (backward-compat)
├── BaseInvoiceDocument.jsx      # NEW — Single shared PDF renderer
├── layouts/                     # NEW — Layout variant renderers
│   ├── index.js                 # Layout registry
│   ├── CleanLayout.jsx          # Layout: minimal
│   ├── SidebarLayout.jsx        # Layout: left sidebar accent
│   ├── HeaderBandLayout.jsx     # Layout: full colored header
│   ├── HeaderStripeLayout.jsx   # Layout: thin top stripe
│   ├── SplitHeaderLayout.jsx    # Layout: two-tone split header
│   ├── BorderedLayout.jsx       # Layout: full page border frame
│   ├── CornerAccentLayout.jsx   # Layout: decorative corner block
│   ├── MinimalLineLayout.jsx    # Layout: single horizontal line
│   ├── CompactLayout.jsx        # Layout: dense, tighter spacing
│   └── BoldTitleLayout.jsx      # Layout: oversized title, modern
├── themes/                      # NEW — Theme config definitions
│   ├── index.js                 # All 100 theme configs exported
│   ├── clean-themes.js          # 5 color variants of Clean layout
│   ├── sidebar-themes.js        # 5 color variants of Sidebar layout
│   ├── ... (20 files, one per layout family)
│   └── utils.js                 # Color palette definitions
└── shared/                      # NEW — Shared PDF sub-components
    ├── HeaderSection.jsx        # Logo + business info + meta
    ├── AddressSection.jsx       # Bill To / Ship To blocks
    ├── LineItemsTable.jsx       # Table with configurable columns
    ├── TotalsSection.jsx        # Subtotal, discount, GST breakup, total
    ├── FooterSection.jsx        # Notes, terms, bank details, signature
    └── BrandedFooter.jsx        # "Invoice by InvoiceBaba.com"
```

### Theme Config Shape
Each of the 100 templates is defined by a config object like:
```js
{
  id: 'clean-charcoal',
  name: 'Classic Clean',
  description: 'Clean and minimal layout with subtle accents',
  category: 'minimal',           // minimal | professional | modern | classic | bold | elegant
  colorFamily: 'black',          // for color filter in UI
  layout: 'clean',               // which layout renderer to use
  previewColor: '#1F2937',       // swatch color in selector

  colors: {
    primary: '#1F2937',          // Main accent color
    primaryLight: '#F3F4F6',     // Light variant (table header bg, meta box bg)
    primaryDark: '#111827',      // Dark variant (grand total bg)
    text: '#1F2937',             // Body text
    textLight: '#6B7280',        // Secondary text
    textMuted: '#9CA3AF',        // Muted labels
    headerText: '#FFFFFF',       // Text on colored backgrounds
    border: '#E5E7EB',           // Table/section borders
    altRowBg: '#FAFAFA',         // Alternating row background
  },

  typography: {
    titleSize: 24,               // Document heading size
    titleWeight: 'bold',
    titleLetterSpacing: 0,
    bodySize: 10,
    labelSize: 8,
    labelLetterSpacing: 1,
    labelTransform: 'uppercase',
  },

  spacing: {
    pagePadding: 40,
    sectionGap: 20,
    tableRowPadding: 8,
    density: 'normal',           // compact | normal | spacious
  },

  features: {
    showSerialNumbers: false,
    showAlternatingRows: false,
    accentBarWidth: 0,           // 0 = none, 4-6 = thin bar
  }
}
```

### BaseInvoiceDocument Component
A single `<BaseInvoiceDocument invoice={invoice} theme={theme} />` that:
1. Reads the `theme.layout` to pick the layout renderer
2. Passes `theme.colors`, `theme.typography`, `theme.spacing` to all sub-components
3. Uses the same `getDocLabels()`, `formatCurrency()`, `formatDate()` helpers
4. Handles all existing features: logo, signature, bank details, GST, notes, terms

### Backward Compatibility
The existing `TEMPLATE_COMPONENTS` map is preserved:
```js
// pdfTemplates.jsx — backward-compatible wrapper
export const TEMPLATE_COMPONENTS = Object.fromEntries(
  Object.entries(ALL_THEMES).map(([id, theme]) => [
    id,
    ({ invoice }) => <BaseInvoiceDocument invoice={invoice} theme={theme} />
  ])
)
```
This means `pdfGenerator.jsx` requires ZERO changes.

---

## 3. Template Catalog — 100 Templates

### 20 Layout Families × 5 Color Palettes = 100 Templates

### Color Palettes

| Palette | Name | Primary | Light | Dark | Family |
|---------|------|---------|-------|------|--------|
| P1 | Charcoal | #374151 | #F3F4F6 | #111827 | black |
| P2 | Crimson | #DC2626 | #FEF2F2 | #991B1B | red |
| P3 | Ocean | #2563EB | #DBEAFE | #1D4ED8 | blue |
| P4 | Forest | #047857 | #ECFDF5 | #065F46 | green |
| P5 | Royal | #7C3AED | #F5F3FF | #6D28D9 | purple |

### Layout Family 1: Classic Clean
Minimal, no decorative elements. Left-aligned header, simple table borders.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 1 | `clean-charcoal` | Classic Clean | Charcoal |
| 2 | `clean-crimson` | Classic Crimson | Crimson |
| 3 | `clean-ocean` | Classic Ocean | Ocean |
| 4 | `clean-forest` | Classic Forest | Forest |
| 5 | `clean-royal` | Classic Royal | Royal |

### Layout Family 2: Modern Sidebar
Thin colored sidebar on the left, meta box with tinted background.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 6 | `sidebar-charcoal` | Modern Charcoal | Charcoal |
| 7 | `sidebar-crimson` | Modern Crimson | Crimson |
| 8 | `sidebar-ocean` | Modern Ocean | Ocean |
| 9 | `sidebar-forest` | Modern Forest | Forest |
| 10 | `sidebar-royal` | Modern Royal | Royal |

### Layout Family 3: Header Stripe
Thin colored bar at the very top of the page, business name in accent color.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 11 | `stripe-charcoal` | Stripe Charcoal | Charcoal |
| 12 | `stripe-crimson` | Stripe Crimson | Crimson |
| 13 | `stripe-ocean` | Stripe Ocean | Ocean |
| 14 | `stripe-forest` | Stripe Forest | Forest |
| 15 | `stripe-royal` | Stripe Royal | Royal |

### Layout Family 4: Executive Band
Full-width colored header band with white text. Logo and meta inside the band.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 16 | `band-charcoal` | Executive Charcoal | Charcoal |
| 17 | `band-crimson` | Executive Crimson | Crimson |
| 18 | `band-ocean` | Executive Ocean | Ocean |
| 19 | `band-forest` | Executive Forest | Forest |
| 20 | `band-royal` | Executive Royal | Royal |

### Layout Family 5: Corporate
Thin top bar, meta section with left border accent. Professional spacing.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 21 | `corporate-charcoal` | Corporate Charcoal | Charcoal |
| 22 | `corporate-crimson` | Corporate Crimson | Crimson |
| 23 | `corporate-ocean` | Corporate Ocean | Ocean |
| 24 | `corporate-forest` | Corporate Forest | Forest |
| 25 | `corporate-royal` | Corporate Royal | Royal |

### Layout Family 6: Bold Header
Large colored header section with total badge overlay. Contemporary feel.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 26 | `bold-charcoal` | Bold Charcoal | Charcoal |
| 27 | `bold-crimson` | Bold Crimson | Crimson |
| 28 | `bold-ocean` | Bold Ocean | Ocean |
| 29 | `bold-forest` | Bold Forest | Forest |
| 30 | `bold-royal` | Bold Royal | Royal |

### Layout Family 7: Bordered Frame
Elegant border frame around the entire page. Classic, formal feel.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 31 | `bordered-charcoal` | Bordered Charcoal | Charcoal |
| 32 | `bordered-crimson` | Bordered Crimson | Crimson |
| 33 | `bordered-ocean` | Bordered Ocean | Ocean |
| 34 | `bordered-forest` | Bordered Forest | Forest |
| 35 | `bordered-royal` | Bordered Royal | Royal |

### Layout Family 8: Split Header
Two-column header: left side has logo/business, right side has colored meta block.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 36 | `split-charcoal` | Split Charcoal | Charcoal |
| 37 | `split-crimson` | Split Crimson | Crimson |
| 38 | `split-ocean` | Split Ocean | Ocean |
| 39 | `split-forest` | Split Forest | Forest |
| 40 | `split-royal` | Split Royal | Royal |

### Layout Family 9: Minimal Line
Ultra-minimal with just a single horizontal accent line separating header from body.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 41 | `minimal-charcoal` | Minimal Charcoal | Charcoal |
| 42 | `minimal-crimson` | Minimal Crimson | Crimson |
| 43 | `minimal-ocean` | Minimal Ocean | Ocean |
| 44 | `minimal-forest` | Minimal Forest | Forest |
| 45 | `minimal-royal` | Minimal Royal | Royal |

### Layout Family 10: Compact Dense
Tighter spacing, smaller fonts. Fits more line items per page. For high-volume businesses.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 46 | `compact-charcoal` | Compact Charcoal | Charcoal |
| 47 | `compact-crimson` | Compact Crimson | Crimson |
| 48 | `compact-ocean` | Compact Ocean | Ocean |
| 49 | `compact-forest` | Compact Forest | Forest |
| 50 | `compact-royal` | Compact Royal | Royal |

### Layout Family 11: Corner Accent
Decorative colored block in top-left corner. Modern geometric feel.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 51 | `corner-charcoal` | Corner Charcoal | Charcoal |
| 52 | `corner-crimson` | Corner Crimson | Crimson |
| 53 | `corner-ocean` | Corner Ocean | Ocean |
| 54 | `corner-forest` | Corner Forest | Forest |
| 55 | `corner-royal` | Corner Royal | Royal |

### Layout Family 12: Dual Tone
Header area has colored background, body is white. Clean separation.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 56 | `dualtone-charcoal` | Dual Tone Charcoal | Charcoal |
| 57 | `dualtone-crimson` | Dual Tone Crimson | Crimson |
| 58 | `dualtone-ocean` | Dual Tone Ocean | Ocean |
| 59 | `dualtone-forest` | Dual Tone Forest | Forest |
| 60 | `dualtone-royal` | Dual Tone Royal | Royal |

### Layout Family 13: Ledger
Accounting-style: serial numbers, dashed row separators, precise alignment. For CAs/accountants.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 61 | `ledger-charcoal` | Ledger Charcoal | Charcoal |
| 62 | `ledger-crimson` | Ledger Crimson | Crimson |
| 63 | `ledger-ocean` | Ledger Ocean | Ocean |
| 64 | `ledger-forest` | Ledger Forest | Forest |
| 65 | `ledger-royal` | Ledger Royal | Royal |

### Layout Family 14: Elegant
Refined with thin double-line borders, serif-inspired headings (via Helvetica bold), classic feel.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 66 | `elegant-charcoal` | Elegant Charcoal | Charcoal |
| 67 | `elegant-crimson` | Elegant Crimson | Crimson |
| 68 | `elegant-ocean` | Elegant Ocean | Ocean |
| 69 | `elegant-forest` | Elegant Forest | Forest |
| 70 | `elegant-royal` | Elegant Royal | Royal |

### Layout Family 15: Grid Box
Boxed/grid layout — each section in its own bordered box. Structured feel.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 71 | `grid-charcoal` | Grid Charcoal | Charcoal |
| 72 | `grid-crimson` | Grid Crimson | Crimson |
| 73 | `grid-ocean` | Grid Ocean | Ocean |
| 74 | `grid-forest` | Grid Forest | Forest |
| 75 | `grid-royal` | Grid Royal | Royal |

### Layout Family 16: GST Pro
Optimized for Indian GST compliance: HSN/SAC column, CGST/SGST/IGST breakup, place of supply.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 76 | `gstpro-charcoal` | GST Pro Charcoal | Charcoal |
| 77 | `gstpro-crimson` | GST Pro Crimson | Crimson |
| 78 | `gstpro-ocean` | GST Pro Ocean | Ocean |
| 79 | `gstpro-forest` | GST Pro Forest | Forest |
| 80 | `gstpro-royal` | GST Pro Royal | Royal |

### Layout Family 17: Ribbon
Diagonal accent ribbon/stripe in top-right corner. Eye-catching modern design.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 81 | `ribbon-charcoal` | Ribbon Charcoal | Charcoal |
| 82 | `ribbon-crimson` | Ribbon Crimson | Crimson |
| 83 | `ribbon-ocean` | Ribbon Ocean | Ocean |
| 84 | `ribbon-forest` | Ribbon Forest | Forest |
| 85 | `ribbon-royal` | Ribbon Royal | Royal |

### Layout Family 18: Letterhead
Minimal header designed to overlay printed letterhead. Extra top margin, subtle text.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 86 | `letterhead-charcoal` | Letterhead Charcoal | Charcoal |
| 87 | `letterhead-crimson` | Letterhead Crimson | Crimson |
| 88 | `letterhead-ocean` | Letterhead Ocean | Ocean |
| 89 | `letterhead-forest` | Letterhead Forest | Forest |
| 90 | `letterhead-royal` | Letterhead Royal | Royal |

### Layout Family 19: Striped Table
Focus on the table — alternating striped rows, prominent column headers. Data-heavy invoices.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 91 | `striped-charcoal` | Striped Charcoal | Charcoal |
| 92 | `striped-crimson` | Striped Crimson | Crimson |
| 93 | `striped-ocean` | Striped Ocean | Ocean |
| 94 | `striped-forest` | Striped Forest | Forest |
| 95 | `striped-royal` | Striped Royal | Royal |

### Layout Family 20: Prestige
Premium feel: wide margins, generous spacing, centered business name, subtle accents. For luxury/high-value services.

| # | Template ID | Name | Palette |
|---|------------|------|---------|
| 96 | `prestige-charcoal` | Prestige Charcoal | Charcoal |
| 97 | `prestige-crimson` | Prestige Crimson | Crimson |
| 98 | `prestige-ocean` | Prestige Ocean | Ocean |
| 99 | `prestige-forest` | Prestige Forest | Forest |
| 100 | `prestige-royal` | Prestige Royal | Royal |

---

## 4. Backward Compatibility Mapping

Existing template IDs must continue to work. Map old → new:

| Old ID | New ID | Notes |
|--------|--------|-------|
| `clean` | `clean-charcoal` | Default fallback template |
| `modern-red` | `sidebar-crimson` | Sidebar layout, red palette |
| `classic-red` | `stripe-forest` | Was actually green, now correctly named |
| `wexler` | `band-charcoal` | Navy band → charcoal band (closest match) |
| `plexer` | `corporate-charcoal` | Professional two-tone |
| `contemporary` | `bold-crimson` | Bold header with rose/crimson |

Old IDs will be kept as **aliases** in `TEMPLATE_COMPONENTS` pointing to the same theme configs with original colors preserved exactly.

---

## 5. Implementation Phases

### Phase 1: Refactor Foundation (No visible changes)
1. Extract shared sub-components from existing templates into `shared/`
2. Create `BaseInvoiceDocument.jsx` that uses shared components
3. Recreate existing 6 templates using BaseInvoiceDocument + theme configs
4. **Verify**: Existing templates render identically (pixel comparison)

### Phase 2: Layout System (10 new layouts)
1. Implement 10 new layout variants (bordered, split, minimal, compact, corner, dualtone, ledger, elegant, grid, gstpro)
2. Each layout tested with charcoal palette first
3. **Verify**: All 20 layouts render correctly

### Phase 3: Color Multiplication (100 templates)
1. Define 5 color palettes
2. Generate all 100 theme configs (20 layouts × 5 palettes)
3. Update registry.js with 100 entries
4. Update server seed.js with 100 BaseTemplate records
5. **Verify**: All 100 templates render correctly

### Phase 4: UI Updates
1. Add category-based filtering to TemplateSelectModal
2. Add search/filter for 100 templates
3. Update preview color generation to be dynamic from theme config
4. Add template preview thumbnails (optional, can be phased)

### Phase 5: GST Enhancements (across all templates)
1. Add HSN/SAC column support to BaseInvoiceDocument
2. Add CGST/SGST/IGST breakup in totals section
3. Add amount-in-words rendering
4. Add place of supply display
5. **Verify**: All 100 templates handle GST features correctly

---

## 6. No-Regression Strategy

1. **Old IDs preserved**: `TEMPLATE_COMPONENTS['clean']` still works
2. **pdfGenerator.jsx unchanged**: The dispatch mechanism stays the same
3. **Server API unchanged**: Same routes, same schema
4. **Alias mapping**: Old template IDs → new theme configs with exact same colors
5. **Build verification**: `npm run build` must pass after each phase
6. **Visual comparison**: Existing 6 templates must produce visually identical PDFs

---

## 7. Categories for UI Filtering

| Category | Description | Layout Families |
|----------|------------|-----------------|
| Minimal | Clean, simple layouts | Clean, Minimal Line, Letterhead |
| Professional | Business-appropriate, structured | Corporate, Split Header, Ledger |
| Modern | Contemporary, bold designs | Sidebar, Bold Header, Corner Accent, Ribbon |
| Classic | Traditional, formal | Header Stripe, Executive Band, Elegant |
| Structured | Grid-based, boxed layouts | Bordered Frame, Grid Box, Dual Tone |
| Specialized | Purpose-built templates | GST Pro, Compact, Striped Table, Prestige |

---

## 8. Color Families for UI Filtering

| Family | Colors Included | Templates |
|--------|----------------|-----------|
| Black/Gray | Charcoal variants | 20 |
| Red | Crimson variants | 20 |
| Blue | Ocean variants | 20 |
| Green | Forest variants | 20 |
| Purple | Royal variants | 20 |
