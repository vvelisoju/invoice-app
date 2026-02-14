// BaseInvoiceDocument — Shared renderer for all 100 themed templates
// Accepts { invoice, theme } where theme = { layout, palette }
// Uses layout config to determine structure, palette for colors.

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { DOCUMENT_TYPE_DEFAULTS } from '../../../../../config/documentTypeDefaults'

// ============================================================================
// Shared Helpers (carried over from original pdfTemplates.jsx)
// ============================================================================

const getDocLabels = (invoice) => {
  const cfg = invoice.docTypeConfig || DOCUMENT_TYPE_DEFAULTS[invoice.documentType] || DOCUMENT_TYPE_DEFAULTS.invoice
  return {
    heading: cfg.heading || 'INVOICE',
    fromLabel: cfg.labels?.fromSection || 'From',
    toLabel: cfg.labels?.toSection || 'Bill To',
    numberLabel: cfg.labels?.numberField || 'Invoice #',
    dateLabel: cfg.labels?.dateField || 'Invoice Date',
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
function computeInvoiceTotal(invoice) {
  const subtotal = parseFloat(invoice.subtotal) || 0
  const discount = parseFloat(invoice.discountTotal) || 0
  const { totalTax } = computeTaxBreakdown(invoice.lineItems)
  const tax = totalTax > 0 ? totalTax : (parseFloat(invoice.taxTotal) || 0)
  return subtotal - discount + tax
}

const getLogoUrl = (invoice) => invoice.logoUrl || invoice.business?.logoUrl
const getSignatureUrl = (invoice) => invoice.signatureUrl || invoice.business?.signatureUrl

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

// ============================================================================
// Sub-Components
// ============================================================================

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

function BrandedFooter({ showBranding = true }) {
  if (!showBranding) return null
  return (
    <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }} fixed>
      <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Invoice by InvoiceBaba.com</Text>
    </View>
  )
}

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
        {getSignatureUrl(invoice) && invoice.business?.signatureName && (
          <Text style={{ fontSize: 9, marginTop: 4 }}>{invoice.business.signatureName}</Text>
        )}
        {invoice.business?.name && <Text style={{ fontSize: 9, color: '#666' }}>For {invoice.business.name}</Text>}
      </View>
    </View>
  )
}

// ============================================================================
// Logo Component
// ============================================================================

function LogoImage({ invoice, doc, size = 90 }) {
  if (!doc.showLogo || !getLogoUrl(invoice)) return null
  return (
    <Image src={getLogoUrl(invoice)} style={{ width: size, height: size, objectFit: 'contain', marginBottom: 6 }} />
  )
}

// ============================================================================
// HEADER RENDERERS — one per headerStyle
// ============================================================================

function HeaderStandard({ invoice, doc, palette, layout }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
      <View>
        <LogoImage invoice={invoice} doc={doc} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: palette.primary }}>{doc.heading}</Text>
        <AddressBlock
          lines={getFromAddress(invoice)}
          nameStyle={{ marginTop: 8, fontSize: 12, color: palette.text }}
          detailStyle={{ color: palette.textLight, marginTop: 4, fontSize: 9 }}
        />
      </View>
      <MetaBlock invoice={invoice} doc={doc} palette={palette} layout={layout} />
    </View>
  )
}

