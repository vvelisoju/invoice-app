# UI/UX Refactoring Backlog — Invoice Baba

> **Goal**: Refactor the application's UI and UX architecture to follow **Invisible UI** principles — the interface should feel effortless, dense, and self-explanatory. Every screen must be simple enough for a non-technical user. Zero learning curve.
>
> **Guiding Principles**:
> - **Invisible UI**: The best interface is one the user doesn't notice. Remove friction, reduce choices, hide complexity.
> - **Density**: Show more data in less space. Reduce whitespace, padding, and card chrome.
> - **Reusability**: Shared sidebar, shared filter panel, shared form components.
> - **Minimal Data Entry**: Smart defaults, auto-fill, contextual suggestions.
> - **Progressive Disclosure**: Show basics first, advanced options on demand.
> - **No Regression**: Every change must preserve existing functionality.

---

## Phase 1 — Sidebar Architecture Overhaul

### TASK-001: Context-Aware Sidebar Shell
- **Status**: `pending`
- **Priority**: P0 — Critical (blocks all other sidebar tasks)
- **Description**: Refactor `AppSidebar.jsx` to be a **context-aware shell** that renders different content based on the current route. The sidebar should detect which page the user is on and render the appropriate panel (filters, doc-type picker, or settings nav).
- **Current**: Sidebar always shows "CREATE NEW" doc-type list on every page (Documents, Customers, Products, Reports, Settings).
- **Target**: Sidebar renders different content per route:
  - `/invoices/new` or `/invoices/:id/edit` → Doc-type picker (current "CREATE NEW" sidebar)
  - `/invoices` → Document filters sidebar
  - `/customers` → Customer filters sidebar
  - `/products` → Product filters sidebar
  - `/reports` → Report filters sidebar
  - `/settings` → Settings navigation sidebar
- **Files**: `app/src/components/layout/AppSidebar.jsx`, `app/src/components/layout/AppLayout.jsx`
- **Acceptance**: Sidebar content changes based on route. Bottom plan card always visible. No regressions on mobile drawer.

### TASK-002: Documents Page — Sidebar Filters
- **Status**: `pending`
- **Priority**: P0
- **Description**: Move all document list filters (status pills, doc-type checkboxes, customer select) from the page header into the sidebar. The main content area should only contain the toolbar (title + actions) and the data table.
- **Current**: Filters are inline above the table in `InvoiceListPage.jsx` (status pills row, doc-type pills row, customer dropdown).
- **Target**: Sidebar contains:
  - Search input
  - Status filter (All / Unpaid / Paid / Draft) — radio-style list
  - Document Type filter — checkbox list (only enabled types)
  - Customer filter — searchable single-select
- **Files**: `app/src/features/invoices/InvoiceListPage.jsx`, new `app/src/components/sidebar/DocumentFiltersSidebar.jsx`
- **Acceptance**: Filters work identically. URL sync preserved. Mobile uses collapsible filter drawer (existing pattern).

### TASK-003: Customers Page — Sidebar Filters
- **Status**: `pending`
- **Priority**: P1
- **Description**: Move customer list filters into the sidebar.
- **Current**: Status pills (All / Outstanding / Deleted) and search are inline in `CustomerListPage.jsx`.
- **Target**: Sidebar contains:
  - Search input
  - Status filter (All Customers / Outstanding Balance / Deleted) — radio-style list
- **Files**: `app/src/features/customers/CustomerListPage.jsx`, new `app/src/components/sidebar/CustomerFiltersSidebar.jsx`
- **Acceptance**: Filters work identically. URL query param sync preserved.

### TASK-004: Products Page — Sidebar Filters
- **Status**: `pending`
- **Priority**: P1
- **Description**: Move product list filters into the sidebar.
- **Current**: Status pills (All / Deleted) and search inline in `ProductListPage.jsx`.
- **Target**: Sidebar contains:
  - Search input
  - Status filter (All Products / Deleted) — radio-style list
- **Files**: `app/src/features/products/ProductListPage.jsx`, new `app/src/components/sidebar/ProductFiltersSidebar.jsx`
- **Acceptance**: Filters work identically. URL sync preserved.

### TASK-005: Reports Page — Sidebar Filters
- **Status**: `pending`
- **Priority**: P1
- **Description**: Move report controls into the sidebar.
- **Current**: Doc-type selector dropdown and tab navigation are inline in `ReportsPage.jsx`.
- **Target**: Sidebar contains:
  - Document Type selector (radio list of enabled types)
  - Report tab navigation (Sales Register, GST Returns, Documents, Customers, Annual) — vertical nav list
  - CA Package download button
