import { useState, useMemo } from 'react'
import {
  FileText, BarChart3, Users, Receipt, CalendarRange, Download, Loader2, ChevronDown, X
} from 'lucide-react'
import { reportsApi } from '../../lib/api'
import { saveAs } from '../../lib/nativeFile.js'
import SalesRegisterTab from './SalesRegisterTab'
import GSTReturnsTab from './GSTReturnsTab'
import DocumentsTab from './DocumentsTab'
import CustomersTab from './CustomersTab'
import AnnualTab from './AnnualTab'

const TABS = [
  { key: 'sales', label: 'Sales Register', icon: Receipt },
  { key: 'gst', label: 'GST Returns', icon: BarChart3 },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'annual', label: 'Annual / FY', icon: CalendarRange },
]

// ── CA Package helpers ───────────────────────────────────

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatCSVSection(title, headers, rows) {
  return [title, headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

function buildCAPackageCSV(data) {
  const sections = []
  const fc = (v) => (v || 0).toFixed(2)

  // Header
  sections.push(`CA Package — ${data.month}`)
  sections.push(`Generated: ${new Date(data.generatedAt).toLocaleString('en-IN')}`)
  sections.push('')

  // GSTR-3B
  const g3 = data.gstr3b
  if (g3) {
    sections.push('=== GSTR-3B Summary ===')
    sections.push(`Total Invoices,${g3.invoiceCount}`)
    sections.push(`Taxable Value,${fc(g3.table3_1?.taxableValue)}`)
    sections.push(`IGST,${fc(g3.table3_1?.igst)}`)
    sections.push(`CGST,${fc(g3.table3_1?.cgst)}`)
    sections.push(`SGST,${fc(g3.table3_1?.sgst)}`)
    sections.push(`Total Tax,${fc(g3.table5_1?.totalTax)}`)
    sections.push('')
  }

  // B2B
  const b2b = data.gstr1?.b2b
  if (b2b?.rows?.length) {
    sections.push(formatCSVSection(
      '=== GSTR-1 Table 4A — B2B Invoices ===',
      ['GSTIN','Receiver','Invoice #','Date','Value','Place of Supply','Rate','Taxable','IGST','CGST','SGST'],
      b2b.rows.map(r => [`"${r.gstinOfRecipient}"`,`"${r.receiverName}"`,r.invoiceNumber,r.invoiceDate,fc(r.invoiceValue),`"${r.placeOfSupply}"`,r.rate,fc(r.taxableValue),fc(r.igstAmount),fc(r.cgstAmount),fc(r.sgstAmount)])
    ))
    sections.push('')
  }

  // B2C Large
  const b2cl = data.gstr1?.b2cLarge
  if (b2cl?.rows?.length) {
    sections.push(formatCSVSection(
      '=== GSTR-1 Table 5A — B2C Large ===',
      ['Place of Supply','Rate','Taxable Value','IGST'],
      b2cl.rows.map(r => [`"${r.placeOfSupply}"`,r.rate,fc(r.taxableValue),fc(r.igstAmount)])
    ))
    sections.push('')
  }

  // B2C Small
  const b2cs = data.gstr1?.b2cSmall
  if (b2cs?.rows?.length) {
    sections.push(formatCSVSection(
      '=== GSTR-1 Table 7 — B2C Small ===',
      ['Place of Supply','Rate','Taxable Value','IGST','CGST','SGST'],
      b2cs.rows.map(r => [`"${r.placeOfSupply}"`,r.rate,fc(r.taxableValue),fc(r.igstAmount),fc(r.cgstAmount),fc(r.sgstAmount)])
    ))
    sections.push('')
  }

  // Credit Notes
  const cn = data.gstr1?.creditNotes
  if (cn?.rows?.length) {
    sections.push(formatCSVSection(
      '=== GSTR-1 Table 9B — Credit/Debit Notes ===',
      ['GSTIN','Receiver','Note #','Type','Value','Rate','Taxable','IGST','CGST','SGST'],
      cn.rows.map(r => [`"${r.gstinOfRecipient}"`,`"${r.receiverName}"`,r.noteNumber,r.noteType,fc(r.noteValue),r.rate,fc(r.taxableValue),fc(r.igstAmount),fc(r.cgstAmount),fc(r.sgstAmount)])
    ))
    sections.push('')
  }

  // HSN Summary
  const hsn = data.gstr1?.hsnSummary
  if (hsn?.rows?.length) {
    sections.push(formatCSVSection(
      '=== GSTR-1 Table 12 — HSN Summary ===',
      ['HSN','Description','UQC','Qty','Rate','Taxable Value','IGST','CGST','SGST'],
      hsn.rows.map(r => [r.hsnCode,`"${r.description}"`,r.uqc,r.totalQuantity.toFixed(2),r.rate,fc(r.taxableValue),fc(r.igstAmount),fc(r.cgstAmount),fc(r.sgstAmount)])
    ))
    sections.push('')
  }

  // Doc Summary
  const doc = data.gstr1?.docSummary
  if (doc?.rows?.length) {
    sections.push(formatCSVSection(
      '=== GSTR-1 Table 13 — Document Summary ===',
      ['Nature','From','To','Total','Cancelled','Net Issued'],
      doc.rows.map(r => [`"${r.natureOfDocument}"`,r.srNoFrom,r.srNoTo,r.totalNumber,r.cancelled,r.netIssued])
    ))
    sections.push('')
  }

  // Sales Register
  const sr = data.salesRegister
  if (sr?.rows?.length) {
    sections.push(formatCSVSection(
      '=== Sales Register ===',
      ['Date','Invoice #','Customer','GSTIN','Subtotal','Discount','Tax','Total','Status'],
      sr.rows.map(r => [r.date,r.invoiceNumber,`"${r.customerName || ''}"`,r.gstin || '',fc(r.subtotal),fc(r.discount),fc(r.taxTotal),fc(r.total),r.status])
    ))
  }

  return sections.join('\n')
}

// ── Main Component ───────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')
  const [showCAModal, setShowCAModal] = useState(false)
  const [caMonth, setCAMonth] = useState(getCurrentMonth())
  const [caLoading, setCALoading] = useState(false)

  const monthOptions = useMemo(() => {
    const opts = []
    const now = new Date()
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      opts.push({ value: val, label })
    }
    return opts
  }, [])

  const handleDownloadCA = async () => {
    setCALoading(true)
    try {
      const res = await reportsApi.getCAPackage(caMonth)
      const data = res.data.data || res.data
      const csv = buildCAPackageCSV(data)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `CA_Package_${caMonth}.csv`)
      setShowCAModal(false)
    } catch (err) {
      console.error('CA Package download failed:', err)
    } finally {
      setCALoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bgPrimary p-3 md:p-6 pb-mobile-nav">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-textPrimary">Reports</h1>
          <button
            onClick={() => setShowCAModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CA Package
          </button>
        </div>

        {/* CA Package Modal */}
        {showCAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !caLoading && setShowCAModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-textPrimary">Download CA Package</h3>
                <button onClick={() => !caLoading && setShowCAModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-textSecondary" />
                </button>
              </div>
              <p className="text-xs text-textSecondary mb-3">Combined GSTR-3B, GSTR-1 (all tables), and Sales Register in a single CSV file for your accountant.</p>
              <div className="mb-4">
                <label className="block text-xs font-medium text-textSecondary mb-1">Month</label>
                <div className="relative">
                  <select value={caMonth} onChange={e => setCAMonth(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-sm border border-border rounded-lg appearance-none cursor-pointer bg-white">
                    {monthOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button
                onClick={handleDownloadCA}
                disabled={caLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {caLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {caLoading ? 'Generating...' : 'Download CSV'}
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white border border-border rounded-xl p-1 shadow-sm">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 shrink-0 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textSecondary active:bg-gray-100 md:hover:bg-gray-100 active:text-textPrimary md:hover:text-textPrimary'
                }`}
              >
                <Icon className="w-4 h-4 hidden md:block" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'sales' && <SalesRegisterTab />}
        {activeTab === 'gst' && <GSTReturnsTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'annual' && <AnnualTab />}
      </div>
    </div>
  )
}
