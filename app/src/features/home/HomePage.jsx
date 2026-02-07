import { useHistory } from 'react-router-dom'
import { FileText, Clock, IndianRupee, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { businessApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

function StatCard({ icon: Icon, value, label, iconColorClass = 'text-primary', valueColorClass = '' }) {
  return (
    <div className="bg-bgSecondary rounded-xl border border-border p-6 shadow-card text-center hover:shadow-soft transition-shadow">
      <Icon className={`w-7 h-7 mx-auto mb-3 ${iconColorClass}`} />
      <div className={`text-2xl font-bold ${valueColorClass || 'text-textPrimary'}`}>{value}</div>
      <p className="text-xs text-textSecondary mt-1">{label}</p>
    </div>
  )
}

export default function HomePage() {
  const history = useHistory()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['business', 'stats'],
    queryFn: async () => {
      const response = await businessApi.getStats()
      return response.data.data || response.data
    }
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Dashboard"
        actions={
          <button
            onClick={() => history.push('/invoices/new')}
            className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        }
      />

      {/* Stats Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={FileText}
            value={stats?.totalInvoices || 0}
            label="Total Invoices"
            iconColorClass="text-primary"
          />
          <StatCard
            icon={Clock}
            value={stats?.draftCount || 0}
            label="Drafts"
            iconColorClass="text-textSecondary"
          />
          <StatCard
            icon={IndianRupee}
            value={formatCurrency(stats?.paidAmount)}
            label={`Paid (${stats?.paidCount || 0})`}
            iconColorClass="text-green-500"
            valueColorClass="text-green-600"
          />
          <StatCard
            icon={IndianRupee}
            value={formatCurrency(stats?.unpaidAmount)}
            label={`Unpaid (${stats?.unpaidCount || 0})`}
            iconColorClass="text-yellow-500"
            valueColorClass="text-yellow-600"
          />
        </div>
      )}

      {/* Quick Links */}
      <button
        onClick={() => history.push('/invoices')}
        className="w-full py-3 border border-border bg-bgSecondary hover:bg-bgPrimary rounded-xl text-sm font-medium text-textSecondary hover:text-textPrimary transition-all flex items-center justify-center gap-2"
      >
        View All Invoices
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
