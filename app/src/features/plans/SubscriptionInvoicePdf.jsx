import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  invoiceInfo: { textAlign: 'right' },
  invoiceNumber: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  statusBadge: { fontSize: 9, color: '#16A34A', backgroundColor: '#F0FDF4', padding: '3 8', borderRadius: 4, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#666', textTransform: 'uppercase' },
  addressRow: { flexDirection: 'row', gap: 40, marginBottom: 25 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 8, fontWeight: 'bold', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 6 },
  addressName: { fontSize: 11, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  addressDetail: { fontSize: 9, color: '#6B7280', marginBottom: 1 },
  metaGrid: { flexDirection: 'row', marginBottom: 25, gap: 15 },
  metaBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 4 },
  metaLabel: { fontSize: 7, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { fontSize: 10, fontWeight: 'bold', color: '#1F2937' },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  colName: { flex: 3 },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsSection: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { width: 100, textAlign: 'right', marginRight: 20, color: '#666' },
  totalValue: { width: 100, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderTopColor: '#333' },
  grandTotalLabel: { width: 100, textAlign: 'right', marginRight: 20, fontSize: 14, fontWeight: 'bold' },
  grandTotalValue: { width: 100, textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
  paymentBox: { marginTop: 30, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 4 },
  paymentTitle: { fontSize: 9, fontWeight: 'bold', color: '#16A34A', textTransform: 'uppercase', marginBottom: 6 },
  paymentRow: { fontSize: 9, color: '#1F2937', marginBottom: 2 },
  footer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

export default function SubscriptionInvoicePdf({ invoice }) {
  const statusLabel = invoice.status || 'PAID'
  const statusColor = statusLabel === 'PAID' ? '#16A34A' : statusLabel === 'PENDING' ? '#CA8A04' : '#6B7280'
  const statusBg = statusLabel === 'PAID' ? '#F0FDF4' : statusLabel === 'PENDING' ? '#FEFCE8' : '#F9FAFB'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SUBSCRIPTION INVOICE</Text>
            <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <Text>Invoice Date: {formatDate(invoice.createdAt)}</Text>
            <Text style={{ fontSize: 9, color: statusColor, backgroundColor: statusBg, padding: '3 8', borderRadius: 4, marginTop: 6 }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Date & Period Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Invoice Date</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Billing Period</Text>
            <Text style={[styles.metaValue, { textTransform: 'capitalize' }]}>{invoice.billingPeriod || '—'}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Period Start</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.periodStart)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Period End</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.periodEnd)}</Text>
          </View>
        </View>

        {/* From / Bill To */}
        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>From</Text>
            <Text style={styles.addressName}>{invoice.sellerName || 'Invoice Baba'}</Text>
            {invoice.sellerAddress && <Text style={styles.addressDetail}>{invoice.sellerAddress}</Text>}
            {invoice.sellerGstin && <Text style={styles.addressDetail}>GSTIN: {invoice.sellerGstin}</Text>}
          </View>
          <View style={styles.addressBlock}>
            <Text style={[styles.addressLabel, { color: '#EA580C' }]}>Bill To</Text>
            <Text style={styles.addressName}>{invoice.buyerName || '—'}</Text>
            {invoice.buyerAddress && <Text style={styles.addressDetail}>{invoice.buyerAddress}</Text>}
            {invoice.buyerGstin && <Text style={styles.addressDetail}>GSTIN: {invoice.buyerGstin}</Text>}
            {invoice.buyerEmail && <Text style={styles.addressDetail}>{invoice.buyerEmail}</Text>}
            {invoice.buyerPhone && <Text style={styles.addressDetail}>{invoice.buyerPhone}</Text>}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, { fontWeight: 'bold' }]}>Description</Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.colName}>
              <Text style={{ fontWeight: 'bold' }}>
                Subscription Plan — {invoice.billingPeriod ? invoice.billingPeriod.charAt(0).toUpperCase() + invoice.billingPeriod.slice(1) : '—'}
              </Text>
              <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>
                {formatDate(invoice.periodStart)} to {formatDate(invoice.periodEnd)}
              </Text>
            </View>
            <Text style={styles.colTotal}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.taxBreakup?.cgstAmount != null && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>CGST ({invoice.taxBreakup.cgstRate}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxBreakup.cgstAmount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SGST ({invoice.taxBreakup.sgstRate}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxBreakup.sgstAmount)}</Text>
              </View>
            </>
          )}
          {invoice.taxBreakup?.igstAmount != null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGST ({invoice.taxBreakup.igstRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxBreakup.igstAmount)}</Text>
            </View>
          )}
          {Number(invoice.taxTotal) > 0 && !invoice.taxBreakup?.cgstAmount && !invoice.taxBreakup?.igstAmount && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxTotal)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        {(invoice.razorpayPaymentId || invoice.paidAt) && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Payment Information</Text>
            {invoice.razorpayPaymentId && (
              <Text style={styles.paymentRow}>Payment ID: {invoice.razorpayPaymentId}</Text>
            )}
            {invoice.paidAt && (
              <Text style={styles.paymentRow}>Paid on: {formatDate(invoice.paidAt)}</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Invoice by InvoiceBaba.com</Text>
        </View>
      </Page>
    </Document>
  )
}