function HeaderCentered({ invoice, doc, palette, layout }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 25 }}>
      <LogoImage invoice={invoice} doc={doc} />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: palette.primary, marginBottom: 6 }}>{doc.heading}</Text>
      <AddressBlock
        lines={getFromAddress(invoice)}
        nameStyle={{ fontSize: 12, color: palette.text, textAlign: 'center' }}
        detailStyle={{ color: palette.textLight, textAlign: 'center', fontSize: 9 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 20 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Text style={{ fontSize: 8, color: palette.textMuted }}>{doc.numberLabel}:</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Text style={{ fontSize: 8, color: palette.textMuted }}>{doc.dateLabel}:</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatDate(invoice.date)}</Text>
        </View>
        {doc.showDueDate && invoice.dueDate && (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text style={{ fontSize: 8, color: palette.textMuted }}>Due:</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatDate(invoice.dueDate)}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function HeaderLargeTitle({ invoice, doc, palette, layout }) {
  return (
    <View style={{ marginBottom: 30 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <LogoImage invoice={invoice} doc={doc} />
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: palette.primary, letterSpacing: 2 }}>{doc.heading}</Text>
          <View style={{ height: 3, backgroundColor: palette.primary, width: 60, marginTop: 4, marginBottom: 8 }} />
          <AddressBlock
            lines={getFromAddress(invoice)}
            nameStyle={{ fontSize: 11, color: palette.text, marginTop: 4 }}
            detailStyle={{ fontSize: 9, color: palette.textLight, marginTop: 2 }}
          />
        </View>
        <MetaBlock invoice={invoice} doc={doc} palette={palette} layout={layout} />
      </View>
    </View>
  )
}

function HeaderMinimal({ invoice, doc, palette, layout }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
      <View>
        <LogoImage invoice={invoice} doc={doc} size={70} />
        <Text style={{ fontSize: 20, color: palette.text }}>{doc.heading}</Text>
        <AddressBlock
          lines={getFromAddress(invoice)}
          nameStyle={{ marginTop: 6, fontSize: 11, color: palette.text }}
          detailStyle={{ color: palette.textLight, marginTop: 2, fontSize: 9 }}
        />
      </View>
      <View style={{ textAlign: 'right' }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: palette.text }}>#{invoice.invoiceNumber}</Text>
        <Text style={{ fontSize: 9, color: palette.textLight, marginTop: 2 }}>{doc.dateLabel}: {formatDate(invoice.date)}</Text>
        {doc.showDueDate && invoice.dueDate && (
          <Text style={{ fontSize: 9, color: palette.textLight, marginTop: 1 }}>Due: {formatDate(invoice.dueDate)}</Text>
        )}
      </View>
    </View>
  )
}

function HeaderDualColumn({ invoice, doc, palette, layout }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
      <View style={{ flex: 1 }}>
        <LogoImage invoice={invoice} doc={doc} />
        <AddressBlock
          lines={getFromAddress(invoice)}
          nameStyle={{ fontSize: 14, fontWeight: 'bold', color: palette.primary }}
          detailStyle={{ fontSize: 9, color: palette.textLight, marginTop: 2 }}
        />
      </View>
      <View style={{ textAlign: 'right' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: palette.primary }}>{doc.heading}</Text>
        <View style={{ marginTop: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
            <Text style={{ fontSize: 9, color: palette.textLight, marginRight: 10, width: 70, textAlign: 'right' }}>{doc.numberLabel}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text, width: 80 }}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
            <Text style={{ fontSize: 9, color: palette.textLight, marginRight: 10, width: 70, textAlign: 'right' }}>{doc.dateLabel}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text, width: 80 }}>{formatDate(invoice.date)}</Text>
          </View>
          {doc.showDueDate && invoice.dueDate && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
              <Text style={{ fontSize: 9, color: palette.textLight, marginRight: 10, width: 70, textAlign: 'right' }}>Due Date</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text, width: 80 }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

function HeaderSplitPanel({ invoice, doc, palette, layout }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 25 }}>
      <View style={{ flex: 1, backgroundColor: palette.primary, padding: 20 }}>
        <LogoImage invoice={invoice} doc={doc} size={60} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: palette.headerText }}>{doc.heading}</Text>
        <AddressBlock
          lines={getFromAddress(invoice)}
          nameStyle={{ fontSize: 10, color: palette.headerTextMuted, marginTop: 6 }}
          detailStyle={{ fontSize: 9, color: palette.headerTextMuted, marginTop: 1 }}
        />
      </View>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 8, color: palette.textMuted, textTransform: 'uppercase' }}>{doc.numberLabel}</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: palette.text }}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 8, color: palette.textMuted, textTransform: 'uppercase' }}>{doc.dateLabel}</Text>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: palette.text }}>{formatDate(invoice.date)}</Text>
        </View>
        {doc.showDueDate && invoice.dueDate && (
          <View>
            <Text style={{ fontSize: 8, color: palette.textMuted, textTransform: 'uppercase' }}>Due Date</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: palette.text }}>{formatDate(invoice.dueDate)}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ── Full-color header (banner, prestige) ──