- **Files**: `app/src/features/reports/ReportsPage.jsx`, new `app/src/components/sidebar/ReportFiltersSidebar.jsx`
- **Acceptance**: Report tab switching works from sidebar. Doc-type filter applies to all tabs.

### TASK-006: New Invoice Page — Preserve Doc-Type Sidebar
- **Status**: `pending`
- **Priority**: P0
- **Description**: Keep the current "CREATE NEW" doc-type sidebar exclusively for the New Invoice page (and Edit Invoice page). Ensure the sidebar correctly shows doc-type picker with default badge and star-to-set-default only on `/invoices/new` and `/invoices/:id/edit` routes.
- **Files**: `app/src/components/layout/AppSidebar.jsx`
- **Acceptance**: Doc-type sidebar only appears on invoice create/edit. All other pages show contextual sidebar.

### TASK-007: Shared Sidebar Filter Components
- **Status**: `pending`
- **Priority**: P0 (blocks TASK-002 through TASK-005)
- **Description**: Create reusable sidebar filter components:
  - `SidebarSection` — collapsible section with title
  - `SidebarRadioFilter` — radio-style single-select list (for status filters)
  - `SidebarCheckboxFilter` — multi-select checkbox list (for doc-type filters)
  - `SidebarSearchInput` — compact search input
  - `SidebarSelectFilter` — searchable single-select (for customer filter)
- **Files**: New `app/src/components/sidebar/` directory with shared components
- **Acceptance**: All sidebar filter panels use these shared components. Consistent styling.

---

## Phase 2 — Settings Page Restructure

### TASK-008: Settings — Sidebar Navigation Menu
- **Status**: `pending`
- **Priority**: P0
- **Description**: Replace the current horizontal scrolling tab bar with a **sidebar navigation menu**. The sidebar should show a well-organized hierarchy of settings categories. This is the most impactful change for discoverability.
- **Current**: 6 horizontal tabs (Business Info, GST Settings, Bank & Payment, Invoice Settings, Invoice Templates, Manage Subscription). All squeezed into scrollable pills. Hard to find specific settings.
- **Target Sidebar Hierarchy**:
  ```
  BUSINESS
  ├── Company Profile        (name, phone, email, website, address)
  ├── Logo & Branding        (logo upload, signature upload)
  └── GST Configuration      (enable GST, GSTIN, state code)

  INVOICING
  ├── General Preferences    (enable fields: PO#, shipping, discount, etc.)
  ├── Document Types         (enable/disable types, set default)
  ├── Numbering & Defaults   (per-type prefix, next number, notes, terms)
  ├── Custom Fields          (per-type custom fields CRUD)
  ├── Section Labels         (per-type label overrides — paid plan)
  └── Templates              (template gallery with preview)

  PAYMENTS
  ├── Bank Details           (account name, number, IFSC, UPI, notes)
  └── Payment Terms          (default due days, payment instructions)

  ACCOUNT
  ├── Profile                (name, email, phone)
  ├── Subscription           (plan info, manage, upgrade)
  └── Danger Zone            (delete account, clear cache, logout)
  ```
- **Files**: `app/src/features/settings/SettingsPage.jsx`, new `app/src/components/sidebar/SettingsNavSidebar.jsx`
- **Acceptance**: All settings reachable via sidebar nav. Active item highlighted. Deep-link URLs work (`/settings?section=invoicing&tab=templates`). No settings lost in restructure.

### TASK-009: Settings — Dense Card Layouts
- **Status**: `pending`
- **Priority**: P1
- **Description**: Reduce vertical space usage across all settings sections. Current sections have excessive padding and spacing between cards.
- **Target**:
  - Reduce card header padding from `px-5 py-2.5` to `px-4 py-2`
  - Reduce card body padding from `p-6` to `p-4`
  - Reduce inter-card gap from `space-y-6` to `space-y-3`
  - Use `gap-3` instead of `gap-5` in form grids
- **Files**: `app/src/features/settings/SettingsPage.jsx`, `app/src/components/settings/BusinessInfoForm.jsx`
- **Acceptance**: Settings page feels more compact. All content still readable. No overlaps.

### TASK-010: Settings — Template Preview & Quick Switch
- **Status**: `pending`
- **Priority**: P1
- **Description**: Add a template preview capability. Users should be able to see a larger preview of any template and navigate between templates (prev/next) without going back to the grid.
- **Current**: Template grid shows mini-preview thumbnails. Clicking selects immediately. No full preview.
- **Target**:
  - Clicking a template opens a **preview modal** with a larger rendered preview
  - Modal has "Previous" / "Next" navigation arrows
  - "Select This Template" button in modal to confirm selection
  - Current template shown with a "Currently Active" badge
