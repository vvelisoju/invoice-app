import {
  FileText,
  Users,
  PieChart,
  UserPlus,
  Plus,
  ListChecks,
  FileSpreadsheet,
  FilePen,
  Banknote,
  StickyNote,
  Truck,
  ShoppingCart,
  Home,
  Settings,
  Palette,
  BarChart3,
  Receipt,
  FilePlus,
  Star,
  Clock,
  UserX,
  FileInput,
  Mail,
  BookUser
} from 'lucide-react'

/**
 * Header navigation tabs — top-level sections.
 * Each tab has a `key` used to look up its sidebar config.
 */
export const headerTabs = [
  { key: 'documents', label: 'My Documents', icon: FileText, basePath: '/invoices' },
  { key: 'customers', label: 'My Customers', icon: Users, basePath: '/customers' },
  { key: 'reports', label: 'My Reports', icon: PieChart, basePath: '/reports' },
]

/**
 * Quick-action buttons shown after the divider in the header.
 */
export const headerQuickActions = [
  { label: 'New Invoice', icon: Plus, path: '/invoices/new' },
]

/**
 * Sidebar config per header tab key.
 * Each entry has optional `createNew` grid items and `sections` with nav links.
 */
export const sidebarConfig = {
  documents: {
    createNew: [
      { label: 'Invoice', icon: FileText, path: '/invoices/new', active: true },
      { label: 'Quote', icon: FilePen, path: '/invoices/new?type=quote' },
      { label: 'Receipt', icon: Receipt, path: '/invoices/new?type=receipt' },
    ],
    sections: [
      {
        title: 'Documents',
        items: [
          { path: '/invoices', label: 'All Documents', icon: ListChecks, exact: true },
          { path: '/invoices?type=invoice', label: 'Invoices', icon: FileSpreadsheet },
          { path: '/invoices?type=quote', label: 'Quotes / Estimates', icon: FilePen },
          { path: '/invoices?type=receipt', label: 'Cash Receipts', icon: Banknote },
          { path: '/invoices?type=credit', label: 'Credit Notes', icon: StickyNote },
          { path: '/invoices?type=delivery', label: 'Delivery Notes', icon: Truck },
          { path: '/invoices?type=purchase', label: 'Purchase Orders', icon: ShoppingCart },
        ]
      }
    ]
  },
  customers: {
    createNew: [
      { label: 'Add', icon: UserPlus, path: '/customers/new', active: true },
      { label: 'Import', icon: FileInput, path: '/customers/import' },
      { label: 'Email', icon: Mail, path: '/customers/email' },
    ],
    sections: [
      {
        title: 'Customers',
        items: [
          { path: '/customers', label: 'All Customers', icon: BookUser, exact: true },
          { path: '/customers?filter=favorites', label: 'Favorites', icon: Star },
          { path: '/customers?filter=recent', label: 'Recently Active', icon: Clock },
          { path: '/customers?filter=inactive', label: 'Inactive', icon: UserX },
        ]
      }
    ]
  },
  reports: {
    sections: [
      {
        title: 'Reports',
        items: [
          { path: '/reports', label: 'Overview', icon: BarChart3, exact: true },
        ]
      }
    ]
  },
  settings: {
    sections: [
      {
        title: 'Settings',
        items: [
          { path: '/settings', label: 'Business Settings', icon: Settings, exact: true },
          { path: '/templates', label: 'Invoice Templates', icon: Palette },
        ]
      }
    ]
  },
  newInvoice: {
    sections: [
      {
        title: 'Create',
        items: [
          { path: '/invoices/new', label: 'Invoice', icon: FileText, exact: true },
          { path: '/invoices/new?type=estimate', label: 'Estimate', icon: FilePen },
          { path: '/invoices/new?type=credit', label: 'Credit Note', icon: StickyNote },
        ]
      }
    ]
  }
}

/**
 * Given a pathname, determine which header tab key is active.
 */
export function getActiveTabKey(pathname) {
  if (pathname.startsWith('/reports')) return 'reports'
  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname.startsWith('/settings') || pathname.startsWith('/templates')) return 'settings'
  if (pathname === '/invoices/new') return 'newInvoice'
  // Default: documents covers /home, /invoices, and everything else
  return 'documents'
}