function HeaderFullColor({ invoice, doc, palette, layout }) {
  const showBadge = layout.metaStyle === 'header-badge'
  return (
    <View style={{ backgroundColor: palette.primary, paddingVertical: 30, paddingHorizontal: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          {doc.showLogo && getLogoUrl(invoice) && (
            <Image src={getLogoUrl(invoice)} style={{ width: 85, height: 85, objectFit: 'contain', marginBottom: 6 }} />
          )}
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: palette.headerText }}>{doc.heading}</Text>
          <AddressBlock
            lines={getFromAddress(invoice)}
            nameStyle={{ fontSize: 9, color: palette.headerTextMuted, marginTop: 3 }}
            detailStyle={{ fontSize: 9, color: palette.headerTextMuted }}
          />
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 7, color: palette.headerTextMuted, textTransform: 'uppercase' }}>{doc.numberLabel}</Text>
          <Text style={{ fontSize: 11, color: palette.headerText, fontWeight: 'bold', marginBottom: 4 }}>{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 7, color: palette.headerTextMuted, textTransform: 'uppercase' }}>{doc.dateLabel}</Text>
          <Text style={{ fontSize: 11, color: palette.headerText, fontWeight: 'bold', marginBottom: 4 }}>{formatDate(invoice.date)}</Text>
          {doc.showDueDate && invoice.dueDate && (
            <>
              <Text style={{ fontSize: 7, color: palette.headerTextMuted, textTransform: 'uppercase' }}>Due Date</Text>
              <Text style={{ fontSize: 11, color: palette.headerText, fontWeight: 'bold', marginBottom: 4 }}>{formatDate(invoice.dueDate)}</Text>
            </>
          )}
          {showBadge && (
            <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 4, marginTop: 10 }}>
              <Text style={{ fontSize: 7, color: palette.primary, textTransform: 'uppercase', fontWeight: 'bold' }}>{doc.heading} Total</Text>
              <Text style={{ fontSize: 18, color: palette.primary, fontWeight: 'bold' }}>{formatCurrency(invoice.total)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

// ── Accent band header (executive) ──
function HeaderAccentBand({ invoice, doc, palette, layout }) {
  return (
    <View style={{ height: 80, backgroundColor: palette.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {doc.showLogo && getLogoUrl(invoice) && (
          <Image src={getLogoUrl(invoice)} style={{ width: 55, height: 55, objectFit: 'contain' }} />
        )}
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: palette.headerText, letterSpacing: 3 }}>{doc.heading}</Text>
      </View>
      <View style={{ textAlign: 'right' }}>
        <Text style={{ fontSize: 9, color: palette.primaryMuted, marginBottom: 2 }}>{doc.numberLabel} {invoice.invoiceNumber}</Text>
        <Text style={{ fontSize: 11, color: palette.headerText, fontWeight: 'bold' }}>{formatDate(invoice.date)}</Text>
        {doc.showDueDate && invoice.dueDate && <Text style={{ fontSize: 9, color: palette.primaryMuted }}>Due: {formatDate(invoice.dueDate)}</Text>}
      </View>
    </View>
  )
}

// Header dispatcher
function HeaderSection({ invoice, doc, palette, layout }) {
  switch (layout.headerStyle) {
    case 'full-color': return <HeaderFullColor invoice={invoice} doc={doc} palette={palette} layout={layout} />
    case 'accent-band': return <HeaderAccentBand invoice={invoice} doc={doc} palette={palette} layout={layout} />
    case 'centered': return <HeaderCentered invoice={invoice} doc={doc} palette={palette} layout={layout} />
    case 'large-title': return <HeaderLargeTitle invoice={invoice} doc={doc} palette={palette} layout={layout} />
    case 'minimal': return <HeaderMinimal invoice={invoice} doc={doc} palette={palette} layout={layout} />
    case 'dual-column': return <HeaderDualColumn invoice={invoice} doc={doc} palette={palette} layout={layout} />
    case 'split-panel': return <HeaderSplitPanel invoice={invoice} doc={doc} palette={palette} layout={layout} />
    default: return <HeaderStandard invoice={invoice} doc={doc} palette={palette} layout={layout} />
  }
}

// ============================================================================
// META BLOCK — invoice number, date, due date
// ============================================================================

function MetaBlock({ invoice, doc, palette, layout }) {
  switch (layout.metaStyle) {
    case 'badge-box':
      return (
        <View style={{ backgroundColor: palette.primaryLight, padding: 12, borderRadius: 4, minWidth: 160 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 8, color: palette.primaryDark, textTransform: 'uppercase', fontWeight: 'bold' }}>{doc.numberLabel}</Text>
            <Text style={{ fontSize: 10, color: palette.text, fontWeight: 'bold' }}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 8, color: palette.primaryDark, textTransform: 'uppercase', fontWeight: 'bold' }}>{doc.dateLabel}</Text>
            <Text style={{ fontSize: 10, color: palette.text, fontWeight: 'bold' }}>{formatDate(invoice.date)}</Text>
          </View>
          {doc.showDueDate && invoice.dueDate && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 8, color: palette.primaryDark, textTransform: 'uppercase', fontWeight: 'bold' }}>Due Date</Text>
              <Text style={{ fontSize: 10, color: palette.text, fontWeight: 'bold' }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>
      )

    case 'left-border-box':
      return (
        <View style={{ borderLeftWidth: 3, borderLeftColor: palette.primary, paddingLeft: 10 }}>
          <View style={{ marginBottom: 3 }}>
            <Text style={{ fontSize: 7, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{doc.numberLabel}</Text>
            <Text style={{ fontSize: 10, color: palette.text, fontWeight: 'bold' }}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ marginBottom: 3 }}>
            <Text style={{ fontSize: 7, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{doc.dateLabel}</Text>
            <Text style={{ fontSize: 10, color: palette.text, fontWeight: 'bold' }}>{formatDate(invoice.date)}</Text>
          </View>
          {doc.showDueDate && invoice.dueDate && (
            <View>
              <Text style={{ fontSize: 7, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Due Date</Text>
              <Text style={{ fontSize: 10, color: palette.text, fontWeight: 'bold' }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>
      )

    case 'label-value':
      return (
        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: palette.primary, textAlign: 'right' }}>{doc.heading}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
            <Text style={{ fontSize: 9, color: palette.textLight, marginRight: 10, width: 70, textAlign: 'right' }}>{doc.numberLabel}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text, width: 80 }}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
            <Text style={{ fontSize: 9, color: palette.textLight, marginRight: 10, width: 70, textAlign: 'right' }}>{doc.dateLabel}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text, width: 80 }}>{formatDate(invoice.date)}</Text>
          </View>
          {doc.showDueDate && invoice.dueDate && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
              <Text style={{ fontSize: 9, color: palette.textLight, marginRight: 10, width: 70, textAlign: 'right' }}>Due Date</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text, width: 80 }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>
      )

    case 'grid-box':
      return (
        <View style={{ borderWidth: 1, borderColor: palette.border, padding: 10, minWidth: 160 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 8, color: palette.textMuted, fontWeight: 'bold' }}>{doc.numberLabel}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 8, color: palette.textMuted, fontWeight: 'bold' }}>{doc.dateLabel}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatDate(invoice.date)}</Text>
          </View>
          {doc.showDueDate && invoice.dueDate && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 8, color: palette.textMuted, fontWeight: 'bold' }}>Due Date</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>
      )

    // inline (default) — simple text-only
    default:
      return (
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: palette.text }}>#{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 9, color: palette.textLight }}>{doc.dateLabel}: {formatDate(invoice.date)}</Text>
          {doc.showDueDate && invoice.dueDate && (
            <Text style={{ fontSize: 9, color: palette.textLight }}>Due: {formatDate(invoice.dueDate)}</Text>
          )}
        </View>
      )
  }
}