- **Files**: `app/src/features/settings/SettingsPage.jsx` (TemplateSection), new `app/src/components/TemplatePreviewModal.jsx`
- **Acceptance**: Users can browse templates with preview before committing. Arrow keys navigate between templates.

---

## Phase 3 — Header & Navigation Fixes

### TASK-011: Move "+New" Button to Right-Aligned
- **Status**: `pending`
- **Priority**: P1
- **Description**: Move the "+ New" quick action button in the header from its current position (after nav tabs, left-center area) to the **right side** of the header, before the notification bell.
- **Current**: `+ New` button sits after the nav tabs with a divider, center-left area.
- **Target**: `+ New` button positioned in the right actions group, before NotificationBell. Right-aligned. More prominent.
- **Files**: `app/src/components/layout/AppHeader.jsx`, `app/src/components/layout/navigationConfig.js`
- **Acceptance**: Button is right-aligned. Same functionality (opens new invoice with default doc type).

### TASK-012: Densify Page Toolbars
- **Status**: `pending`
- **Priority**: P2
- **Description**: Reduce toolbar heights across all list pages. Current toolbars have generous padding that wastes vertical space.
- **Target**:
  - Page title: `text-sm` → keep, but reduce `py` padding
  - Remove subtitle text from `PageToolbar` (Customers, Products) — the page title is self-explanatory
  - Reduce toolbar border and background chrome
- **Files**: `app/src/components/data-table/PageToolbar.jsx`, all list pages
- **Acceptance**: More data visible above the fold. Toolbars feel tighter.

---

## Phase 4 — CSS & Form Input Fixes

### TASK-013: Fix Oversized Checkboxes and Switches
- **Status**: `pending`
- **Priority**: P0 — Bug Fix
- **Description**: Checkboxes and switch/toggle inputs are rendering abnormally large. This is caused by the global CSS rule in `index.css` that sets `min-height: 40px; min-width: 44px` on `input[type="checkbox"]` and `input[type="radio"]` for tap-target compliance. This overrides the explicit `w-3.5 h-3.5` sizing on checkboxes.
- **Root Cause**: `app/src/index.css` line 56-59:
  ```css
  button, a, [role="button"], input[type="checkbox"], input[type="radio"] {
    min-height: 40px;
    min-width: 44px;
  }
  ```
  This forces all checkboxes/radios to be at least 40×44px, ignoring the Tailwind sizing classes.
- **Fix**: Remove `input[type="checkbox"]` and `input[type="radio"]` from the global tap-target rule. Instead, ensure their **parent label/container** meets tap-target size. Checkboxes themselves should be visually small (16-20px) but wrapped in a label with adequate tap area.
- **Files**: `app/src/index.css`, audit all checkbox/radio usages across the app
- **Affected Locations**:
  - Custom Fields: "Show on PDF" / "Required" checkboxes (SettingsPage.jsx)
  - Enable GST toggle (BusinessInfoForm.jsx — uses custom FieldToggle, may not be affected)
  - DataTable select-all / row checkboxes
  - Document type filter checkboxes
- **Acceptance**: Checkboxes render at normal size (~16px). Toggle switches render at designed size (h-7 w-12). Parent labels still meet 44px tap-target on mobile.

### TASK-014: Normalize Toggle/Switch Component
- **Status**: `pending`
- **Priority**: P1
- **Description**: The `FieldToggle` component in `BusinessInfoForm.jsx` uses a custom button-based switch (`h-7 w-12`). Ensure this is the **only** toggle pattern used app-wide. Audit for any native `<input type="checkbox">` used as toggles and replace with `FieldToggle`.
- **Files**: `app/src/components/settings/BusinessInfoForm.jsx` (FieldToggle), audit all settings sections
- **Acceptance**: Consistent toggle appearance everywhere. No oversized toggles.

### TASK-015: Standardize Form Input Heights
- **Status**: `pending`
- **Priority**: P2
- **Description**: Audit and standardize all form input heights across the app. Currently there's inconsistency between `py-2`, `py-2.5`, and various padding combinations.
- **Target**: All text inputs: `px-3 py-2 text-sm` (consistent 36px height). All textareas: `px-3 py-2 text-sm`.
- **Files**: `app/src/components/settings/BusinessInfoForm.jsx`, `app/src/features/settings/SettingsPage.jsx`, all form components
- **Acceptance**: All inputs have uniform height and padding.

---

## Phase 5 — Density & Invisible UI Polish

