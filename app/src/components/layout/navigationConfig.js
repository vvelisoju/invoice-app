import {
  FileText,
  Users,
  PieChart,
  Plus,
  Package,
  FileSpreadsheet,
  Receipt,
  FilePen,
  StickyNote,
  Truck,
  ShoppingCart,
  Banknote,
  ClipboardList,
  FileCheck,
  FileOutput,
  FileMinus,
  FileInput,
} from 'lucide-react'

/**
 * Header navigation tabs — top-level sections.
 * Each tab has a `key` used to look up its sidebar config.
 */
export const headerTabs = [
  { key: 'documents', label: 'My Documents', icon: FileText, basePath: '/invoices' },
  { key: 'customers', label: 'My Customers', icon: Users, basePath: '/customers' },
  { key: 'products', label: 'My Products', icon: Package, basePath: '/products' },
  { key: 'reports', label: 'My Reports', icon: PieChart, basePath: '/reports' },
]

/**
 * Quick-action buttons shown after the divider in the header.
 */
export const headerQuickActions = [
  { label: 'New Invoice', icon: Plus, path: '/invoices/new' },
]

/**
 * All available invoice types.
 * The `key` is stored in the business's `enabledInvoiceTypes` JSON array.
 * The `label` is the display name and also the invoice title used in the form.
 * The `icon` is the Lucide icon component for sidebar display.
 */
export const ALL_INVOICE_TYPES = [
  { key: 'invoice', label: 'Invoice', icon: FileSpreadsheet },
  { key: 'tax_invoice', label: 'Tax Invoice', icon: FileCheck },
  { key: 'proforma', label: 'Proforma Invoice', icon: FileOutput },
  { key: 'receipt', label: 'Receipt', icon: Receipt },
  { key: 'sales_receipt', label: 'Sales Receipt', icon: Banknote },
  { key: 'cash_receipt', label: 'Cash Receipt', icon: Banknote },
  { key: 'quote', label: 'Quote', icon: FilePen },
  { key: 'estimate', label: 'Estimate', icon: ClipboardList },
  { key: 'credit_memo', label: 'Credit Memo', icon: FileMinus },
  { key: 'credit_note', label: 'Credit Note', icon: StickyNote },
  { key: 'purchase_order', label: 'Purchase Order', icon: ShoppingCart },
  { key: 'delivery_note', label: 'Delivery Note', icon: Truck },
]

/**
 * Default enabled invoice types when business has no config yet.
 */
export const DEFAULT_ENABLED_TYPES = [
  'invoice', 'quote', 'receipt'
]

/**
 * Given a pathname, determine which header tab key is active.
 */
export function getActiveTabKey(pathname) {
  if (pathname.startsWith('/reports')) return 'reports'
  if (pathname.startsWith('/products')) return 'products'
  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname.startsWith('/settings') || pathname.startsWith('/templates') || pathname.startsWith('/plans')) return 'settings'
  // Default: documents covers /home, /invoices, and everything else
  return 'documents'
}