// ============================================================================
// ACCENT ELEMENTS — decorative elements based on layout
// ============================================================================

function AccentElementPre({ layout, palette }) {
  switch (layout.accentElement) {
    case 'sidebar-left':
      return <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: palette.primary }} />
    case 'top-stripe':
    case 'top-thin-bar':
      return <View style={{ height: layout.accentElement === 'top-stripe' ? 6 : 4, backgroundColor: palette.primary }} />
    case 'page-frame':
      return <View style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderWidth: 2, borderColor: palette.primary, borderRadius: 2 }} />
    case 'corner-block':
      return <View style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, backgroundColor: palette.primaryLight }} />
    case 'wave-top':
      return <View style={{ height: 12, backgroundColor: palette.primary, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, marginHorizontal: 40 }} />
    case 'ribbon-corner':
      return (
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <View style={{ width: 120, height: 30, backgroundColor: palette.primary, transform: 'rotate(-45deg)', position: 'absolute', top: 12, left: -30 }} />
        </View>
      )
    case 'dual-bars':
      return <View style={{ height: 4, backgroundColor: palette.primary }} />
    case 'double-line':
      return (
        <View>
          <View style={{ height: 2, backgroundColor: palette.primary, marginBottom: 2 }} />
          <View style={{ height: 1, backgroundColor: palette.primary }} />
        </View>
      )
    case 'ornamental-line':
      return (
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <View style={{ height: 2, backgroundColor: palette.primary, width: '60%' }} />
        </View>
      )
    default:
      return null
  }
}