### TASK-016: Densify Document List Table
- **Status**: `pending`
- **Priority**: P2
- **Description**: Reduce row height in the Documents table. Current rows have generous padding.
- **Target**:
  - Reduce row vertical padding
  - Smaller font for secondary info (GST number, date)
  - Tighter column spacing
- **Files**: `app/src/features/invoices/InvoiceListPage.jsx`, `app/src/components/data-table/DataTable.jsx`
- **Acceptance**: More rows visible without scrolling. Data still legible.

### TASK-017: Densify Customer & Product Lists
- **Status**: `pending`
- **Priority**: P2
- **Description**: Apply same density improvements to Customer and Product list tables.
- **Files**: `app/src/features/customers/CustomerListPage.jsx`, `app/src/features/products/ProductListPage.jsx`
- **Acceptance**: Consistent density with Documents list.

### TASK-018: Remove Redundant UI Chrome
- **Status**: `pending`
- **Priority**: P2
- **Description**: Apply Invisible UI principles — remove decorative elements that don't serve a function:
  - Remove colored section icons in settings cards (the icon+colored-bg squares before each section title add visual noise)
  - Simplify card headers to just text
  - Remove "Show X to Y of Z" pagination text (keep just Previous/Next)
  - Remove subtitle text from page headers where title is self-explanatory
- **Files**: All settings section components, list pages
- **Acceptance**: Cleaner, less visually busy interface. No information loss.

### TASK-019: Smart Defaults for Minimal Data Entry
- **Status**: `pending`
- **Priority**: P2
- **Description**: Audit the invoice creation flow and settings for opportunities to reduce required user input:
  - Auto-suggest invoice number (already done)
  - Auto-fill today's date (already done)
  - Pre-fill "Bill To" from recent/frequent customers
  - Remember last-used document type
  - Default due date = invoice date + business default payment terms
  - Auto-populate line item from recent items when user starts typing
- **Files**: `app/src/features/invoices/hooks/useInvoiceForm.js`, `app/src/features/invoices/NewInvoicePage.jsx`
- **Acceptance**: Fewer fields the user needs to manually fill. Existing data entry paths unbroken.

---

## Phase 6 — Mobile Sidebar Adaptation

### TASK-020: Mobile Filter Drawer for List Pages
- **Status**: `pending`
- **Priority**: P1
- **Description**: On mobile, the sidebar is hidden. Currently each page has its own inline mobile filter toggle (`showMobileFilters` state + collapsible div). Unify this into a **filter drawer** that slides from the left (same as the existing mobile sidebar drawer) and contains the same filter components as the desktop sidebar.
- **Current**: Each page has a `SlidersHorizontal` icon button that toggles a collapsible filter section.
- **Target**: The `SlidersHorizontal` button opens the mobile drawer with contextual filter sidebar content (same components used in desktop sidebar). Consistent UX across all pages.
- **Files**: `app/src/components/layout/AppLayout.jsx`, all list pages
- **Acceptance**: Mobile filter drawer uses the same sidebar components as desktop. No duplicate filter UI code.

### TASK-021: Mobile Settings Navigation
- **Status**: `pending`
- **Priority**: P1
- **Description**: On mobile, the settings page sidebar nav should render as the primary view (vertical list of settings sections). Tapping a section navigates to that section's content (full-screen on mobile). Back button returns to the nav list.
- **Current**: Horizontal scrolling tab pills on mobile. Hard to discover all settings.
- **Target**: Mobile settings = two-panel pattern:
  1. Settings nav list (full screen)
  2. Tap section → shows section content (full screen) with back arrow
- **Files**: `app/src/features/settings/SettingsPage.jsx`
- **Acceptance**: All settings sections reachable on mobile. Back navigation works.

---

## Phase 7 — Reusable Component Extraction

### TASK-022: Extract Shared FilterSidebar Component
- **Status**: `pending`
- **Priority**: P1
- **Description**: Create a `FilterSidebar` wrapper component that handles:
  - Desktop: renders as the left sidebar panel (w-56, bg-bgSecondary, border-r)
  - Mobile: renders inside the drawer overlay
  - Bottom plan card slot
  - Scroll handling for long filter lists
- **Files**: New `app/src/components/sidebar/FilterSidebar.jsx`
- **Acceptance**: All page-specific sidebars use this as their shell. Consistent width, padding, scroll behavior.

