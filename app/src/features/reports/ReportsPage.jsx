import { useState } from 'react'
import { Receipt, IndianRupee, TrendingUp, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

const tabs = [
  { key: 'summary', label: 'Summary' },
  { key: 'gst', label: 'GST' },
  { key: 'trend', label: 'Trend' }
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [dateRange] = useState({
    from: getFirstDayOfMonth(),
    to: new Date().toISOString().split('T')[0]
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary', dateRange],
    queryFn: async () => {
      const response = await reportsApi.getSummary({ dateFrom: dateRange.from, dateTo: dateRange.to })
      return response.data.data || response.data
    },
    enabled: activeTab === 'summary'
  })

  const { data: gstSummary, isLoading: gstLoading } = useQuery({
    queryKey: ['reports', 'gst', dateRange],
    queryFn: async () => {
      const response = await reportsApi.getGSTSummary({ dateFrom: dateRange.from, dateTo: dateRange.to })
      return response.data.data || response.data
    },
    enabled: activeTab === 'gst'
  })

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['reports', 'trend'],
    queryFn: async () => {
      const response = await reportsApi.getMonthlyTrend(6)
      return response.data.data || response.data
    },
    enabled: activeTab === 'trend'
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)
  }

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Reports" />

      {/* Tabs */}
      <div className="flex gap-1 bg-bgSecondary p-1 rounded-lg border border-border shadow-card mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        summaryLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 text-center">
                <Receipt className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-textPrimary">{summary?.totals?.invoiceCount || 0}</div>
                <p className="text-xs text-textSecondary mt-1">Invoices</p>
              </div>
              <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 text-center">
                <IndianRupee className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-green-600">{formatCurrency(summary?.totals?.total)}</div>
                <p className="text-xs text-textSecondary mt-1">Total Revenue</p>
              </div>
            </div>

            <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-6 py-3 border-b border-border"><h3 className="text-sm font-semibold text-textPrimary">Breakdown</h3></div>
              <div className="divide-y divide-border">
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-textSecondary">Subtotal</span><span className="text-textPrimary">{formatCurrency(summary?.totals?.subtotal)}</span></div>
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-textSecondary">Discounts</span><span className="text-red-500">-{formatCurrency(summary?.totals?.discountTotal)}</span></div>
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-textSecondary">Tax Collected</span><span className="text-textPrimary">{formatCurrency(summary?.totals?.taxTotal)}</span></div>
              </div>
            </div>

            <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-6 py-3 border-b border-border"><h3 className="text-sm font-semibold text-textPrimary">By Status</h3></div>
              <div className="divide-y divide-border">
                {summary?.byStatus?.map((item) => (
                  <div key={item.status} className="px-6 py-3 flex justify-between items-center">
                    <div><div className="text-sm font-medium text-textPrimary">{item.status}</div><div className="text-xs text-textSecondary">{item.count} invoices</div></div>
                    <span className="text-sm font-semibold text-textPrimary">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* GST Tab */}
      {activeTab === 'gst' && (
        gstLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 text-center">
                <p className="text-xs text-textSecondary mb-1">Taxable Value</p>
                <div className="text-xl font-bold text-textPrimary">{formatCurrency(gstSummary?.summary?.totalTaxableValue)}</div>
              </div>
              <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 text-center">
                <p className="text-xs text-textSecondary mb-1">Total GST</p>
                <div className="text-xl font-bold text-primary">{formatCurrency(gstSummary?.summary?.totalGST)}</div>
              </div>
            </div>

            <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-6 py-3 border-b border-border"><h3 className="text-sm font-semibold text-textPrimary">GST Breakup</h3></div>
              <div className="divide-y divide-border">
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-textSecondary">CGST</span><span className="text-textPrimary">{formatCurrency(gstSummary?.summary?.breakdown?.cgst)}</span></div>
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-textSecondary">SGST</span><span className="text-textPrimary">{formatCurrency(gstSummary?.summary?.breakdown?.sgst)}</span></div>
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-textSecondary">IGST</span><span className="text-textPrimary">{formatCurrency(gstSummary?.summary?.breakdown?.igst)}</span></div>
              </div>
            </div>

            {gstSummary?.byTaxRate?.length > 0 && (
              <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-border"><h3 className="text-sm font-semibold text-textPrimary">By Tax Rate</h3></div>
                <div className="divide-y divide-border">
                  {gstSummary.byTaxRate.map((item) => (
                    <div key={item.taxRate} className="px-6 py-3 flex justify-between items-center">
                      <div><div className="text-sm font-medium text-textPrimary">{item.taxRate}% GST</div><div className="text-xs text-textSecondary">{item.count} invoices · Taxable: {formatCurrency(item.taxableValue)}</div></div>
                      <span className="text-sm font-semibold text-textPrimary">{formatCurrency(item.taxAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Trend Tab */}
      {activeTab === 'trend' && (
        trendLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : (
          <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-3 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-textSecondary" />
              <h3 className="text-sm font-semibold text-textPrimary">Last 6 Months</h3>
            </div>
            <div className="divide-y divide-border">
              {trend?.map((item) => (
                <div key={item.month} className="px-6 py-4 flex justify-between items-center">
                  <div><div className="text-sm font-medium text-textPrimary">{formatMonth(item.month)}</div><div className="text-xs text-textSecondary">{item.invoiceCount} invoices</div></div>
                  <div className="text-right"><div className="text-sm font-semibold text-textPrimary">{formatCurrency(item.totalAmount)}</div><div className="text-xs text-green-600">Paid: {formatCurrency(item.paidAmount)}</div></div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}

function getFirstDayOfMonth() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split('T')[0]
}
