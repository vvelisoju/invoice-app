import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown, ChevronRight, Loader2, FileSpreadsheet, Printer, FileText, Download
} from 'lucide-react'
import { reportsApi } from '../../lib/api'
import { getStateName } from '../../config/indianStates'
import { saveAs } from '../../lib/nativeFile.js'
import { openPrintWindow } from '../../lib/nativeBrowser.js'

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(month) {
  if (!month) return ''
  const [y, m] = month.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

// ── CSV Export helpers ────────────────────────────────

function exportGSTR3BToCSV(data) {
  const t = data.table3_1
  const lines = [
    'GSTR-3B Summary',
    `Period,${getMonthLabel(data.period?.month)}`,
    `Business,${data.business?.name || ''}`,
    `GSTIN,${data.business?.gstin || ''}`,
    '',
    'Table 3.1 - Outward Supplies',
    'Nature of Supply,Taxable Value,IGST,CGST,SGST/UTGST,Cess',
    `(a) Outward taxable supplies,${t.a_taxable.taxableValue.toFixed(2)},${t.a_taxable.igst.toFixed(2)},${t.a_taxable.cgst.toFixed(2)},${t.a_taxable.sgst.toFixed(2)},0.00`,
    `(b) Zero-rated supplies,${t.b_zeroRated.taxableValue.toFixed(2)},${t.b_zeroRated.igst.toFixed(2)},${t.b_zeroRated.cgst.toFixed(2)},${t.b_zeroRated.sgst.toFixed(2)},0.00`,
    `(c) Nil-rated / Exempt,${t.c_nilExempt.taxableValue.toFixed(2)},0.00,0.00,0.00,0.00`,
    `(e) Non-GST supplies,${t.e_nonGst.taxableValue.toFixed(2)},0.00,0.00,0.00,0.00`,
    '',
    'Table 3.2 - Interstate supplies to unregistered persons',
    `Taxable Value,${data.table3_2.taxableValue.toFixed(2)}`,
    `IGST,${data.table3_2.igst.toFixed(2)}`,
    '',
    'Table 5.1 - Tax Payable',
    `IGST,${data.table5_1.igst.toFixed(2)}`,
    `CGST,${data.table5_1.cgst.toFixed(2)}`,
    `SGST/UTGST,${data.table5_1.sgst.toFixed(2)}`,
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `GSTR3B_${data.period?.month || 'report'}.csv`)
}

function exportB2BToCSV(data) {
  const headers = ['GSTIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place of Supply', 'Reverse Charge', 'Invoice Type', 'Rate', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'Cess Amount']
  const csvRows = data.rows.map(r => [
    r.gstinOfRecipient,
    `"${(r.receiverName || '').replace(/"/g, '""')}"`,
    r.invoiceNumber,
    formatDate(r.invoiceDate),
    r.invoiceValue.toFixed(2),
    `"${r.placeOfSupply}"`,
    r.reverseCharge,
    r.invoiceType,
    r.rate,
    r.taxableValue.toFixed(2),
    r.igstAmount.toFixed(2),
    r.cgstAmount.toFixed(2),
    r.sgstAmount.toFixed(2),
    r.cessAmount.toFixed(2),
  ])
  const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `GSTR1_B2B_Table4A_${data.period?.month || 'report'}.csv`)
}

// ── Print helper ──────────────────────────────────────

