import { prisma } from '../../common/prisma.js'
import { NotFoundError } from '../../common/errors.js'

/**
 * Get the next subscription invoice number from platform settings.
 * Format: IB-SUB-YYYY-NNNN
 */
async function getNextInvoiceNumber() {
  const year = new Date().getFullYear()
  const key = `sub_invoice_next_number_${year}`

  // Atomically increment the counter
  const setting = await prisma.platformSetting.upsert({
    where: { key },
    update: {
      value: { increment: true }
    },
    create: {
      key,
      value: 1
    }
  })

  // upsert with increment doesn't work on Json fields, so do it manually
  const current = typeof setting.value === 'number' ? setting.value : 1
  const next = current + 1

  await prisma.platformSetting.update({
    where: { key },
    data: { value: next }
  })

  // Get prefix from settings
  const prefixSetting = await prisma.platformSetting.findUnique({
    where: { key: 'sub_invoice_prefix' }
  })
  const prefix = prefixSetting?.value || 'IB'

  return `${prefix}-${year}-${String(current).padStart(4, '0')}`
}

/**
 * Get platform billing profile from settings.
 */
export async function getBillingProfile() {
  const keys = [
    'billing_business_name',
    'billing_address',
    'billing_gstin',
    'billing_pan',
    'billing_state_code',
    'billing_email',
    'billing_phone',
    'billing_bank_name',
    'billing_account_number',
    'billing_ifsc_code',
    'billing_upi_id',
    'billing_signature_name',
    'billing_logo_url',
    'billing_signature_url',
    'billing_default_notes',
    'billing_default_terms',
    'billing_hsn_sac',
    'billing_tax_rate',
    'sub_invoice_prefix',
  ]

  const settings = await prisma.platformSetting.findMany({
    where: { key: { in: keys } }
  })

  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))

  return {
    name: map.billing_business_name || 'Invoice Baba',
    address: map.billing_address || '',
    gstin: map.billing_gstin || '',
    pan: map.billing_pan || '',
    stateCode: map.billing_state_code || '',
    email: map.billing_email || '',
    phone: map.billing_phone || '',
    bankName: map.billing_bank_name || '',
    accountNumber: map.billing_account_number || '',
    ifscCode: map.billing_ifsc_code || '',
    upiId: map.billing_upi_id || '',
    signatureName: map.billing_signature_name || '',
    logoUrl: map.billing_logo_url || '',
    signatureUrl: map.billing_signature_url || '',
    defaultNotes: map.billing_default_notes || '',
    defaultTerms: map.billing_default_terms || '',
    hsnSac: map.billing_hsn_sac || '998431',
    taxRate: map.billing_tax_rate != null ? Number(map.billing_tax_rate) : 18,
    invoicePrefix: map.sub_invoice_prefix || 'IB',
  }
}

/**
 * Generate a subscription invoice after a successful payment.
 */
export async function generateSubscriptionInvoice({
  businessId,
  subscriptionId,
  planId,
  planName,
  billingPeriod,
  amount,
  razorpayOrderId,
  razorpayPaymentId,
  periodStart,
  periodEnd,
}) {
  const [business, billingProfile] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { phone: true, email: true, name: true } } }
    }),
    getBillingProfile()
  ])

  if (!business) throw new NotFoundError('Business not found')

  const invoiceNumber = await getNextInvoiceNumber()

  // Determine tax mode based on state codes
  const sellerState = billingProfile.stateCode
  const buyerState = business.stateCode
  const taxRate = billingProfile.taxRate || 18
  const subtotal = Number(amount)

  let taxMode = 'NONE'
  let taxBreakup = null
  let taxTotal = 0

  if (sellerState && buyerState && taxRate > 0) {
    if (sellerState === buyerState) {
      // Intra-state: CGST + SGST
      taxMode = 'CGST_SGST'
      const halfRate = taxRate / 2
      const halfTax = Math.round((subtotal * halfRate) / 100 * 100) / 100
      taxBreakup = {
        cgstRate: halfRate,
        cgstAmount: halfTax,
        sgstRate: halfRate,
        sgstAmount: halfTax,
      }
      taxTotal = halfTax * 2
    } else {
      // Inter-state: IGST
      taxMode = 'IGST'
      const igstAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100
      taxBreakup = {
        igstRate: taxRate,
        igstAmount,
      }
      taxTotal = igstAmount
    }
  }

  const total = subtotal + taxTotal

  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      invoiceNumber,
      businessId,
      subscriptionId,
      planId,

      sellerName: billingProfile.name,
      sellerGstin: billingProfile.gstin || null,
      sellerAddress: billingProfile.address || null,

      buyerName: business.name,
      buyerGstin: business.gstin || null,
      buyerAddress: business.address || null,
      buyerEmail: business.email || business.owner?.email || null,
      buyerPhone: business.phone || business.owner?.phone || null,

      billingPeriod,
      periodStart: periodStart || new Date(),
      periodEnd: periodEnd || new Date(),

      subtotal,
      taxRate: taxRate > 0 ? taxRate : null,
      taxMode,
      taxBreakup,
      taxTotal,
      total,
      currency: 'INR',

      status: 'PAID',
      razorpayOrderId,
      razorpayPaymentId,
      paidAt: new Date(),
    }
  })

  return invoice
}

/**
 * List all subscription invoices (admin view).
 */
export async function listSubscriptionInvoices(filters = {}) {
  const { businessId, status, limit = 50, offset = 0 } = filters

  const where = {
    ...(businessId && { businessId }),
    ...(status && { status }),
  }

  const [invoices, total] = await Promise.all([
    prisma.subscriptionInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        business: {
          select: { id: true, name: true, gstin: true }
        }
      }
    }),
    prisma.subscriptionInvoice.count({ where })
  ])

  return { invoices, total, limit: parseInt(limit), offset: parseInt(offset) }
}

/**
 * Get subscription invoices for a specific business (user view).
 */
export async function getBusinessSubscriptionInvoices(businessId) {
  return prisma.subscriptionInvoice.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

/**
 * Get a single subscription invoice by ID.
 */
export async function getSubscriptionInvoice(invoiceId) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      business: {
        select: { id: true, name: true, gstin: true, address: true, stateCode: true }
      }
    }
  })

  if (!invoice) throw new NotFoundError('Subscription invoice not found')

  // Attach billing profile for PDF generation
  const billingProfile = await getBillingProfile()

  return { ...invoice, billingProfile }
}