function AccentElementPost({ layout, palette }) {
  if (layout.accentElement === 'dual-bars') {
    return <View style={{ height: 4, backgroundColor: palette.primary, position: 'absolute', bottom: 0, left: 0, right: 0 }} fixed />
  }
  return null
}

// Divider between header and address sections
function DividerElement({ layout, palette }) {
  switch (layout.accentElement) {
    case 'sidebar-left':
      return <View style={{ height: 2, backgroundColor: palette.primary, marginBottom: 20, opacity: 0.3 }} />
    case 'bottom-divider':
    case 'divider-line':
      return <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 15 }} />
    default:
      return null
  }
}

// ============================================================================
// ADDRESS SECTION
// ============================================================================

function AddressSection({ invoice, doc, palette, layout }) {
  const addressLabelStyle = { fontSize: 8, fontWeight: 'bold', color: palette.primary, textTransform: 'uppercase', marginBottom: 5 }
  const nameStyle = { fontSize: 10, fontWeight: 'bold', marginBottom: 2, color: palette.text }
  const detailStyle = { fontSize: 9, color: palette.textLight }

  const isGrid = layout.addressLayout === 'grid-boxes'
  const blockStyle = isGrid
    ? { flex: 1, borderWidth: 1, borderColor: palette.border, padding: 10 }
    : { flex: 1 }

  const showShip = layout.showShipTo && doc.showShipTo
  const isThreeCol = layout.addressLayout === 'three-column'

  if (layout.addressLayout === 'stacked') {
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: palette.textLight, textTransform: 'uppercase' }}>{doc.toLabel}</Text>
        <AddressBlock lines={getBillTo(invoice)} nameStyle={{ fontSize: 12, fontWeight: 'bold', color: palette.text }} detailStyle={{ color: palette.textLight, marginTop: 2 }} />
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', gap: isGrid ? 0 : 30, marginBottom: 20 }}>
      {(layout.headerStyle === 'accent-band' || isThreeCol) && (
        <View style={blockStyle}>
          <Text style={addressLabelStyle}>{doc.fromLabel}</Text>
          <AddressBlock lines={getFromAddress(invoice)} nameStyle={nameStyle} detailStyle={detailStyle} />
        </View>
      )}
      <View style={blockStyle}>
        <Text style={addressLabelStyle}>{doc.toLabel}</Text>
        <AddressBlock lines={getBillTo(invoice)} nameStyle={nameStyle} detailStyle={detailStyle} />
      </View>
      {showShip && (
        <View style={blockStyle}>
          <Text style={addressLabelStyle}>Ship To</Text>
          <AddressBlock lines={getShipTo(invoice)} nameStyle={nameStyle} detailStyle={detailStyle} />
        </View>
      )}
    </View>
  )
}