### TASK-023: Extract SearchInput Component
- **Status**: `pending`
- **Priority**: P2
- **Description**: Multiple pages duplicate the same search input pattern (icon + input + debounce). Extract into a shared `SearchInput` component.
- **Files**: New `app/src/components/SearchInput.jsx`, refactor `InvoiceListPage`, `CustomerListPage`, `ProductListPage`
- **Acceptance**: All search inputs use the shared component. Debounce behavior consistent.

### TASK-024: Extract ConfirmDialog Component
- **Status**: `pending`
- **Priority**: P2
- **Description**: Multiple pages duplicate the delete confirmation modal pattern. Extract into a shared `ConfirmDialog` component.
- **Files**: New `app/src/components/ConfirmDialog.jsx`, refactor all pages with delete modals
- **Acceptance**: All confirmation dialogs use the shared component.

---

## Summary Table

| Task ID  | Title                                      | Priority | Status  | Phase |
|----------|--------------------------------------------|----------|---------|-------|
| TASK-001 | Context-Aware Sidebar Shell                | P0       | ✅ done  | 1     |
| TASK-002 | Documents Page — Sidebar Filters           | P0       | ✅ done  | 1     |
| TASK-003 | Customers Page — Sidebar Filters           | P1       | ✅ done  | 1     |
| TASK-004 | Products Page — Sidebar Filters            | P1       | ✅ done  | 1     |
| TASK-005 | Reports Page — Sidebar Filters             | P1       | ✅ done  | 1     |
| TASK-006 | New Invoice Page — Preserve Doc-Type       | P0       | ✅ done  | 1     |
| TASK-007 | Shared Sidebar Filter Components           | P0       | ✅ done  | 1     |
| TASK-008 | Settings — Sidebar Navigation Menu         | P0       | ✅ done  | 2     |
| TASK-009 | Settings — Dense Card Layouts              | P1       | pending | 2     |
| TASK-010 | Settings — Template Preview & Quick Switch | P1       | pending | 2     |
| TASK-011 | Move "+New" Button to Right-Aligned        | P1       | ✅ done  | 3     |
| TASK-012 | Densify Page Toolbars                      | P2       | pending | 3     |
| TASK-013 | Fix Oversized Checkboxes and Switches      | P0       | ✅ done  | 4     |
| TASK-014 | Normalize Toggle/Switch Component          | P1       | pending | 4     |
| TASK-015 | Standardize Form Input Heights             | P2       | pending | 4     |
| TASK-016 | Densify Document List Table                | P2       | pending | 5     |
| TASK-017 | Densify Customer & Product Lists           | P2       | pending | 5     |
| TASK-018 | Remove Redundant UI Chrome                 | P2       | pending | 5     |
| TASK-019 | Smart Defaults for Minimal Data Entry      | P2       | pending | 5     |
| TASK-020 | Mobile Filter Drawer for List Pages        | P1       | pending | 6     |
| TASK-021 | Mobile Settings Navigation                 | P1       | pending | 6     |
| TASK-022 | Extract Shared FilterSidebar Component     | P1       | pending | 7     |
| TASK-023 | Extract SearchInput Component              | P2       | pending | 7     |
| TASK-024 | Extract ConfirmDialog Component            | P2       | pending | 7     |

---

## Recommended Implementation Order

1. **TASK-013** — Fix checkbox/switch CSS bug (quick win, high visibility)
2. **TASK-007** — Build shared sidebar filter components (foundation)
3. **TASK-001** — Context-aware sidebar shell (architecture change)
4. **TASK-006** — Preserve doc-type sidebar for New Invoice
5. **TASK-002** — Documents page sidebar filters
6. **TASK-003** — Customers page sidebar filters
7. **TASK-004** — Products page sidebar filters
8. **TASK-005** — Reports page sidebar filters
9. **TASK-008** — Settings sidebar navigation
10. **TASK-011** — Move +New button right
11. **TASK-009** — Dense settings layouts
12. **TASK-010** — Template preview modal
13. **TASK-014** — Normalize toggles
14. **TASK-020** — Mobile filter drawer
15. **TASK-021** — Mobile settings navigation
16. **TASK-022** — Extract FilterSidebar
17. **TASK-012, 015, 016, 017, 018** — Density & polish pass
18. **TASK-019** — Smart defaults
19. **TASK-023, 024** — Component extraction

---

## Dependencies

```
TASK-007 ──→ TASK-001 ──→ TASK-002, 003, 004, 005, 006
TASK-001 ──→ TASK-020 (mobile adaptation of sidebar)
TASK-008 ──→ TASK-021 (mobile settings nav)
TASK-013 ──→ TASK-014 (normalize after fixing root cause)
TASK-022 ──→ depends on patterns established in TASK-001 through 005
```

---

*Last updated: 2026-03-07*
