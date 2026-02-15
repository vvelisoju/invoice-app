import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { DOCUMENT_TYPE_DEFAULTS } from '../../../../config/documentTypeDefaults'
import BaseInvoiceDocument from './themes/BaseInvoiceDocument'
import { ALL_THEMES, THEME_IDS, resolveTheme, LEGACY_MAP } from './themes/index'

// ============================================================================
// Shared Helpers
// ============================================================================

// Resolve document type labels, heading, and field visibility for PDF rendering.
// Falls back to invoice defaults if no config is attached.
const getDocLabels = (invoice) => {
  const cfg = invoice.docTypeConfig || DOCUMENT_TYPE_DEFAULTS[invoice.documentType] || DOCUMENT_TYPE_DEFAULTS.invoice
  return {
    heading: cfg.heading || 'INVOICE',
    fromLabel: cfg.labels?.fromSection || 'From',
    toLabel: cfg.labels?.toSection || 'Bill To',
    numberLabel: cfg.labels?.numberField || 'Invoice #',
    dateLabel: cfg.labels?.dateField || 'Invoice Date',
    // Line-item column labels
    descriptionCol: cfg.labels?.descriptionCol || 'Description',
    unitPriceCol: cfg.labels?.unitPriceCol || 'Unit Price',
    qtyCol: cfg.labels?.qtyCol || 'Qty',
    amountCol: cfg.labels?.amountCol || 'Amount',
    taxCol: cfg.labels?.taxCol || 'Tax',
    showShipTo: cfg.fields?.showShipTo !== false,
    showDueDate: cfg.fields?.showDueDate !== false,
    showLogo: cfg.fields?.showLogo !== false,
    showTerms: cfg.fields?.showTerms !== false,
    showSignature: cfg.fields?.showSignature !== false,
    showNotes: cfg.fields?.showNotes !== false,
    showTax: cfg.fields?.showTax !== false,
    showQty: cfg.fields?.showQty !== false,
    showUnitPrice: cfg.fields?.showUnitPrice !== false,
    lineItemsLayout: cfg.fields?.lineItemsLayout || 'full',
  }
}

const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return `Rs. ${formatted}`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Resolve logo/signature: prefer invoice-level snapshot, fallback to business profile
// Format per-line-item tax label for display in the table
const formatItemTax = (item) => {
  if (!item.taxRate && !item.taxRateName) return ''
  const rate = Number(item.taxRate)
  if (rate && item.taxRateName) return `${rate}% ${item.taxRateName}`
  if (rate) return `${rate}%`
  return item.taxRateName
}

// Check if any line item has per-item tax data
const hasLineItemTax = (lineItems) => lineItems?.some(item => item.taxRate || item.taxRateName)

// Compute per-rate tax breakdown from line items
// Returns { entries: [{name, rate, amount}], totalTax: number }
function computeTaxBreakdown(lineItems) {
  const breakdown = {}
  ;(lineItems || []).forEach((item) => {
    if (item.taxRate && Number(item.taxRate) > 0) {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
      const comps = item.taxComponents && Array.isArray(item.taxComponents) && item.taxComponents.length >= 2
        ? item.taxComponents : null
      if (comps) {
        comps.forEach((c) => {
          const key = `${c.name}_${c.rate}`
          const amt = (lineTotal * Number(c.rate)) / 100
          if (!breakdown[key]) breakdown[key] = { name: c.name, rate: Number(c.rate), amount: 0 }
          breakdown[key].amount += amt
        })
      } else {
        const rate = Number(item.taxRate)
        const key = String(rate)
        const amt = (lineTotal * rate) / 100
        if (!breakdown[key]) breakdown[key] = { name: item.taxRateName || 'Tax', rate, amount: 0 }
        breakdown[key].amount += amt
      }
    }
  })
  const entries = Object.values(breakdown).sort((a, b) => a.rate - b.rate)
  const totalTax = entries.reduce((sum, e) => sum + e.amount, 0)
  return { entries, totalTax }
}