// ============================================================================
// TABLE SECTION
// ============================================================================

function TableSection({ invoice, doc, palette, layout }) {
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showSno = layout.showSerialNo
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)

  const colSno = { width: 25 }
  const colName = { flex: 3 }
  const colNameBasic = { flex: 4 }
  const colQty = { flex: 1, textAlign: 'center' }
  const colRate = { flex: 1, textAlign: 'right' }
  const colTax = { flex: 1, textAlign: 'center' }
  const colTotal = { flex: 1, textAlign: 'right' }

  // Table header styles vary by tableStyle
  const headerStyles = getTableHeaderStyles(layout.tableStyle, palette)
  const rowStyles = getTableRowStyles(layout.tableStyle, palette)

  return (
    <View style={{ marginTop: 5 }}>
      {/* Header Row */}
      <View style={headerStyles.container}>
        {showSno && <Text style={[headerStyles.text, colSno]}>#</Text>}
        <Text style={[headerStyles.text, isBasic ? colNameBasic : colName]}>{doc.descriptionCol}</Text>
        {!isBasic && <Text style={[headerStyles.text, colQty]}>{doc.qtyCol}</Text>}
        {!isBasic && <Text style={[headerStyles.text, colRate]}>{doc.unitPriceCol}</Text>}
        {showTaxCol && <Text style={[headerStyles.text, colTax]}>{doc.taxCol}</Text>}
        <Text style={[headerStyles.text, colTotal]}>{doc.amountCol}</Text>
      </View>
      {/* Data Rows */}
      {invoice.lineItems?.map((item, i) => {
        const isAlt = layout.altRowShading && i % 2 === 1
        return (
          <View key={i} style={[rowStyles.container, isAlt && { backgroundColor: palette.altRowBg }]}>
            {showSno && <Text style={colSno}>{i + 1}</Text>}
            <View style={isBasic ? colNameBasic : colName}>
              <Text>{item.name}</Text>
              {item.hsnCode && <Text style={{ fontSize: 6, color: palette.textLight || '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}
            </View>
            {!isBasic && <Text style={colQty}>{item.quantity}</Text>}
            {!isBasic && <Text style={colRate}>{formatCurrency(item.rate)}</Text>}
            {showTaxCol && <Text style={[colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
            <Text style={colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
          </View>
        )
      })}
    </View>
  )
}

function getTableHeaderStyles(tableStyle, palette) {
  switch (tableStyle) {
    case 'colored-header':
      return {
        container: { flexDirection: 'row', backgroundColor: palette.primary, padding: 8 },
        text: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
      }
    case 'tinted-header':
      return {
        container: { flexDirection: 'row', backgroundColor: palette.tableHeaderBg, padding: 8, borderBottomWidth: 1, borderBottomColor: palette.primary },
        text: { color: palette.tableHeaderText, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
      }
    case 'bordered-header':
      return {
        container: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: palette.primary, paddingBottom: 6, paddingHorizontal: 4 },
        text: { fontSize: 8, fontWeight: 'bold', color: palette.primary, textTransform: 'uppercase' },
      }
    case 'full-grid':
      return {
        container: { flexDirection: 'row', borderWidth: 1, borderColor: palette.primary, padding: 6, backgroundColor: palette.tableHeaderBg },
        text: { fontSize: 8, fontWeight: 'bold', color: palette.primary, textTransform: 'uppercase' },
      }
    case 'ledger':
      return {
        container: { flexDirection: 'row', borderBottomWidth: 2, borderTopWidth: 2, borderColor: palette.primary, paddingVertical: 6, paddingHorizontal: 4 },
        text: { fontSize: 8, fontWeight: 'bold', color: palette.primary, textTransform: 'uppercase' },
      }
    case 'minimal':
      return {
        container: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.border, paddingBottom: 6, paddingHorizontal: 4 },
        text: { fontSize: 8, fontWeight: 'bold', color: palette.textLight, textTransform: 'uppercase' },
      }
    // simple (default)
    default:
      return {
        container: { flexDirection: 'row', backgroundColor: palette.borderLight, padding: 8 },
        text: { fontSize: 8, fontWeight: 'bold', color: palette.text },
      }
  }
}

function getTableRowStyles(tableStyle, palette) {
  switch (tableStyle) {
    case 'full-grid':
      return {
        container: { flexDirection: 'row', padding: 6, borderWidth: 1, borderTopWidth: 0, borderColor: palette.border },
      }
    case 'ledger':
      return {
        container: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: palette.border },
      }
    default:
      return {
        container: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: palette.borderLight },
      }
  }
}

// ============================================================================
// TOTALS SECTION
// ============================================================================

function TotalsSection({ invoice, doc, palette, layout }) {
  const grandStyle = getGrandTotalStyle(layout.grandTotalStyle, palette)

  return (
    <View style={{ marginTop: 15, alignItems: 'flex-end' }}>
      {/* Subtotal */}
      <View style={{ flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 }}>
        <Text style={{ fontSize: 9, color: palette.textLight }}>Subtotal</Text>
        <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatCurrency(invoice.subtotal)}</Text>
      </View>
      {/* Discount */}
      {invoice.discountTotal > 0 && (
        <View style={{ flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 }}>
          <Text style={{ fontSize: 9, color: palette.textLight }}>Discount</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>-{formatCurrency(invoice.discountTotal)}</Text>
        </View>
      )}
      {/* Tax — expand tax group components into individual lines */}
      {doc.showTax && (() => {
        const { entries } = computeTaxBreakdown(invoice.lineItems)
        if (entries.length > 0) {
          return entries.map((entry, i) => (
            <View key={i} style={{ flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text style={{ fontSize: 9, color: palette.textLight }}>{entry.name} ({entry.rate}%)</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatCurrency(entry.amount)}</Text>
            </View>
          ))
        }
        // Fallback: invoice-level tax
        if (invoice.taxTotal > 0) {
          return (
            <View style={{ flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text style={{ fontSize: 9, color: palette.textLight }}>Tax{invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.text }}>{formatCurrency(invoice.taxTotal)}</Text>
            </View>
          )
        }
        return null
      })()}
      {/* Grand Total */}
      <View style={grandStyle.container}>
        <Text style={grandStyle.label}>TOTAL</Text>
        <Text style={grandStyle.value}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
      </View>
    </View>
  )
}

function getGrandTotalStyle(style, palette) {
  switch (style) {
    case 'color-border':
      return {
        container: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 2, borderTopColor: palette.primary, marginTop: 4 },
        label: { fontSize: 13, fontWeight: 'bold', color: palette.primary },
        value: { fontSize: 13, fontWeight: 'bold', color: palette.primary },
      }
    case 'color-bar':
      return {
        container: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 8, backgroundColor: palette.primary, paddingHorizontal: 10, marginTop: 6 },
        label: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
        value: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
      }
    case 'double-border':
      return {
        container: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 3, borderTopColor: palette.primary, marginTop: 4 },
        label: { fontSize: 13, fontWeight: 'bold', color: palette.primaryDark },
        value: { fontSize: 13, fontWeight: 'bold', color: palette.primaryDark },
      }
    case 'grid-total':
      return {
        container: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 6, borderWidth: 1, borderColor: palette.primary, paddingHorizontal: 8, marginTop: 4, backgroundColor: palette.primaryLight },
        label: { fontSize: 13, fontWeight: 'bold', color: palette.primaryDark },
        value: { fontSize: 13, fontWeight: 'bold', color: palette.primaryDark },
      }
    // border-top (default)
    default:
      return {
        container: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 2, borderTopColor: palette.text, marginTop: 8 },
        label: { fontSize: 14, fontWeight: 'bold', color: palette.text },
        value: { fontSize: 14, fontWeight: 'bold', color: palette.text },
      }
  }
}