function printGSTR3B(data) {
  const t = data.table3_1
  const html = `<!DOCTYPE html><html><head><title>GSTR-3B Summary</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1f2937;font-size:13px}
      h2{margin:0 0 2px;font-size:18px} h3{margin:16px 0 6px;font-size:14px;color:#374151}
      p.sub{color:#6b7280;font-size:11px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      th{background:#f0f4ff;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#4b5563;border-bottom:2px solid #d1d5db}
      td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:12px}
      .right{text-align:right} .bold{font-weight:700}
      @page{size:A4;margin:15mm} @media print{body{padding:0}}
    </style></head><body>
    <h2>GSTR-3B Summary</h2>
    <p class="sub">${data.business?.name || ''} | GSTIN: ${data.business?.gstin || 'N/A'} | Period: ${getMonthLabel(data.period?.month)}</p>
    <h3>Table 3.1 — Outward Supplies & Tax Liability</h3>
    <table>
      <thead><tr><th>Nature of Supply</th><th class="right">Taxable Value</th><th class="right">IGST</th><th class="right">CGST</th><th class="right">SGST/UTGST</th><th class="right">Cess</th></tr></thead>
      <tbody>
        <tr><td>(a) Outward taxable supplies</td><td class="right">${formatCurrency(t.a_taxable.taxableValue)}</td><td class="right">${formatCurrency(t.a_taxable.igst)}</td><td class="right">${formatCurrency(t.a_taxable.cgst)}</td><td class="right">${formatCurrency(t.a_taxable.sgst)}</td><td class="right">0.00</td></tr>
        <tr><td>(b) Zero-rated supplies</td><td class="right">${formatCurrency(t.b_zeroRated.taxableValue)}</td><td class="right">${formatCurrency(t.b_zeroRated.igst)}</td><td class="right">0.00</td><td class="right">0.00</td><td class="right">0.00</td></tr>
        <tr><td>(c) Nil-rated / Exempt</td><td class="right">${formatCurrency(t.c_nilExempt.taxableValue)}</td><td class="right">0.00</td><td class="right">0.00</td><td class="right">0.00</td><td class="right">0.00</td></tr>
        <tr><td>(e) Non-GST supplies</td><td class="right">${formatCurrency(t.e_nonGst.taxableValue)}</td><td class="right">0.00</td><td class="right">0.00</td><td class="right">0.00</td><td class="right">0.00</td></tr>
      </tbody>
    </table>
    <h3>Table 3.2 — Interstate Supplies to Unregistered Persons</h3>
    <table>
      <thead><tr><th class="right">Taxable Value</th><th class="right">IGST</th></tr></thead>
      <tbody><tr><td class="right">${formatCurrency(data.table3_2.taxableValue)}</td><td class="right">${formatCurrency(data.table3_2.igst)}</td></tr></tbody>
    </table>
    <h3>Table 5.1 — Tax Payable</h3>
    <table>
      <thead><tr><th>Tax</th><th class="right">Amount</th></tr></thead>
      <tbody>
        <tr><td>IGST</td><td class="right bold">${formatCurrency(data.table5_1.igst)}</td></tr>
        <tr><td>CGST</td><td class="right bold">${formatCurrency(data.table5_1.cgst)}</td></tr>
        <tr><td>SGST/UTGST</td><td class="right bold">${formatCurrency(data.table5_1.sgst)}</td></tr>
      </tbody>
    </table>
    </body></html>`
  openPrintWindow(html, { width: 900, height: 700, autoPrint: true })
}

// ── Collapsible Section ───────────────────────────────

function CollapsibleSection({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-textSecondary" /> : <ChevronRight className="w-4 h-4 text-textSecondary" />}
          <span className="text-sm font-semibold text-textPrimary">{title}</span>
        </div>
        {count !== undefined && (
          <span className="text-xs font-medium text-textSecondary bg-white border border-border px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'record' : 'records'}
          </span>
        )}
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  )
}

// ── GSTR-3B Card ──────────────────────────────────────

