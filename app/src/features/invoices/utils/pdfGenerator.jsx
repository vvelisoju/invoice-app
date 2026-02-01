import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  invoiceInfo: {
    textAlign: 'right'
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
    textTransform: 'uppercase'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4
  },
  label: {
    color: '#666',
    width: 80
  },
  value: {
    flex: 1
  },
  table: {
    marginTop: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  colName: {
    flex: 3
  },
  colQty: {
    flex: 1,
    textAlign: 'center'
  },
  colRate: {
    flex: 1,
    textAlign: 'right'
  },
  colTotal: {
    flex: 1,
    textAlign: 'right'
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    marginRight: 20,
    color: '#666'
  },
  totalValue: {
    width: 80,
    textAlign: 'right'
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#333'
  },
  grandTotalLabel: {
    width: 100,
    textAlign: 'right',
    marginRight: 20,
    fontSize: 14,
    fontWeight: 'bold'
  },
  grandTotalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40
  },
  footerText: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center'
  },
  notes: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4
  },
  notesText: {
    fontSize: 9,
    color: '#666'
  }
})

// Format currency
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Get default template config
const getDefaultConfig = () => ({
  colors: { primary: '#3880ff', secondary: '#666666', accent: '#f5f5f5' },
  logo: { show: true, position: 'left' },
  header: { showBusinessName: true, showBusinessAddress: true, showBusinessGSTIN: true, showBusinessPhone: true, showBusinessEmail: true },
  customer: { showPhone: true, showEmail: true, showAddress: true, showGSTIN: true },
  totals: { showSubtotal: true, showDiscount: true, showTaxBreakup: true, showAmountInWords: false },
  footer: { showBankDetails: true, showUPI: true, showSignature: true, showTerms: true, showNotes: true, customFooterText: '' },
  labels: { invoiceTitle: 'INVOICE', billTo: 'Bill To', itemDescription: 'Description', quantity: 'Qty', rate: 'Rate', amount: 'Amount' }
})

// Invoice PDF Document Component
const InvoicePDFDocument = ({ invoice, templateConfig }) => {
  const config = { ...getDefaultConfig(), ...templateConfig }
  const colors = config.colors || {}
  const labels = config.labels || {}
  const header = config.header || {}
  const customer = config.customer || {}
  const totals = config.totals || {}
  const footer = config.footer || {}

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          {invoice.business?.name && (
            <Text style={{ marginTop: 8, fontSize: 12 }}>{invoice.business.name}</Text>
          )}
          {invoice.business?.address && (
            <Text style={{ color: '#666', marginTop: 4 }}>{invoice.business.address}</Text>
          )}
          {invoice.business?.gstin && (
            <Text style={{ color: '#666', marginTop: 4 }}>GSTIN: {invoice.business.gstin}</Text>
          )}
        </View>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          <Text>Date: {formatDate(invoice.date)}</Text>
          {invoice.dueDate && (
            <Text>Due: {formatDate(invoice.dueDate)}</Text>
          )}
        </View>
      </View>

      {/* Bill To */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill To</Text>
        {invoice.customer?.name && (
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{invoice.customer.name}</Text>
        )}
        {invoice.customer?.phone && (
          <Text style={{ color: '#666', marginTop: 2 }}>{invoice.customer.phone}</Text>
        )}
        {invoice.customer?.address && (
          <Text style={{ color: '#666', marginTop: 2 }}>{invoice.customer.address}</Text>
        )}
        {invoice.customer?.gstin && (
          <Text style={{ color: '#666', marginTop: 2 }}>GSTIN: {invoice.customer.gstin}</Text>
        )}
      </View>

      {/* Line Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colRate}>Rate</Text>
          <Text style={styles.colTotal}>Amount</Text>
        </View>
        {invoice.lineItems?.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>{formatCurrency(item.rate)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        
        {invoice.discountTotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.totalValue}>-{formatCurrency(invoice.discountTotal)}</Text>
          </View>
        )}
        
        {invoice.taxRate > 0 && (
          <>
            {invoice.taxMode === 'CGST_SGST' ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST ({invoice.taxBreakup?.cgst}%)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(invoice.taxBreakup?.cgstAmount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST ({invoice.taxBreakup?.sgst}%)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(invoice.taxBreakup?.sgstAmount)}</Text>
                </View>
              </>
            ) : invoice.taxMode === 'IGST' ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST ({invoice.taxBreakup?.igst}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxBreakup?.igstAmount)}</Text>
              </View>
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxTotal)}</Text>
              </View>
            )}
          </>
        )}
        
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {/* Terms */}
      {invoice.terms && (
        <View style={[styles.notes, { marginTop: 10 }]}>
          <Text style={styles.notesTitle}>Terms & Conditions</Text>
          <Text style={styles.notesText}>{invoice.terms}</Text>
        </View>
      )}

      {/* Bank Details & Signature Row */}
      <View style={{ flexDirection: 'row', marginTop: 30, justifyContent: 'space-between' }}>
        {/* Bank Details */}
        {(invoice.business?.bankName || invoice.business?.upiId) && (
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            {invoice.business?.bankName && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>Bank: {invoice.business.bankName}</Text>
            )}
            {invoice.business?.accountNumber && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>A/C: {invoice.business.accountNumber}</Text>
            )}
            {invoice.business?.ifscCode && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>IFSC: {invoice.business.ifscCode}</Text>
            )}
            {invoice.business?.upiId && (
              <Text style={{ fontSize: 9, marginTop: 4 }}>UPI: {invoice.business.upiId}</Text>
            )}
          </View>
        )}

        {/* Signature Block */}
        <View style={{ width: 150, textAlign: 'right' }}>
          <Text style={styles.sectionTitle}>Authorized Signatory</Text>
          <View style={{ height: 40, borderBottomWidth: 1, borderBottomColor: '#999', marginTop: 20 }} />
          {invoice.business?.signatureName && (
            <Text style={{ fontSize: 9, marginTop: 4 }}>{invoice.business.signatureName}</Text>
          )}
          {invoice.business?.name && (
            <Text style={{ fontSize: 9, color: '#666' }}>For {invoice.business.name}</Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generated by Invoice App • {formatDate(new Date().toISOString())}
        </Text>
      </View>
    </Page>
  </Document>
  )
}

// Generate PDF blob
export const generatePDF = async (invoice, templateConfig = null) => {
  const blob = await pdf(<InvoicePDFDocument invoice={invoice} templateConfig={templateConfig} />).toBlob()
  return blob
}

// Download PDF
export const downloadPDF = async (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Get PDF as base64 (for Capacitor sharing)
export const getPDFBase64 = async (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
