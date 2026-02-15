import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown, ChevronRight, Loader2, FileSpreadsheet, Printer, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react'
import { reportsApi } from '../../lib/api'
import { saveAs } from '../../lib/nativeFile.js'

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

function getCurrentFY() {
  const now = new Date()
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

function getMonthLabel(monthKey) {
  if (!monthKey) return ''
  const [y, m] = monthKey.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        {open ? <ChevronDown className="w-4 h-4 text-textSecondary" /> : <ChevronRight className="w-4 h-4 text-textSecondary" />}
        <span className="text-sm font-semibold text-textPrimary">{title}</span>
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  )
}

// ── Revenue Summary Cards ─────────────────────────────

function RevenueSummary({ revenue }) {
  if (!revenue) return null
  const cards = [
    { label: 'Gross Sales', value: revenue.grossSales, color: 'text-textPrimary' },
    { label: 'Discount', value: revenue.totalDiscount, color: 'text-orange-600', prefix: '-' },
    { label: 'Net Sales', value: revenue.netSales, color: 'text-blue-600' },
    { label: 'GST Collected', value: revenue.gstCollected, color: 'text-purple-600' },
    { label: 'Total Invoiced', value: revenue.totalInvoiced, color: 'text-primary', bold: true },
    { label: 'Paid', value: revenue.totalPaid, color: 'text-green-600' },
    { label: 'Outstanding', value: revenue.outstanding, color: 'text-orange-600' },
    { label: 'Cancelled', value: revenue.cancelledValue, color: 'text-red-500', sub: `${revenue.cancelledCount} invoices` },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-border rounded-lg p-3">
          <p className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">{c.label}</p>
          <p className={`text-lg font-bold mt-0.5 ${c.color} ${c.bold ? '' : ''}`}>
            {c.prefix || ''}₹{formatCurrency(c.value)}
          </p>
          {c.sub && <p className="text-[10px] text-textSecondary">{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}

// ── Month-wise Table ──────────────────────────────────

function MonthWiseTable({ data }) {
  if (!data?.length) return <p className="text-sm text-textSecondary py-2">No monthly data.</p>
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[700px]">
        <thead className="bg-gray-50 text-[10px] font-semibold text-textSecondary uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left">Month</th>
            <th className="px-3 py-2 text-center">Invoices</th>
            <th className="px-3 py-2 text-right">Gross Sales</th>
            <th className="px-3 py-2 text-right">Discount</th>
            <th className="px-3 py-2 text-right">Net Sales</th>
            <th className="px-3 py-2 text-right">Tax</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borderLight text-sm">
          {data.map((m, i) => (
            <tr key={i} className={m.invoiceCount === 0 ? 'text-textSecondary/50' : ''}>
              <td className="px-3 py-2 font-medium">{getMonthLabel(m.month)}</td>
              <td className="px-3 py-2 text-center">{m.invoiceCount}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(m.grossSales)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(m.discount)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(m.netSales)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(m.tax)}</td>
              <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(m.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── GSTR-9 Summary ────────────────────────────────────

function GSTR9Summary({ data, isLoading }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data) return null

  const t4Rows = [
    { label: '(a) B2B — Supplies to registered persons', ...data.table4.a_b2b },
    { label: '(b) B2C — Supplies to unregistered persons', ...data.table4.b_b2c },
    { label: '(c) Zero-rated supplies', ...data.table4.c_zeroRated },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-textSecondary">
        <span className="font-medium">{data.business?.name}</span>
        <span>|</span>
        <span>GSTIN: {data.business?.gstin || 'N/A'}</span>
        <span>|</span>
        <span>{data.invoiceCount} invoices</span>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Table 4 — Outward Supplies</h4>
        <div className="overflow-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Nature of Supply</th>
                <th className="px-3 py-2 text-right">Taxable Value</th>
                <th className="px-3 py-2 text-right">IGST</th>
                <th className="px-3 py-2 text-right">CGST</th>
                <th className="px-3 py-2 text-right">SGST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight text-sm">
              {t4Rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium">{r.label}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.taxableValue)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.igst)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.cgst)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sgst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.table5.creditNotes.count > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Table 5 — Amendments (Credit Notes)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-red-600 uppercase">Count</p>
              <p className="text-lg font-bold text-textPrimary mt-0.5">{data.table5.creditNotes.count}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-red-600 uppercase">Taxable Value</p>
              <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table5.creditNotes.taxableValue)}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Table 9 — Tax Payable (Annual)</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-blue-600 uppercase">IGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table9.igst)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-green-600 uppercase">CGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table9.cgst)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-green-600 uppercase">SGST/UTGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table9.sgst)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Export helpers ─────────────────────────────────────

function exportAnnualCSV(data) {
  const lines = [
    'Annual Sales Summary',
    `Financial Year,FY ${data.fy}`,
    '',
    'Revenue Summary',
    `Gross Sales,${data.revenue.grossSales.toFixed(2)}`,
    `Total Discount,${data.revenue.totalDiscount.toFixed(2)}`,
    `Net Sales,${data.revenue.netSales.toFixed(2)}`,
    `GST Collected,${data.revenue.gstCollected.toFixed(2)}`,
    `Total Invoiced,${data.revenue.totalInvoiced.toFixed(2)}`,
    `Total Paid,${data.revenue.totalPaid.toFixed(2)}`,
    `Outstanding,${data.revenue.outstanding.toFixed(2)}`,
    '',
    'Month-wise Breakup',
    'Month,Invoices,Gross Sales,Discount,Net Sales,Tax,Total',
    ...data.monthWise.map(m => `${getMonthLabel(m.month)},${m.invoiceCount},${m.grossSales.toFixed(2)},${m.discount.toFixed(2)},${m.netSales.toFixed(2)},${m.tax.toFixed(2)},${m.total.toFixed(2)}`),
    '',
    'Tax Rate Breakup',
    'Rate %,Invoices,Taxable Value,Tax Amount',
    ...data.taxRateBreakup.map(r => `${r.taxRate}%,${r.count},${r.taxableValue.toFixed(2)},${r.taxAmount.toFixed(2)}`),
    '',
    'B2B vs B2C',
    `B2B,${data.b2bVsB2c.b2b.count},${data.b2bVsB2c.b2b.value.toFixed(2)}`,
    `B2C,${data.b2bVsB2c.b2c.count},${data.b2bVsB2c.b2c.value.toFixed(2)}`,
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `AnnualSummary_FY${data.fy}.csv`)
}

// ── Main Component ────────────────────────────────────

export default function AnnualTab({ documentType }) {
  const [fy, setFY] = useState(getCurrentFY())

  const fyOptions = useMemo(() => {
    const opts = []
    const now = new Date()
    const currentStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    for (let i = 0; i < 5; i++) {
      const sy = currentStartYear - i
      opts.push({ value: `${sy}-${String((sy + 1) % 100).padStart(2, '0')}`, label: `FY ${sy}-${String((sy + 1) % 100).padStart(2, '0')}` })
    }
    return opts
  }, [])

  const { data: annualData, isLoading: annualLoading } = useQuery({
    queryKey: ['reports', 'annual-summary', fy, documentType],
    queryFn: async () => {
      const params = { fy }
      if (documentType) params.documentType = documentType
      const res = await reportsApi.getAnnualSummary(params.fy, params)
      return res.data.data || res.data
    },
    enabled: !!fy && !!documentType
  })

  const { data: gstr9Data, isLoading: gstr9Loading } = useQuery({
    queryKey: ['reports', 'gstr9', fy, documentType],
    queryFn: async () => {
      const params = { fy }
      if (documentType) params.documentType = documentType
      const res = await reportsApi.getGSTR9Data(params.fy, params)
      return res.data.data || res.data
    },
    enabled: !!fy && !!documentType
  })

  return (
    <div className="flex flex-col gap-4">
      {/* FY Selector */}
      <div className="bg-white border border-border rounded-xl px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <label className="block text-xs font-medium text-textSecondary mb-1 ml-0.5">Financial Year</label>
            <div className="relative">
              <select value={fy} onChange={e => setFY(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary appearance-none cursor-pointer bg-white">
                {fyOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {annualData && (
            <div className="text-xs text-textSecondary">
              <span className="font-medium">{annualData.totalInvoiceCount} invoices</span> in FY {fy}
            </div>
          )}
          {annualData && (
            <button onClick={() => exportAnnualCSV(annualData)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors ml-auto">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {annualLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : annualData ? (
        <>
          {/* Revenue Summary */}
          <RevenueSummary revenue={annualData.revenue} />

          {/* B2B vs B2C */}
          {(annualData.b2bVsB2c.b2b.count > 0 || annualData.b2bVsB2c.b2c.count > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-blue-600 uppercase">B2B (Registered)</p>
                  <p className="text-lg font-bold text-textPrimary">₹{formatCurrency(annualData.b2bVsB2c.b2b.value)}</p>
                  <p className="text-[10px] text-textSecondary">{annualData.b2bVsB2c.b2b.count} invoices</p>
                </div>
              </div>
              <div className="bg-white border border-border rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-orange-600 uppercase">B2C (Unregistered)</p>
                  <p className="text-lg font-bold text-textPrimary">₹{formatCurrency(annualData.b2bVsB2c.b2c.value)}</p>
                  <p className="text-[10px] text-textSecondary">{annualData.b2bVsB2c.b2c.count} invoices</p>
                </div>
              </div>
            </div>
          )}

          {/* Month-wise Breakup */}
          <CollapsibleSection title="Month-wise Breakup" defaultOpen={true}>
            <MonthWiseTable data={annualData.monthWise} />
          </CollapsibleSection>

          {/* Tax Rate Breakup */}
          {annualData.taxRateBreakup?.length > 0 && (
            <CollapsibleSection title="Tax Rate Breakup">
              <div className="overflow-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50 text-[10px] font-semibold text-textSecondary uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 text-left">Rate</th>
                      <th className="px-3 py-2 text-center">Invoices</th>
                      <th className="px-3 py-2 text-right">Taxable Value</th>
                      <th className="px-3 py-2 text-right">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight text-sm">
                    {annualData.taxRateBreakup.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium">{r.taxRate}%</td>
                        <td className="px-3 py-2 text-center">{r.count}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.taxableValue)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.taxAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}

          {/* Document Type Breakup */}
          {annualData.docTypeBreakup?.length > 0 && (
            <CollapsibleSection title="Document Type Breakup">
              <div className="overflow-auto">
                <table className="w-full min-w-[300px]">
                  <thead className="bg-gray-50 text-[10px] font-semibold text-textSecondary uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 text-left">Document Type</th>
                      <th className="px-3 py-2 text-center">Count</th>
                      <th className="px-3 py-2 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight text-sm">
                    {annualData.docTypeBreakup.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium capitalize">{r.documentType.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2 text-center">{r.count}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}

          {/* GSTR-9 */}
          <CollapsibleSection title="GSTR-9 — Annual Return (Outward Supplies)">
            <GSTR9Summary data={gstr9Data} isLoading={gstr9Loading} />
          </CollapsibleSection>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-textSecondary">
          <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium">Select a financial year to view the annual summary</p>
        </div>
      )}
    </div>
  )
}
