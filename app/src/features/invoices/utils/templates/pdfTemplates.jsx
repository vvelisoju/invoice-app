import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// ============================================================================
// Shared Helpers
// ============================================================================

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
const getLogoUrl = (invoice) => invoice.logoUrl || invoice.business?.logoUrl
const getSignatureUrl = (invoice) => invoice.signatureUrl || invoice.business?.signatureUrl

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
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTotal: { flex: 1, textAlign: 'right' },
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
  return (
    <Document>
      <Page size="A4" style={cleanStyles.page}>
        <View style={cleanStyles.header}>
          <View>
            {getLogoUrl(invoice) && (
              <Image src={getLogoUrl(invoice)} style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 6 }} />
            )}
            <Text style={cleanStyles.title}>INVOICE</Text>
            {invoice.business?.name && <Text style={{ marginTop: 8, fontSize: 12 }}>{invoice.business.name}</Text>}
            {invoice.business?.address && <Text style={{ color: '#666', marginTop: 4 }}>{invoice.business.address}</Text>}
            {invoice.business?.gstin && <Text style={{ color: '#666', marginTop: 4 }}>GSTIN: {invoice.business.gstin}</Text>}
          </View>
          <View style={cleanStyles.invoiceInfo}>
            <Text style={cleanStyles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <Text>Date: {formatDate(invoice.date)}</Text>
            {invoice.dueDate && <Text>Due: {formatDate(invoice.dueDate)}</Text>}
          </View>
        </View>
        <View style={cleanStyles.section}>
          <Text style={cleanStyles.sectionTitle}>Bill To</Text>
          {invoice.customer?.name && <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{invoice.customer.name}</Text>}
          {invoice.customer?.phone && <Text style={{ color: '#666', marginTop: 2 }}>{invoice.customer.phone}</Text>}
          {invoice.customer?.address && <Text style={{ color: '#666', marginTop: 2 }}>{invoice.customer.address}</Text>}
          {invoice.customer?.gstin && <Text style={{ color: '#666', marginTop: 2 }}>GSTIN: {invoice.customer.gstin}</Text>}
        </View>
        <View style={cleanStyles.table}>
          <View style={cleanStyles.tableHeader}>
            <Text style={cleanStyles.colName}>Description</Text>
            <Text style={cleanStyles.colQty}>Qty</Text>
            <Text style={cleanStyles.colRate}>Rate</Text>
            <Text style={cleanStyles.colTotal}>Amount</Text>
          </View>
          {invoice.lineItems?.map((item, i) => (
            <View key={i} style={cleanStyles.tableRow}>
              <Text style={cleanStyles.colName}>{item.name}</Text>
              <Text style={cleanStyles.colQty}>{item.quantity}</Text>
              <Text style={cleanStyles.colRate}>{formatCurrency(item.rate)}</Text>
              <Text style={cleanStyles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
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
          {invoice.taxTotal > 0 && (
            <View style={cleanStyles.totalRow}>
              <Text style={cleanStyles.totalLabel}>Tax{invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}</Text>
              <Text style={cleanStyles.totalValue}>{formatCurrency(invoice.taxTotal)}</Text>
            </View>
          )}
          <View style={cleanStyles.grandTotal}>
            <Text style={cleanStyles.grandTotalLabel}>Total</Text>
            <Text style={cleanStyles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>
        {invoice.notes && (
          <View style={cleanStyles.notes}>
            <Text style={cleanStyles.notesTitle}>Notes</Text>
            <Text style={cleanStyles.notesText}>{invoice.notes}</Text>
          </View>
        )}
        {invoice.terms && (
          <View style={[cleanStyles.notes, { marginTop: 10 }]}>
            <Text style={cleanStyles.notesTitle}>Terms & Conditions</Text>
            <Text style={cleanStyles.notesText}>{invoice.terms}</Text>
          </View>
        )}
        <BankAndSignature invoice={invoice} color="#333" />
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
      <View style={{ width: 150, textAlign: 'right', alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6, color, textTransform: 'uppercase' }}>Authorized Signatory</Text>
        {getSignatureUrl(invoice) ? (
          <Image src={getSignatureUrl(invoice)} style={{ width: 100, height: 40, objectFit: 'contain', marginTop: 4 }} />
        ) : (
          <View style={{ height: 40, borderBottomWidth: 1, borderBottomColor: '#999', marginTop: 20, width: '100%' }} />
        )}
        {invoice.business?.signatureName && <Text style={{ fontSize: 9, marginTop: 4 }}>{invoice.business.signatureName}</Text>}
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
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#6B7280' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1F2937' },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#DC2626', marginTop: 4 },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  grandTotalValue: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
})

export function ModernRedTemplate({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={modernRedStyles.page}>
        <View style={modernRedStyles.sidebar} />
        <View style={modernRedStyles.content}>
          <View style={modernRedStyles.headerRow}>
            <View>
              {getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={modernRedStyles.title}>INVOICE</Text>
              {invoice.business?.name && <Text style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>{invoice.business.name}</Text>}
              {invoice.business?.address && <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{invoice.business.address}</Text>}
              {invoice.business?.gstin && <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>GSTIN: {invoice.business.gstin}</Text>}
            </View>
            <View style={modernRedStyles.invoiceMetaBox}>
              <View style={modernRedStyles.metaRow}>
                <Text style={modernRedStyles.metaLabel}>Invoice #</Text>
                <Text style={modernRedStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={modernRedStyles.metaRow}>
                <Text style={modernRedStyles.metaLabel}>Date</Text>
                <Text style={modernRedStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {invoice.dueDate && (
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
              <Text style={modernRedStyles.addressLabel}>Bill To</Text>
              {invoice.customer?.name && <Text style={modernRedStyles.addressName}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={modernRedStyles.addressDetail}>{invoice.customer.address}</Text>}
              {invoice.customer?.phone && <Text style={modernRedStyles.addressDetail}>{invoice.customer.phone}</Text>}
              {invoice.customer?.gstin && <Text style={modernRedStyles.addressDetail}>GSTIN: {invoice.customer.gstin}</Text>}
            </View>
            <View style={modernRedStyles.addressBlock}>
              <Text style={modernRedStyles.addressLabel}>Ship To</Text>
              {invoice.customer?.name && <Text style={modernRedStyles.addressName}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={modernRedStyles.addressDetail}>{invoice.customer.address}</Text>}
            </View>
          </View>
          <View style={modernRedStyles.table}>
            <View style={modernRedStyles.tableHeader}>
              <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colName]}>Description</Text>
              <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colQty]}>Qty</Text>
              <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colRate]}>Unit Price</Text>
              <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colTotal]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={i % 2 === 1 ? modernRedStyles.tableRowAlt : modernRedStyles.tableRow}>
                <Text style={modernRedStyles.colName}>{item.name}</Text>
                <Text style={modernRedStyles.colQty}>{item.quantity}</Text>
                <Text style={modernRedStyles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={modernRedStyles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
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
            {invoice.taxTotal > 0 && (
              <View style={modernRedStyles.totalRow}>
                <Text style={modernRedStyles.totalLabel}>GST {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}</Text>
                <Text style={modernRedStyles.totalValue}>{formatCurrency(invoice.taxTotal)}</Text>
              </View>
            )}
            <View style={modernRedStyles.grandTotalRow}>
              <Text style={modernRedStyles.grandTotalLabel}>Total</Text>
              <Text style={modernRedStyles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
          {invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#DC2626', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {invoice.notes && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#DC2626', marginBottom: 4 }}>Notes</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.notes}</Text>
            </View>
          )}
          <BankAndSignature invoice={invoice} color="#DC2626" />
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
  colSno: { width: 30 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#047857', marginTop: 4 },
})

export function ClassicRedTemplate({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={classicRedStyles.page}>
        <View style={classicRedStyles.headerBar} />
        <View style={classicRedStyles.content}>
          <View style={classicRedStyles.headerRow}>
            <View style={{ flex: 1 }}>
              {getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={classicRedStyles.businessName}>{invoice.business?.name || 'Business'}</Text>
              {invoice.business?.address && <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 3 }}>{invoice.business.address}</Text>}
              {invoice.business?.gstin && <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 1 }}>GSTIN: {invoice.business.gstin}</Text>}
            </View>
            <View>
              <Text style={classicRedStyles.invoiceTitle}>INVOICE</Text>
              <View style={classicRedStyles.metaRow}>
                <Text style={classicRedStyles.metaLabel}>Invoice #</Text>
                <Text style={classicRedStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={classicRedStyles.metaRow}>
                <Text style={classicRedStyles.metaLabel}>Date</Text>
                <Text style={classicRedStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {invoice.dueDate && (
                <View style={classicRedStyles.metaRow}>
                  <Text style={classicRedStyles.metaLabel}>Due Date</Text>
                  <Text style={classicRedStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={classicRedStyles.addressRow}>
            <View style={classicRedStyles.addressBlock}>
              <Text style={classicRedStyles.addressLabel}>Bill To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
              {invoice.customer?.phone && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.phone}</Text>}
              {invoice.customer?.gstin && <Text style={{ fontSize: 9, color: '#6B7280' }}>GSTIN: {invoice.customer.gstin}</Text>}
            </View>
            <View style={classicRedStyles.addressBlock}>
              <Text style={classicRedStyles.addressLabel}>Ship To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
            </View>
          </View>
          <View style={classicRedStyles.table}>
            <View style={classicRedStyles.tableHeader}>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colSno]}>#</Text>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colName]}>Description</Text>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colQty]}>Qty</Text>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colRate]}>Unit Price</Text>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colTotal]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={classicRedStyles.tableRow}>
                <Text style={classicRedStyles.colSno}>{i + 1}</Text>
                <Text style={classicRedStyles.colName}>{item.name}</Text>
                <Text style={classicRedStyles.colQty}>{item.quantity}</Text>
                <Text style={classicRedStyles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={classicRedStyles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
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
            {invoice.taxTotal > 0 && (
              <View style={classicRedStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>GST {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.taxTotal)}</Text>
              </View>
            )}
            <View style={classicRedStyles.grandTotalRow}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#047857' }}>TOTAL</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#047857' }}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
          {invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#047857', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          <BankAndSignature invoice={invoice} color="#047857" />
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
  colSno: { width: 30 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#1E3A5F', paddingHorizontal: 10, marginTop: 6 },
})

export function WexlerTemplate({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={wexlerStyles.page}>
        <View style={wexlerStyles.accentBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {getLogoUrl(invoice) && (
              <Image src={getLogoUrl(invoice)} style={{ width: 55, height: 55, objectFit: 'contain' }} />
            )}
            <Text style={wexlerStyles.accentTitle}>INVOICE</Text>
          </View>
          <View style={wexlerStyles.accentMeta}>
            <Text style={wexlerStyles.accentMetaText}>Invoice # {invoice.invoiceNumber}</Text>
            <Text style={wexlerStyles.accentMetaValue}>{formatDate(invoice.date)}</Text>
            {invoice.dueDate && <Text style={wexlerStyles.accentMetaText}>Due: {formatDate(invoice.dueDate)}</Text>}
          </View>
        </View>
        <View style={wexlerStyles.content}>
          <View style={wexlerStyles.addressRow}>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>From</Text>
              {invoice.business?.name && <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{invoice.business.name}</Text>}
              {invoice.business?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.business.address}</Text>}
              {invoice.business?.gstin && <Text style={{ fontSize: 9, color: '#6B7280' }}>GSTIN: {invoice.business.gstin}</Text>}
            </View>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>Bill To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
              {invoice.customer?.phone && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.phone}</Text>}
              {invoice.customer?.gstin && <Text style={{ fontSize: 9, color: '#6B7280' }}>GSTIN: {invoice.customer.gstin}</Text>}
            </View>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>Ship To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
            </View>
          </View>
          <View style={wexlerStyles.table}>
            <View style={wexlerStyles.tableHeader}>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colSno]}>#</Text>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colName]}>Description</Text>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colQty]}>Qty</Text>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colRate]}>Unit Price</Text>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colTotal]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={wexlerStyles.tableRow}>
                <Text style={wexlerStyles.colSno}>{i + 1}</Text>
                <Text style={wexlerStyles.colName}>{item.name}</Text>
                <Text style={wexlerStyles.colQty}>{item.quantity}</Text>
                <Text style={wexlerStyles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={wexlerStyles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
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
            {invoice.taxTotal > 0 && (
              <View style={wexlerStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>GST {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.taxTotal)}</Text>
              </View>
            )}
            <View style={wexlerStyles.grandTotalRow}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>TOTAL</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
          {invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          <BankAndSignature invoice={invoice} color="#1E3A5F" />
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
  colSno: { width: 25 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#374151', marginTop: 4 },
})

export function PlexerTemplate({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={plexerStyles.page}>
        <View style={plexerStyles.topBar} />
        <View style={plexerStyles.content}>
          <View style={plexerStyles.headerRow}>
            <View>
              {getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={plexerStyles.title}>INVOICE</Text>
              {invoice.business?.name && <Text style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>{invoice.business.name}</Text>}
              {invoice.business?.address && <Text style={plexerStyles.businessDetail}>{invoice.business.address}</Text>}
              {invoice.business?.gstin && <Text style={plexerStyles.businessDetail}>GSTIN: {invoice.business.gstin}</Text>}
            </View>
            <View style={plexerStyles.metaBox}>
              <View style={plexerStyles.metaRow}>
                <Text style={plexerStyles.metaLabel}>Invoice Number</Text>
                <Text style={plexerStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={plexerStyles.metaRow}>
                <Text style={plexerStyles.metaLabel}>Invoice Date</Text>
                <Text style={plexerStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {invoice.dueDate && (
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
              <Text style={plexerStyles.addressLabel}>Bill To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
              {invoice.customer?.phone && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.phone}</Text>}
              {invoice.customer?.gstin && <Text style={{ fontSize: 9, color: '#6B7280' }}>GSTIN: {invoice.customer.gstin}</Text>}
            </View>
            <View style={plexerStyles.addressBlock}>
              <Text style={plexerStyles.addressLabel}>Ship To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
            </View>
          </View>
          <View style={plexerStyles.table}>
            <View style={plexerStyles.tableHeader}>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colSno]}>#</Text>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colName]}>Description</Text>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colQty]}>Qty</Text>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colRate]}>Unit Price</Text>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colTotal]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={plexerStyles.tableRow}>
                <Text style={plexerStyles.colSno}>{i + 1}</Text>
                <Text style={plexerStyles.colName}>{item.name}</Text>
                <Text style={plexerStyles.colQty}>{item.quantity}</Text>
                <Text style={plexerStyles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={plexerStyles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
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
            {invoice.taxTotal > 0 && (
              <View style={plexerStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>GST {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.taxTotal)}</Text>
              </View>
            )}
            <View style={plexerStyles.grandTotalRow}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }}>TOTAL</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
          {invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          <BankAndSignature invoice={invoice} color="#374151" />
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
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 15, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#E11D48', paddingHorizontal: 10, marginTop: 6 },
})

export function ContemporaryTemplate({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={contemporaryStyles.page}>
        <View style={contemporaryStyles.headerBg}>
          <View style={contemporaryStyles.headerRow}>
            <View>
              {getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 85, height: 85, objectFit: 'contain', marginBottom: 6 }} />
              )}
              <Text style={contemporaryStyles.title}>INVOICE</Text>
              {invoice.business?.name && <Text style={contemporaryStyles.businessInfo}>{invoice.business.name}</Text>}
              {invoice.business?.address && <Text style={contemporaryStyles.businessInfo}>{invoice.business.address}</Text>}
              {invoice.business?.gstin && <Text style={contemporaryStyles.businessInfo}>GSTIN: {invoice.business.gstin}</Text>}
            </View>
            <View style={contemporaryStyles.metaRight}>
              <Text style={contemporaryStyles.metaLabel}>Invoice #</Text>
              <Text style={contemporaryStyles.metaValue}>{invoice.invoiceNumber}</Text>
              <Text style={contemporaryStyles.metaLabel}>Invoice Date</Text>
              <Text style={contemporaryStyles.metaValue}>{formatDate(invoice.date)}</Text>
              {invoice.dueDate && (
                <>
                  <Text style={contemporaryStyles.metaLabel}>Due Date</Text>
                  <Text style={contemporaryStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </>
              )}
              <View style={contemporaryStyles.totalBadge}>
                <Text style={contemporaryStyles.totalBadgeLabel}>Invoice Total</Text>
                <Text style={contemporaryStyles.totalBadgeValue}>{formatCurrency(invoice.total)}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={contemporaryStyles.content}>
          <View style={contemporaryStyles.addressRow}>
            <View style={contemporaryStyles.addressBlock}>
              <Text style={contemporaryStyles.addressLabel}>Bill To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
              {invoice.customer?.phone && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.phone}</Text>}
              {invoice.customer?.gstin && <Text style={{ fontSize: 9, color: '#6B7280' }}>GSTIN: {invoice.customer.gstin}</Text>}
            </View>
            <View style={contemporaryStyles.addressBlock}>
              <Text style={contemporaryStyles.addressLabel}>Ship To</Text>
              {invoice.customer?.name && <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{invoice.customer.name}</Text>}
              {invoice.customer?.address && <Text style={{ fontSize: 9, color: '#6B7280' }}>{invoice.customer.address}</Text>}
            </View>
          </View>
          <View style={contemporaryStyles.table}>
            <View style={contemporaryStyles.tableHeader}>
              <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colName]}>Description</Text>
              <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colQty]}>Qty</Text>
              <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colRate]}>Unit Price</Text>
              <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colTotal]}>Amount</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={contemporaryStyles.tableRow}>
                <Text style={contemporaryStyles.colName}>{item.name}</Text>
                <Text style={contemporaryStyles.colQty}>{item.quantity}</Text>
                <Text style={contemporaryStyles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={contemporaryStyles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
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
            {invoice.taxTotal > 0 && (
              <View style={contemporaryStyles.totalRow}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>GST {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(invoice.taxTotal)}</Text>
              </View>
            )}
            <View style={contemporaryStyles.grandTotalRow}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>TOTAL</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' }}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
          {invoice.terms && (
            <View style={{ marginTop: 25 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#E11D48', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          <BankAndSignature invoice={invoice} color="#E11D48" />
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// Template Map — used by pdfGenerator to dispatch
// ============================================================================

export const TEMPLATE_COMPONENTS = {
  clean: CleanTemplate,
  'modern-red': ModernRedTemplate,
  'classic-red': ClassicRedTemplate,
  wexler: WexlerTemplate,
  plexer: PlexerTemplate,
  contemporary: ContemporaryTemplate,
}