function GSTR3BCard({ data, isLoading }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data) return null

  const t = data.table3_1
  const rows3_1 = [
    { label: '(a) Outward taxable supplies', ...t.a_taxable },
    { label: '(b) Zero-rated supplies', ...t.b_zeroRated },
    { label: '(c) Nil-rated / Exempt', ...t.c_nilExempt },
    { label: '(e) Non-GST supplies', ...t.e_nonGst },
  ]

  return (
    <div className="space-y-4">
      {/* 3.1 */}
      <div>
        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Table 3.1 — Outward Supplies & Tax Liability</h4>
        <div className="overflow-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Nature of Supply</th>
                <th className="px-3 py-2 text-right">Taxable Value</th>
                <th className="px-3 py-2 text-right">IGST</th>
                <th className="px-3 py-2 text-right">CGST</th>
                <th className="px-3 py-2 text-right">SGST/UTGST</th>
                <th className="px-3 py-2 text-right">Cess</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight text-sm">
              {rows3_1.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-textPrimary font-medium">{r.label}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.taxableValue)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.igst)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.cgst)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sgst)}</td>
                  <td className="px-3 py-2 text-right font-mono text-textSecondary">0.00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.2 */}
      <div>
        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Table 3.2 — Interstate Supplies to Unregistered Persons</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-orange-600 uppercase">Taxable Value</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table3_2.taxableValue)}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-purple-600 uppercase">IGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table3_2.igst)}</p>
          </div>
        </div>
      </div>

      {/* 5.1 Tax Payable */}
      <div>
        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Table 5.1 — Tax Payable</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-blue-600 uppercase">IGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table5_1.igst)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-green-600 uppercase">CGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table5_1.cgst)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-green-600 uppercase">SGST/UTGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(data.table5_1.sgst)}</p>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => exportGSTR3BToCSV(data)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
        <button onClick={() => printGSTR3B(data)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>
    </div>
  )
}

// ── B2B Table ─────────────────────────────────────────

function B2BTable({ data, isLoading }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data || !data.rows?.length) return <p className="text-sm text-textSecondary py-4">No B2B invoices for this period.</p>

  return (
    <div className="space-y-3">
      <div className="overflow-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">GSTIN</th>
              <th className="px-3 py-2 text-left">Receiver Name</th>
              <th className="px-3 py-2 text-left">Invoice #</th>
              <th className="px-3 py-2 text-center">Date</th>
              <th className="px-3 py-2 text-right">Invoice Value</th>
              <th className="px-3 py-2 text-left">Place of Supply</th>
              <th className="px-3 py-2 text-center">RCM</th>
              <th className="px-3 py-2 text-center">Rate</th>
              <th className="px-3 py-2 text-right">Taxable Value</th>
              <th className="px-3 py-2 text-right">IGST</th>
              <th className="px-3 py-2 text-right">CGST</th>
              <th className="px-3 py-2 text-right">SGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight text-sm">
            {data.rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-mono text-xs">{r.gstinOfRecipient}</td>
                <td className="px-3 py-2 font-medium">{r.receiverName}</td>
                <td className="px-3 py-2">{r.invoiceNumber}</td>
                <td className="px-3 py-2 text-center text-textSecondary">{formatDate(r.invoiceDate)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.invoiceValue)}</td>
                <td className="px-3 py-2 text-xs text-textSecondary">{r.placeOfSupply}</td>
                <td className="px-3 py-2 text-center text-textSecondary">{r.reverseCharge}</td>
                <td className="px-3 py-2 text-center">{r.rate}%</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.taxableValue)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.igstAmount)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.cgstAmount)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sgstAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
            <tr>
              <td className="px-3 py-2 uppercase tracking-wider" colSpan={4}>Total ({data.totals.count})</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.invoiceValue)}</td>
              <td colSpan={3}></td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.taxableValue)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.igstAmount)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.cgstAmount)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.sgstAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => exportB2BToCSV(data)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
    </div>
  )
}

// ── Generic CSV Export ────────────────────────────────