// Compute the correct invoice total, accounting for per-item taxes
// This ensures the PDF shows the right total even for invoices saved before the server fix
function computeInvoiceTotal(invoice) {
  const subtotal = parseFloat(invoice.subtotal) || 0
  const discount = parseFloat(invoice.discountTotal) || 0
  const { totalTax } = computeTaxBreakdown(invoice.lineItems)
  // Use per-item tax if available, otherwise fall back to invoice-level taxTotal
  const tax = totalTax > 0 ? totalTax : (parseFloat(invoice.taxTotal) || 0)
  return subtotal - discount + tax
}

// Shared tax breakdown rows for totals section
// Expands tax group components (e.g. CGST + SGST) into individual lines
function TaxBreakdownRows({ invoice, doc, labelStyle, valueStyle, rowStyle }) {
  if (!doc.showTax) return null
  const { entries } = computeTaxBreakdown(invoice.lineItems)
  if (entries.length > 0) {
    return entries.map((entry, i) => (
      <View key={i} style={rowStyle}>
        <Text style={labelStyle}>{entry.name} ({entry.rate}%)</Text>
        <Text style={valueStyle}>{formatCurrency(entry.amount)}</Text>
      </View>
    ))
  }
  // Fallback: invoice-level tax
  if (invoice.taxTotal > 0) {
    return (
      <View style={rowStyle}>
        <Text style={labelStyle}>Tax{invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}</Text>
        <Text style={valueStyle}>{formatCurrency(invoice.taxTotal)}</Text>
      </View>
    )
  }
  return null
}

const getLogoUrl = (invoice) => invoice.logoUrl || invoice.business?.logoUrl
const getSignatureUrl = (invoice) => invoice.signatureUrl || invoice.business?.signatureUrl

// Resolve address fields: prefer invoice-level snapshots, fallback to relations
// Returns { lines: string[] } for rendering multi-line text blocks
const getFromAddress = (invoice) => {
  if (invoice.fromAddress) return invoice.fromAddress.split('\n').filter(Boolean)
  const parts = []
  if (invoice.business?.name) parts.push(invoice.business.name)
  if (invoice.business?.address) parts.push(invoice.business.address)
  if (invoice.business?.gstin) parts.push(`GSTIN: ${invoice.business.gstin}`)
  return parts
}

const getBillTo = (invoice) => {
  if (invoice.billTo) return invoice.billTo.split('\n').filter(Boolean)
  const parts = []
  if (invoice.customer?.name) parts.push(invoice.customer.name)
  if (invoice.customer?.address) parts.push(invoice.customer.address)
  if (invoice.customer?.phone) parts.push(invoice.customer.phone)
  if (invoice.customer?.email) parts.push(invoice.customer.email)
  if (invoice.customer?.gstin) parts.push(`GSTIN: ${invoice.customer.gstin}`)
  return parts
}

const getShipTo = (invoice) => {
  if (invoice.shipTo) return invoice.shipTo.split('\n').filter(Boolean)
  const parts = []
  if (invoice.customer?.name) parts.push(invoice.customer.name)
  if (invoice.customer?.address) parts.push(invoice.customer.address)
  return parts
}

// Render multi-line address block for PDF
function AddressBlock({ lines, nameStyle, detailStyle }) {
  if (!lines || lines.length === 0) return null
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i} style={i === 0 ? nameStyle : detailStyle}>{line}</Text>
      ))}
    </>
  )
}

// Shared branded footer — configurable per plan (showBranding flag)
function BrandedFooter({ showBranding = true }) {
  if (!showBranding) return null
  return (
    <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }} fixed>
      <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Invoice by InvoiceBaba.com</Text>
    </View>
  )
}

// ============================================================================
// 1. CLASSIC CLEAN — The default minimal template
// ============================================================================

const cleanStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  invoiceInfo: { textAlign: 'right' },
  invoiceNumber: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#666', textTransform: 'uppercase' },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsSection: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { width: 100, textAlign: 'right', marginRight: 20, color: '#666' },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderTopColor: '#333' },
  grandTotalLabel: { width: 100, textAlign: 'right', marginRight: 20, fontSize: 14, fontWeight: 'bold' },
  grandTotalValue: { width: 80, textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
  notes: { marginTop: 30, padding: 10, backgroundColor: '#f9f9f9' },
  notesTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  notesText: { fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  footerText: { fontSize: 9, color: '#999', textAlign: 'center' },
})

