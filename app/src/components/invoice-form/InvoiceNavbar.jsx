import { FileText, Users, PieChart, UserPlus, Plus, X } from 'lucide-react'

/**
 * NavItem — A single navigation button in the top bar.
 */
function NavItem({ icon: Icon, label, active = false, onClose }) {
  if (active) {
    return (
      <button className="px-4 py-2 text-sm font-medium text-primary bg-blue-50 border border-blue-100 rounded-md transition-colors flex items-center gap-2 shadow-sm">
        <Icon className="w-4 h-4" />
        {label}
        {onClose && (
          <X
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="w-3 h-3 ml-1 opacity-50 hover:opacity-100 cursor-pointer"
          />
        )}
      </button>
    )
  }

  return (
    <button className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-md transition-colors flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      {label}
    </button>
  )
}

/**
 * InvoiceNavbar — Top navigation bar with logo, nav items, and active tab.
 */
export default function InvoiceNavbar({ brandName = 'Invoice Baba' }) {
  return (
    <nav className="bg-bgSecondary border-b border-border h-14 flex items-center px-6 shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 mr-8">
        <img
          src="/assets/brand/icon-transparent.png"
          alt="Invoice Baba"
          className="w-9 h-9"
        />
        <span className="font-bold text-xl text-textPrimary tracking-tight">{brandName}</span>
      </div>

      {/* Nav Items */}
      <div className="flex items-center space-x-1">
        <NavItem icon={FileText} label="My Documents" />
        <NavItem icon={Users} label="My Customers" />
        <NavItem icon={PieChart} label="My Reports" />
        <div className="h-6 w-px bg-border mx-2" />
        <NavItem icon={UserPlus} label="New Customer" />
        <NavItem icon={Plus} label="New Invoice" active onClose={() => {}} />
      </div>
    </nav>
  )
}