function exportGenericCSV(rows, keys, filename) {
  const headers = keys.join(',')
  const csvRows = rows.map(r => keys.map(k => {
    const v = r[k]
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`
    if (typeof v === 'number') return v.toFixed(2)
    return v ?? ''
  }).join(','))
  const csv = [headers, ...csvRows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}.csv`)
}

// ── SimpleTable (reusable for B2C Large, B2C Small, Credit Notes) ──

function SimpleTable({ data, isLoading, emptyMsg, columns, totalsRow, totalsColumns, exportFn }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data || !data.rows?.length) return <p className="text-sm text-textSecondary py-4">{emptyMsg}</p>

  return (
    <div className="space-y-3">
      <div className="overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
            <tr>
              {columns.map(c => (
                <th key={c.key} className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight text-sm">
            {data.rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                {columns.map(c => (
                  <td key={c.key} className={`px-3 py-2 ${c.align === 'right' ? 'text-right font-mono' : c.align === 'center' ? 'text-center' : ''} ${c.mono ? 'font-mono text-xs' : ''}`}>
                    {c.currency ? formatCurrency(r[c.key]) : `${r[c.key] ?? ''}${c.suffix || ''}`}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {totalsRow && (
            <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
              <tr>
                {columns.map((c, ci) => (
                  <td key={c.key} className={`px-3 py-2 ${c.align === 'right' ? 'text-right font-mono' : ''}`}>
                    {ci === 0 ? `Total (${totalsRow.count ?? data.rows.length})` : totalsColumns?.includes(c.key) ? formatCurrency(totalsRow[c.key]) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {exportFn && (
        <div className="flex items-center gap-2">
          <button onClick={exportFn}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}
    </div>
  )
}

// ── Nil/Exempt Table (Table 8) ────────────────────────

function NilExemptTable({ data, isLoading }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data) return null

  const s = data.summary
  const tableRows = [
    { label: 'Registered — Interstate', ...s.registeredInter },
    { label: 'Registered — Intrastate', ...s.registeredIntra },
    { label: 'Unregistered — Interstate', ...s.unregisteredInter },
    { label: 'Unregistered — Intrastate', ...s.unregisteredIntra },
  ]

  const hasData = tableRows.some(r => r.nilRated > 0 || r.exempt > 0 || r.nonGst > 0)
  if (!hasData) return <p className="text-sm text-textSecondary py-4">No nil-rated, exempt, or non-GST supplies for this period.</p>

  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[500px]">
        <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-right">Nil Rated</th>
            <th className="px-3 py-2 text-right">Exempted</th>
            <th className="px-3 py-2 text-right">Non-GST</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borderLight text-sm">
          {tableRows.map((r, i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium">{r.label}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.nilRated)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.exempt)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.nonGst)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── HSN Summary Table (Table 12) ──────────────────────

function HSNSummaryTable({ data, isLoading, month }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data || !data.rows?.length) return (
    <div className="py-4 space-y-1">
      <p className="text-sm text-textSecondary">No HSN data for this period.</p>
      <p className="text-xs text-textSecondary/70">Add HSN/SAC codes to your line items when creating invoices to populate this table.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-textSecondary">
        <span>{data.totals.uniqueHSN} unique HSN codes</span>
        <span>•</span>
        <span>{data.totals.count} entries</span>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">HSN</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-center">UQC</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-center">Rate</th>
              <th className="px-3 py-2 text-right">Taxable Value</th>
              <th className="px-3 py-2 text-right">IGST</th>
              <th className="px-3 py-2 text-right">CGST</th>
              <th className="px-3 py-2 text-right">SGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight text-sm">
            {data.rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-mono text-xs font-medium">{r.hsnCode}</td>
                <td className="px-3 py-2 text-textSecondary truncate max-w-[200px]">{r.description}</td>
                <td className="px-3 py-2 text-center text-textSecondary">{r.uqc}</td>
                <td className="px-3 py-2 text-right font-mono">{r.totalQuantity.toFixed(2)}</td>
                <td className="px-3 py-2 text-center">{r.rate}%</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.taxableValue)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.igstAmount)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.cgstAmount)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sgstAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
            <tr>
              <td className="px-3 py-2 uppercase tracking-wider" colSpan={3}>Total</td>
              <td className="px-3 py-2 text-right font-mono">{data.totals.totalQuantity.toFixed(2)}</td>
              <td></td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.taxableValue)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.igstAmount)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.cgstAmount)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrency(data.totals.sgstAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => exportGenericCSV(data.rows, ['hsnCode','description','uqc','totalQuantity','rate','taxableValue','igstAmount','cgstAmount','sgstAmount'], `GSTR1_HSN_Table12_${month}`)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
    </div>
  )
}

// ── Document Summary Table (Table 13) ─────────────────

function DocSummaryTable({ data, isLoading }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!data || !data.rows?.length) return <p className="text-sm text-textSecondary py-4">No documents issued in this period.</p>

  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-blue-50 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left">Nature of Document</th>
            <th className="px-3 py-2 text-left">Sr. No. From</th>
            <th className="px-3 py-2 text-left">Sr. No. To</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">Cancelled</th>
            <th className="px-3 py-2 text-right">Net Issued</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borderLight text-sm">
          {data.rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-3 py-2 font-medium">{r.natureOfDocument}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.srNoFrom}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.srNoTo}</td>
              <td className="px-3 py-2 text-right">{r.totalNumber}</td>
              <td className="px-3 py-2 text-right text-red-600">{r.cancelled}</td>
              <td className="px-3 py-2 text-right font-semibold">{r.netIssued}</td>
            </tr>
          ))}
        </tbody>
        {data.grandTotal && (
          <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
            <tr>
              <td className="px-3 py-2 uppercase tracking-wider" colSpan={3}>Grand Total</td>
              <td className="px-3 py-2 text-right">{data.grandTotal.totalNumber}</td>
              <td className="px-3 py-2 text-right text-red-600">{data.grandTotal.cancelled}</td>
              <td className="px-3 py-2 text-right">{data.grandTotal.netIssued}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

// ── Main Component ────────────────────────────────────

export default function GSTReturnsTab() {
  const [month, setMonth] = useState(getCurrentMonth())

  // Build month options (last 18 months)
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

  const { data: gstr3bData, isLoading: gstr3bLoading } = useQuery({
    queryKey: ['reports', 'gstr3b', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR3B(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: b2bData, isLoading: b2bLoading } = useQuery({
    queryKey: ['reports', 'gstr1-b2b', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1B2B(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: b2clData, isLoading: b2clLoading } = useQuery({
    queryKey: ['reports', 'gstr1-b2c-large', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1B2CLarge(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: b2csData, isLoading: b2csLoading } = useQuery({
    queryKey: ['reports', 'gstr1-b2c-small', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1B2CSmall(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: nilData, isLoading: nilLoading } = useQuery({
    queryKey: ['reports', 'gstr1-nil-exempt', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1NilExempt(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: cnData, isLoading: cnLoading } = useQuery({
    queryKey: ['reports', 'gstr1-credit-notes', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1CreditNotes(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: docData, isLoading: docLoading } = useQuery({
    queryKey: ['reports', 'gstr1-doc-summary', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1DocSummary(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  const { data: hsnData, isLoading: hsnLoading } = useQuery({
    queryKey: ['reports', 'gstr1-hsn-summary', month],
    queryFn: async () => {
      const res = await reportsApi.getGSTR1HSNSummary(month)
      return res.data.data || res.data
    },
    enabled: !!month
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Period Selector */}
      <div className="bg-white border border-border rounded-xl px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="block text-xs font-medium text-textSecondary mb-1 ml-0.5">Tax Period</label>
            <div className="relative">
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary appearance-none cursor-pointer bg-white">
                {monthOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="text-xs text-textSecondary">
            {gstr3bData && <span className="font-medium">{gstr3bData.invoiceCount} invoices</span>}
            {gstr3bData && <span> in {getMonthLabel(month)}</span>}
          </div>
        </div>
      </div>

      {/* GSTR-3B Summary */}
      <CollapsibleSection title="GSTR-3B — Monthly Summary" defaultOpen={true}>
        <GSTR3BCard data={gstr3bData} isLoading={gstr3bLoading} />
      </CollapsibleSection>

      {/* GSTR-1 Sections */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-textPrimary px-1">GSTR-1 — Outward Supply Details</h3>

        <CollapsibleSection title="Table 4A — B2B Invoices" count={b2bData?.rows?.length}>
          <B2BTable data={b2bData} isLoading={b2bLoading} />
        </CollapsibleSection>

        <CollapsibleSection title="Table 5A — B2C Large (Interstate > ₹2.5L)" count={b2clData?.rows?.length}>
          <SimpleTable
            data={b2clData} isLoading={b2clLoading}
            emptyMsg="No B2C Large invoices for this period."
            columns={[
              { key: 'placeOfSupply', label: 'Place of Supply' },
              { key: 'rate', label: 'Rate', suffix: '%', align: 'center' },
              { key: 'taxableValue', label: 'Taxable Value', currency: true, align: 'right' },
              { key: 'igstAmount', label: 'IGST', currency: true, align: 'right' },
            ]}
            totalsRow={b2clData?.totals}
            totalsColumns={['taxableValue', 'igstAmount']}
            exportFn={() => exportGenericCSV(b2clData?.rows || [], ['placeOfSupply','rate','taxableValue','igstAmount'], `GSTR1_B2CLarge_Table5A_${month}`)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Table 7 — B2C Small" count={b2csData?.totals?.count}>
          <SimpleTable
            data={b2csData} isLoading={b2csLoading}
            emptyMsg="No B2C Small supplies for this period."
            columns={[
              { key: 'placeOfSupply', label: 'Place of Supply' },
              { key: 'rate', label: 'Rate', suffix: '%', align: 'center' },
              { key: 'taxableValue', label: 'Taxable Value', currency: true, align: 'right' },
              { key: 'igstAmount', label: 'IGST', currency: true, align: 'right' },
              { key: 'cgstAmount', label: 'CGST', currency: true, align: 'right' },
              { key: 'sgstAmount', label: 'SGST', currency: true, align: 'right' },
            ]}
            totalsRow={b2csData?.totals}
            totalsColumns={['taxableValue', 'igstAmount', 'cgstAmount', 'sgstAmount']}
            exportFn={() => exportGenericCSV(b2csData?.rows || [], ['placeOfSupply','rate','taxableValue','igstAmount','cgstAmount','sgstAmount'], `GSTR1_B2CSmall_Table7_${month}`)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Table 8 — Nil / Exempt Supplies" count={nilData?.invoiceCount}>
          <NilExemptTable data={nilData} isLoading={nilLoading} />
        </CollapsibleSection>

        <CollapsibleSection title="Table 9B — Credit / Debit Notes" count={cnData?.rows?.length}>
          <SimpleTable
            data={cnData} isLoading={cnLoading}
            emptyMsg="No credit/debit notes for this period."
            columns={[
              { key: 'gstinOfRecipient', label: 'GSTIN', mono: true },
              { key: 'receiverName', label: 'Receiver' },
              { key: 'noteNumber', label: 'Note #' },
              { key: 'noteType', label: 'Type', align: 'center' },
              { key: 'noteValue', label: 'Value', currency: true, align: 'right' },
              { key: 'rate', label: 'Rate', suffix: '%', align: 'center' },
              { key: 'taxableValue', label: 'Taxable', currency: true, align: 'right' },
              { key: 'igstAmount', label: 'IGST', currency: true, align: 'right' },
              { key: 'cgstAmount', label: 'CGST', currency: true, align: 'right' },
              { key: 'sgstAmount', label: 'SGST', currency: true, align: 'right' },
            ]}
            totalsRow={cnData?.totals}
            totalsColumns={['noteValue', 'taxableValue', 'igstAmount', 'cgstAmount', 'sgstAmount']}
            exportFn={() => exportGenericCSV(cnData?.rows || [], ['gstinOfRecipient','receiverName','noteNumber','noteType','noteValue','rate','taxableValue','igstAmount','cgstAmount','sgstAmount'], `GSTR1_CreditNotes_Table9B_${month}`)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Table 12 — HSN Summary" count={hsnData?.rows?.length}>
          <HSNSummaryTable data={hsnData} isLoading={hsnLoading} month={month} />
        </CollapsibleSection>

        <CollapsibleSection title="Table 13 — Document Summary" count={docData?.rows?.length}>
          <DocSummaryTable data={docData} isLoading={docLoading} />
        </CollapsibleSection>
      </div>
    </div>
  )
}