export function CleanTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={cleanStyles.page}>
        <View style={cleanStyles.header}>
          <View>
            {doc.showLogo && getLogoUrl(invoice) && (
              <Image src={getLogoUrl(invoice)} style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 6 }} />
            )}
            <Text style={cleanStyles.title}>{doc.heading}</Text>
            <AddressBlock
              lines={getFromAddress(invoice)}
              nameStyle={{ marginTop: 8, fontSize: 12 }}
              detailStyle={{ color: '#666', marginTop: 4 }}
            />
          </View>
          <View style={cleanStyles.invoiceInfo}>
            <Text style={cleanStyles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <Text>{doc.dateLabel}: {formatDate(invoice.date)}</Text>
            {doc.showDueDate && invoice.dueDate && <Text>Due: {formatDate(invoice.dueDate)}</Text>}
          </View>
        </View>
        <View style={cleanStyles.section}>
          <Text style={cleanStyles.sectionTitle}>{doc.toLabel}</Text>
          <AddressBlock
            lines={getBillTo(invoice)}
            nameStyle={{ fontSize: 12, fontWeight: 'bold' }}
            detailStyle={{ color: '#666', marginTop: 2 }}
          />
        </View>
        <View style={cleanStyles.table}>
          <View style={cleanStyles.tableHeader}>
            <Text style={isBasic ? { flex: 4 } : cleanStyles.colName}>{doc.descriptionCol}</Text>
            {!isBasic && <Text style={cleanStyles.colQty}>{doc.qtyCol}</Text>}
            {!isBasic && <Text style={cleanStyles.colRate}>{doc.unitPriceCol}</Text>}
            {showTaxCol && <Text style={cleanStyles.colTax}>{doc.taxCol}</Text>}
            <Text style={cleanStyles.colTotal}>{doc.amountCol}</Text>
          </View>
          {invoice.lineItems?.map((item, i) => (
            <View key={i} style={cleanStyles.tableRow}>
              <View style={isBasic ? { flex: 4 } : cleanStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
              {!isBasic && <Text style={cleanStyles.colQty}>{item.quantity}</Text>}
              {!isBasic && <Text style={cleanStyles.colRate}>{formatCurrency(item.rate)}</Text>}
              {showTaxCol && <Text style={[cleanStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
              <Text style={cleanStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
            </View>
          ))}
        </View>
        <View style={cleanStyles.totalsSection}>
          <View style={cleanStyles.totalRow}>
            <Text style={cleanStyles.totalLabel}>Subtotal</Text>
            <Text style={cleanStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discountTotal > 0 && (
            <View style={cleanStyles.totalRow}>
              <Text style={cleanStyles.totalLabel}>Discount</Text>
              <Text style={cleanStyles.totalValue}>-{formatCurrency(invoice.discountTotal)}</Text>
            </View>
          )}
          <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={cleanStyles.totalRow} labelStyle={cleanStyles.totalLabel} valueStyle={cleanStyles.totalValue} />
          <View style={cleanStyles.grandTotal}>
            <Text style={cleanStyles.grandTotalLabel}>Total</Text>
            <Text style={cleanStyles.grandTotalValue}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
          </View>
        </View>
        {doc.showNotes && invoice.notes && (
          <View style={cleanStyles.notes}>
            <Text style={cleanStyles.notesTitle}>Notes</Text>
            <Text style={cleanStyles.notesText}>{invoice.notes}</Text>
          </View>
        )}
        {doc.showTerms && invoice.terms && (
          <View style={[cleanStyles.notes, { marginTop: 10 }]}>
            <Text style={cleanStyles.notesTitle}>Terms & Conditions</Text>
            <Text style={cleanStyles.notesText}>{invoice.terms}</Text>
          </View>
        )}
        {doc.showSignature && <BankAndSignature invoice={invoice} color="#333" />}
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// Shared: Bank Details + Signature block (reused across templates)
// ============================================================================

function BankAndSignature({ invoice, color = '#333' }) {
  const hasBankDetails = invoice.business?.bankName || invoice.business?.upiId
  return (
    <View style={{ flexDirection: 'row', marginTop: 30, justifyContent: 'space-between' }}>
      {hasBankDetails && (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6, color, textTransform: 'uppercase' }}>Payment Details</Text>
          {invoice.business?.bankName && <Text style={{ fontSize: 9, marginBottom: 2 }}>Bank: {invoice.business.bankName}</Text>}
          {invoice.business?.accountNumber && <Text style={{ fontSize: 9, marginBottom: 2 }}>A/C: {invoice.business.accountNumber}</Text>}
          {invoice.business?.ifscCode && <Text style={{ fontSize: 9, marginBottom: 2 }}>IFSC: {invoice.business.ifscCode}</Text>}
          {invoice.business?.upiId && <Text style={{ fontSize: 9, marginTop: 4 }}>UPI: {invoice.business.upiId}</Text>}
        </View>
      )}
      <View style={{ width: 180, textAlign: 'right', alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6, color, textTransform: 'uppercase' }}>Authorized Signatory</Text>
        {getSignatureUrl(invoice) ? (
          <Image src={getSignatureUrl(invoice)} style={{ width: 100, height: 40, objectFit: 'contain', marginTop: 4 }} />
        ) : invoice.business?.signatureName ? (
          <View style={{ marginTop: 4, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, backgroundColor: '#FEFCE8', width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Times-Italic', color: '#1F2937' }}>{invoice.business.signatureName}</Text>
            <Text style={{ fontSize: 7, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase' }}>Authorized Signatory</Text>
          </View>
        ) : (
          <View style={{ height: 40, borderBottomWidth: 1, borderBottomColor: '#999', marginTop: 20, width: '100%' }} />
        )}
        {invoice.business?.signatureName && !getSignatureUrl(invoice) ? null : (
          invoice.business?.signatureName && <Text style={{ fontSize: 9, marginTop: 4 }}>{invoice.business.signatureName}</Text>
        )}
        {invoice.business?.name && <Text style={{ fontSize: 9, color: '#666' }}>For {invoice.business.name}</Text>}
      </View>
    </View>
  )
}

// ============================================================================
// 2. MODERN RED — Bold red sidebar accent
// ============================================================================

const modernRedStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#DC2626' },
  content: { paddingTop: 40, paddingBottom: 40, paddingLeft: 46, paddingRight: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#DC2626' },
  invoiceMetaBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 4, minWidth: 160 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  metaLabel: { fontSize: 8, color: '#991B1B', textTransform: 'uppercase', fontWeight: 'bold' },
  metaValue: { fontSize: 10, color: '#1F2937', fontWeight: 'bold' },
  divider: { height: 2, backgroundColor: '#DC2626', marginBottom: 20, opacity: 0.3 },
  addressRow: { flexDirection: 'row', gap: 40, marginBottom: 25 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 8, fontWeight: 'bold', color: '#DC2626', textTransform: 'uppercase', marginBottom: 6 },
  addressName: { fontSize: 11, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  addressDetail: { fontSize: 9, color: '#6B7280', marginBottom: 1 },
  table: { marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#DC2626', padding: 8 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableRowAlt: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#6B7280' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1F2937' },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#DC2626', marginTop: 4 },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  grandTotalValue: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
})

export function ModernRedTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={modernRedStyles.page}>
        <View style={modernRedStyles.sidebar} />
        <View style={modernRedStyles.content}>
          <View style={modernRedStyles.headerRow}>
            <View>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={modernRedStyles.title}>{doc.heading}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={{ fontSize: 11, color: '#374151', marginTop: 4 }}
                detailStyle={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}
              />
            </View>
            <View style={modernRedStyles.invoiceMetaBox}>
              <View style={modernRedStyles.metaRow}>
                <Text style={modernRedStyles.metaLabel}>{doc.numberLabel}</Text>
                <Text style={modernRedStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={modernRedStyles.metaRow}>
                <Text style={modernRedStyles.metaLabel}>{doc.dateLabel}</Text>
                <Text style={modernRedStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {doc.showDueDate && invoice.dueDate && (
                <View style={modernRedStyles.metaRow}>
                  <Text style={modernRedStyles.metaLabel}>Due Date</Text>
                  <Text style={modernRedStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={modernRedStyles.divider} />
          <View style={modernRedStyles.addressRow}>
            <View style={modernRedStyles.addressBlock}>
              <Text style={modernRedStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={modernRedStyles.addressName}
                detailStyle={modernRedStyles.addressDetail}
              />
            </View>
            {doc.showShipTo && (
              <View style={modernRedStyles.addressBlock}>
                <Text style={modernRedStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={modernRedStyles.addressName}
                  detailStyle={modernRedStyles.addressDetail}
                />
              </View>
            )}
          </View>
          <View style={modernRedStyles.table}>
            <View style={modernRedStyles.tableHeader}>
              <Text style={[modernRedStyles.tableHeaderText, isBasic ? { flex: 4 } : modernRedStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={i % 2 === 1 ? modernRedStyles.tableRowAlt : modernRedStyles.tableRow}>
                <View style={isBasic ? { flex: 4 } : modernRedStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={modernRedStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={modernRedStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[modernRedStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={modernRedStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={modernRedStyles.totalsBox}>
            <View style={modernRedStyles.totalRow}>
              <Text style={modernRedStyles.totalLabel}>Subtotal</Text>
              <Text style={modernRedStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={modernRedStyles.totalRow}>
                <Text style={modernRedStyles.totalLabel}>Discount</Text>
                <Text style={modernRedStyles.totalValue}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={modernRedStyles.totalRow} labelStyle={modernRedStyles.totalLabel} valueStyle={modernRedStyles.totalValue} />
            <View style={modernRedStyles.grandTotalRow}>
              <Text style={modernRedStyles.grandTotalLabel}>Total</Text>
              <Text style={modernRedStyles.grandTotalValue}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#DC2626', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showNotes && invoice.notes && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#DC2626', marginBottom: 4 }}>Notes</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.notes}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#DC2626" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 3. CLASSIC RED — Traditional header stripe
// ============================================================================

const classicRedStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  headerBar: { backgroundColor: '#047857', height: 6 },
  content: { padding: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  businessName: { fontSize: 16, fontWeight: 'bold', color: '#047857' },
  invoiceTitle: { fontSize: 20, fontWeight: 'bold', color: '#047857', textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  metaLabel: { fontSize: 9, color: '#6B7280', marginRight: 10, width: 70, textAlign: 'right' },
  metaValue: { fontSize: 9, fontWeight: 'bold', color: '#1F2937', width: 80 },
  addressRow: { flexDirection: 'row', gap: 30, marginBottom: 20, marginTop: 15 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 9, fontWeight: 'bold', color: '#047857', marginBottom: 5, textTransform: 'uppercase' },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#047857', paddingBottom: 6, paddingHorizontal: 4 },
  tableHeaderText: { fontSize: 8, fontWeight: 'bold', color: '#047857', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  colSno: { width: 30 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#047857', marginTop: 4 },
})

export function ClassicRedTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={classicRedStyles.page}>
        <View style={classicRedStyles.headerBar} />
        <View style={classicRedStyles.content}>
          <View style={classicRedStyles.headerRow}>
            <View style={{ flex: 1 }}>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={classicRedStyles.businessName}
                detailStyle={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}
              />
            </View>
            <View>
              <Text style={classicRedStyles.invoiceTitle}>{doc.heading}</Text>
              <View style={classicRedStyles.metaRow}>
                <Text style={classicRedStyles.metaLabel}>{doc.numberLabel}</Text>
                <Text style={classicRedStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={classicRedStyles.metaRow}>
                <Text style={classicRedStyles.metaLabel}>{doc.dateLabel}</Text>
                <Text style={classicRedStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {doc.showDueDate && invoice.dueDate && (
                <View style={classicRedStyles.metaRow}>
                  <Text style={classicRedStyles.metaLabel}>Due Date</Text>
                  <Text style={classicRedStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={classicRedStyles.addressRow}>
            <View style={classicRedStyles.addressBlock}>
              <Text style={classicRedStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}
                detailStyle={{ fontSize: 9, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && (
              <View style={classicRedStyles.addressBlock}>
                <Text style={classicRedStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}
                  detailStyle={{ fontSize: 9, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={classicRedStyles.table}>
            <View style={classicRedStyles.tableHeader}>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colSno]}>#</Text>
              <Text style={[classicRedStyles.tableHeaderText, isBasic ? { flex: 4 } : classicRedStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={classicRedStyles.tableRow}>
                <Text style={classicRedStyles.colSno}>{i + 1}</Text>
                <View style={isBasic ? { flex: 4 } : classicRedStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={classicRedStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={classicRedStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[classicRedStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={classicRedStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={classicRedStyles.totalsBox}>
            <View style={classicRedStyles.totalRow}>
              <Text style={{ fontSize: 9, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={classicRedStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={classicRedStyles.totalRow} labelStyle={{ fontSize: 9, color: '#6B7280' }} valueStyle={{ fontSize: 9, fontWeight: 'bold' }} />
            <View style={classicRedStyles.grandTotalRow}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#047857' }}>TOTAL</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#047857' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#047857', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#047857" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 4. WEXLER — Bold typography, colored accent band at top
// ============================================================================

const wexlerStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  accentBar: { height: 80, backgroundColor: '#1E3A5F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40 },
  accentTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 3 },
  accentMeta: { textAlign: 'right' },
  accentMetaText: { fontSize: 9, color: '#93C5FD', marginBottom: 2 },
  accentMetaValue: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' },
  content: { padding: 40 },
  addressRow: { flexDirection: 'row', gap: 40, marginBottom: 25 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 8, fontWeight: 'bold', color: '#1E3A5F', textTransform: 'uppercase', marginBottom: 5, letterSpacing: 1 },
  table: { marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 8, borderBottomWidth: 2, borderBottomColor: '#1E3A5F' },
  tableHeaderText: { fontSize: 8, fontWeight: 'bold', color: '#1E3A5F', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  colSno: { width: 30 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#1E3A5F', paddingHorizontal: 10, marginTop: 6 },
})

export function WexlerTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={wexlerStyles.page}>
        <View style={wexlerStyles.accentBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {doc.showLogo && getLogoUrl(invoice) && (
              <Image src={getLogoUrl(invoice)} style={{ width: 55, height: 55, objectFit: 'contain' }} />
            )}
            <Text style={wexlerStyles.accentTitle}>{doc.heading}</Text>
          </View>
          <View style={wexlerStyles.accentMeta}>
            <Text style={wexlerStyles.accentMetaText}>{doc.numberLabel} {invoice.invoiceNumber}</Text>
            <Text style={wexlerStyles.accentMetaValue}>{formatDate(invoice.date)}</Text>
            {doc.showDueDate && invoice.dueDate && <Text style={wexlerStyles.accentMetaText}>Due: {formatDate(invoice.dueDate)}</Text>}
          </View>
        </View>
        <View style={wexlerStyles.content}>
          <View style={wexlerStyles.addressRow}>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>{doc.fromLabel}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}
                detailStyle={{ fontSize: 9, color: '#6B7280' }}
              />
            </View>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}
                detailStyle={{ fontSize: 9, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && (
              <View style={wexlerStyles.addressBlock}>
                <Text style={wexlerStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}
                  detailStyle={{ fontSize: 9, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={wexlerStyles.table}>
            <View style={wexlerStyles.tableHeader}>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colSno]}>#</Text>
              <Text style={[wexlerStyles.tableHeaderText, isBasic ? { flex: 4 } : wexlerStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={wexlerStyles.tableRow}>
                <Text style={wexlerStyles.colSno}>{i + 1}</Text>
                <View style={isBasic ? { flex: 4 } : wexlerStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={wexlerStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={wexlerStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[wexlerStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={wexlerStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={wexlerStyles.totalsBox}>
            <View style={wexlerStyles.totalRow}>
              <Text style={{ fontSize: 9, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={wexlerStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={wexlerStyles.totalRow} labelStyle={{ fontSize: 9, color: '#6B7280' }} valueStyle={{ fontSize: 9, fontWeight: 'bold' }} />
            <View style={wexlerStyles.grandTotalRow}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>TOTAL</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#1E3A5F" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 5. PLEXER — Professional two-tone, clean grid
// ============================================================================

const plexerStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  topBar: { height: 4, backgroundColor: '#374151' },
  content: { padding: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', letterSpacing: 2 },
  businessDetail: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  metaBox: { borderLeftWidth: 3, borderLeftColor: '#374151', paddingLeft: 10 },
  metaRow: { marginBottom: 3 },
  metaLabel: { fontSize: 7, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: 10, color: '#111827', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },
  addressRow: { flexDirection: 'row', gap: 40, marginBottom: 20 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 5, letterSpacing: 1 },
  table: { marginTop: 5 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 6, paddingHorizontal: 4 },
  tableHeaderText: { fontSize: 7, fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colSno: { width: 25 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#374151', marginTop: 4 },
})

export function PlexerTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={plexerStyles.page}>
        <View style={plexerStyles.topBar} />
        <View style={plexerStyles.content}>
          <View style={plexerStyles.headerRow}>
            <View>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={plexerStyles.title}>{doc.heading}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={{ fontSize: 11, color: '#374151', marginTop: 4 }}
                detailStyle={plexerStyles.businessDetail}
              />
            </View>
            <View style={plexerStyles.metaBox}>
              <View style={plexerStyles.metaRow}>
                <Text style={plexerStyles.metaLabel}>{doc.numberLabel}</Text>
                <Text style={plexerStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={plexerStyles.metaRow}>
                <Text style={plexerStyles.metaLabel}>{doc.dateLabel}</Text>
                <Text style={plexerStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {doc.showDueDate && invoice.dueDate && (
                <View style={plexerStyles.metaRow}>
                  <Text style={plexerStyles.metaLabel}>Due Date</Text>
                  <Text style={plexerStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={plexerStyles.separator} />
          <View style={plexerStyles.addressRow}>
            <View style={plexerStyles.addressBlock}>
              <Text style={plexerStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}
                detailStyle={{ fontSize: 9, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && (
              <View style={plexerStyles.addressBlock}>
                <Text style={plexerStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}
                  detailStyle={{ fontSize: 9, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={plexerStyles.table}>
            <View style={plexerStyles.tableHeader}>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colSno]}>#</Text>
              <Text style={[plexerStyles.tableHeaderText, isBasic ? { flex: 4 } : plexerStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[plexerStyles.tableHeaderText, plexerStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[plexerStyles.tableHeaderText, plexerStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[plexerStyles.tableHeaderText, plexerStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={plexerStyles.tableRow}>
                <Text style={plexerStyles.colSno}>{i + 1}</Text>
                <View style={isBasic ? { flex: 4 } : plexerStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={plexerStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={plexerStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[plexerStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={plexerStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={plexerStyles.totalsBox}>
            <View style={plexerStyles.totalRow}>
              <Text style={{ fontSize: 9, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={plexerStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={plexerStyles.totalRow} labelStyle={{ fontSize: 9, color: '#6B7280' }} valueStyle={{ fontSize: 9, fontWeight: 'bold' }} />
            <View style={plexerStyles.grandTotalRow}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }}>TOTAL</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#374151" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 6. CONTEMPORARY — Gradient-style colored header with spacious layout
// ============================================================================

const contemporaryStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  headerBg: { backgroundColor: '#E11D48', paddingVertical: 30, paddingHorizontal: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  businessInfo: { fontSize: 9, color: '#FECDD3', marginTop: 3 },
  metaRight: { textAlign: 'right' },
  metaLabel: { fontSize: 7, color: '#FECDD3', textTransform: 'uppercase' },
  metaValue: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 4 },
  totalBadge: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 4, marginTop: 10 },
  totalBadgeLabel: { fontSize: 7, color: '#E11D48', textTransform: 'uppercase', fontWeight: 'bold' },
  totalBadgeValue: { fontSize: 18, color: '#E11D48', fontWeight: 'bold' },
  content: { padding: 40 },
  addressRow: { flexDirection: 'row', gap: 40, marginBottom: 25 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 8, fontWeight: 'bold', color: '#E11D48', textTransform: 'uppercase', marginBottom: 5 },
  table: { marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#FFF1F2', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E11D48' },
  tableHeaderText: { fontSize: 8, fontWeight: 'bold', color: '#E11D48', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#E11D48', paddingHorizontal: 10, marginTop: 6 },
})

export function ContemporaryTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={contemporaryStyles.page}>
        <View style={contemporaryStyles.headerBg}>
          <View style={contemporaryStyles.headerRow}>
            <View>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 85, height: 85, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={contemporaryStyles.title}>{doc.heading}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={contemporaryStyles.businessInfo}
                detailStyle={contemporaryStyles.businessInfo}
              />
            </View>
            <View style={contemporaryStyles.metaRight}>
              <Text style={contemporaryStyles.metaLabel}>{doc.numberLabel}</Text>
              <Text style={contemporaryStyles.metaValue}>{invoice.invoiceNumber}</Text>
              <Text style={contemporaryStyles.metaLabel}>{doc.dateLabel}</Text>
              <Text style={contemporaryStyles.metaValue}>{formatDate(invoice.date)}</Text>
              {doc.showDueDate && invoice.dueDate && (
                <>
                  <Text style={contemporaryStyles.metaLabel}>Due Date</Text>
                  <Text style={contemporaryStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </>
              )}
              <View style={contemporaryStyles.totalBadge}>
                <Text style={contemporaryStyles.totalBadgeLabel}>{doc.heading} Total</Text>
                <Text style={contemporaryStyles.totalBadgeValue}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={contemporaryStyles.content}>
          <View style={contemporaryStyles.addressRow}>
            <View style={contemporaryStyles.addressBlock}>
              <Text style={contemporaryStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}
                detailStyle={{ fontSize: 9, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && (
              <View style={contemporaryStyles.addressBlock}>
                <Text style={contemporaryStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}
                  detailStyle={{ fontSize: 9, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={contemporaryStyles.table}>
            <View style={contemporaryStyles.tableHeader}>
              <Text style={[contemporaryStyles.tableHeaderText, isBasic ? { flex: 4 } : contemporaryStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={contemporaryStyles.tableRow}>
                <View style={isBasic ? { flex: 4 } : contemporaryStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={contemporaryStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={contemporaryStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[contemporaryStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={contemporaryStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={contemporaryStyles.totalsBox}>
            <View style={contemporaryStyles.totalRow}>
              <Text style={{ fontSize: 9, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={contemporaryStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={contemporaryStyles.totalRow} labelStyle={{ fontSize: 9, color: '#6B7280' }} valueStyle={{ fontSize: 9, fontWeight: 'bold' }} />
            <View style={contemporaryStyles.grandTotalRow}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>TOTAL</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#E11D48', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#E11D48" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// Theme-based Template System — 100 templates from 20 layouts × 5 palettes
// ============================================================================

// Generic themed template wrapper — resolves theme and renders BaseInvoiceDocument
function ThemedTemplate({ invoice, themeId }) {
  const theme = resolveTheme(themeId)
  if (!theme) return null
  return <BaseInvoiceDocument invoice={invoice} theme={theme} />
}

// Factory: create a component for a specific theme ID
function createThemedComponent(themeId) {
  const Component = ({ invoice }) => <ThemedTemplate invoice={invoice} themeId={themeId} />
  Component.displayName = `Theme_${themeId}`
  return Component
}

// ============================================================================
// Template Map — used by pdfGenerator to dispatch
// ============================================================================

// Start with legacy templates (exact original rendering for backward compat)
const LEGACY_COMPONENTS = {
  clean: CleanTemplate,
  'modern-red': ModernRedTemplate,
  'classic-red': ClassicRedTemplate,
  wexler: WexlerTemplate,
  plexer: PlexerTemplate,
  contemporary: ContemporaryTemplate,
}

// Build the full map: 100 themed templates + legacy overrides
const themedComponents = {}
for (const themeId of THEME_IDS) {
  themedComponents[themeId] = createThemedComponent(themeId)
}

// Merge: legacy IDs point to original components, everything else uses themed
export const TEMPLATE_COMPONENTS = {
  ...themedComponents,
  ...LEGACY_COMPONENTS,
}