// ============================================================================
// NOTES & TERMS
// ============================================================================

function NotesSection({ invoice, doc, palette, layout }) {
  const isBoxed = layout.notesStyle === 'boxed'

  return (
    <>
      {doc.showNotes && invoice.notes && (
        <View style={[{ marginTop: 20 }, isBoxed && { padding: 10, backgroundColor: palette.borderLight }]}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.primary, marginBottom: 4 }}>Notes</Text>
          <Text style={{ fontSize: 8, color: palette.textLight }}>{invoice.notes}</Text>
        </View>
      )}
      {doc.showTerms && invoice.terms && (
        <View style={[{ marginTop: 10 }, isBoxed && { padding: 10, backgroundColor: palette.borderLight }]}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: palette.primary, marginBottom: 4 }}>Terms & Conditions</Text>
          <Text style={{ fontSize: 8, color: palette.textLight }}>{invoice.terms}</Text>
        </View>
      )}
    </>
  )
}

// ============================================================================
// MAIN EXPORT: BaseInvoiceDocument
// ============================================================================

export default function BaseInvoiceDocument({ invoice, theme }) {
  const { layout, palette } = theme
  const doc = getDocLabels(invoice)

  // Headers that render outside the content padding (full-bleed)
  const isFullBleed = ['full-color', 'accent-band', 'split-panel'].includes(layout.headerStyle)
  const hasSidebar = layout.accentElement === 'sidebar-left'
  const contentPadding = hasSidebar
    ? { paddingTop: 40, paddingBottom: 40, paddingLeft: 46, paddingRight: 40 }
    : { padding: 40 }

  return (
    <Document>
      <Page size="A4" style={{ padding: 0, fontSize: 10, fontFamily: 'Helvetica' }}>
        {/* Pre-content accent elements */}
        <AccentElementPre layout={layout} palette={palette} />

        {/* Full-bleed header (rendered before content padding) */}
        {isFullBleed && <HeaderSection invoice={invoice} doc={doc} palette={palette} layout={layout} />}

        <View style={contentPadding}>
          {/* Non-full-bleed header */}
          {!isFullBleed && <HeaderSection invoice={invoice} doc={doc} palette={palette} layout={layout} />}

          {/* Divider between header and addresses */}
          <DividerElement layout={layout} palette={palette} />

          {/* Addresses */}
          <AddressSection invoice={invoice} doc={doc} palette={palette} layout={layout} />

          {/* Line items table */}
          <TableSection invoice={invoice} doc={doc} palette={palette} layout={layout} />

          {/* Totals */}
          <TotalsSection invoice={invoice} doc={doc} palette={palette} layout={layout} />

          {/* Notes & Terms */}
          <NotesSection invoice={invoice} doc={doc} palette={palette} layout={layout} />

          {/* Bank Details + Signature */}
          {doc.showSignature && <BankAndSignature invoice={invoice} color={palette.primary} />}
        </View>

        {/* Post-content accent elements */}
        <AccentElementPost layout={layout} palette={palette} />

        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// Also export helpers for use by legacy templates if needed
export { getDocLabels, formatCurrency, formatDate, getLogoUrl, getSignatureUrl, getFromAddress, getBillTo, getShipTo, AddressBlock, BrandedFooter, BankAndSignature }
