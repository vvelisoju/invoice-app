import { prisma } from '../../common/prisma.js'
import { NotFoundError } from '../../common/errors.js'

/**
 * Get the next subscription invoice number from platform settings.
 * Format: IB-SUB-YYYY-NNNN
 */
async function getNextInvoiceNumber() {
  const year = new Date().getFullYear()
  const key = `sub_invoice_next_number_${year}`

  // Read current counter (or create if missing)
  let setting = await prisma.platformSetting.findUnique({ where: { key } })

  let current
  if (!setting) {
    setting = await prisma.platformSetting.create({
      data: { key, value: 1 }
    })
    current = 1
  } else if (typeof setting.value !== 'number') {
    // Counter was corrupted (e.g. stored as JSON object) — repair it
    // by counting existing invoices for this year
    const existingCount = await prisma.subscriptionInvoice.count({
      where: {
        invoiceNumber: { startsWith: `${year}` }
      }
    })
    // Also try with prefix
    const prefixSetting = await prisma.platformSetting.findUnique({
      where: { key: 'sub_invoice_prefix' }
    })
    const pfx = prefixSetting?.value || 'IB'
    const prefixedCount = await prisma.subscriptionInvoice.count({
      where: {
        invoiceNumber: { startsWith: `${pfx}-${year}` }
      }
    })
    current = Math.max(existingCount, prefixedCount, 1) + 1
    // Persist the repaired value
    await prisma.platformSetting.update({
      where: { key },
      data: { value: current }
    })
  } else {
    current = setting.value
  }

  // Increment counter for next call
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
 * Also repairs missing invoices for paid subscriptions that failed invoice generation.
 */
export async function getBusinessSubscriptionInvoices(businessId) {
  // Find all subscriptions with a completed payment (regardless of current status)
  const paidSubscriptions = await prisma.subscription.findMany({
    where: {
      businessId,
      razorpayPaymentId: { not: null }
    }
  })

  const existingInvoices = await prisma.subscriptionInvoice.findMany({
    where: { businessId },
    select: { subscriptionId: true, razorpayPaymentId: true }
  })

  const invoicedSubIds = new Set(existingInvoices.map(i => i.subscriptionId).filter(Boolean))
  const invoicedPaymentIds = new Set(existingInvoices.map(i => i.razorpayPaymentId).filter(Boolean))

  for (const sub of paidSubscriptions) {
    // Skip if invoice already exists for this subscription or payment
    if (invoicedSubIds.has(sub.id) || invoicedPaymentIds.has(sub.razorpayPaymentId)) continue

    // Generate the missing invoice
    try {
      const plan = await prisma.plan.findUnique({ where: { id: sub.planId } })
      const isYearly = sub.renewAt && sub.startDate &&
        (new Date(sub.renewAt).getTime() - new Date(sub.startDate).getTime()) > 180 * 86400000

      await generateSubscriptionInvoice({
        businessId,
        subscriptionId: sub.id,
        planId: sub.planId,
        planName: plan?.displayName || plan?.name || 'Plan',
        billingPeriod: isYearly ? 'yearly' : 'monthly',
        amount: sub.amount,
        razorpayOrderId: sub.razorpayOrderId,
        razorpayPaymentId: sub.razorpayPaymentId,
        periodStart: sub.startDate,
        periodEnd: sub.renewAt,
      })
      console.log(`[Billing] Repaired missing invoice for subscription ${sub.id}`)
    } catch (err) {
      console.error(`[Billing] Failed to repair invoice for subscription ${sub.id}:`, err.message)
    }
  }

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
