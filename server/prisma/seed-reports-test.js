import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Comprehensive seed for testing ALL report endpoints.
 * 
 * This script creates realistic data for one business covering:
 * 
 * 1.  GET /reports/summary          — Invoice summary (needs ISSUED + PAID invoices)
 * 2.  GET /reports/gst              — GST summary (needs taxMode, taxBreakup)
 * 3.  GET /reports/documents        — Document report (needs various doc types + statuses)
 * 4.  GET /reports/trend            — Monthly trend (needs invoices across multiple months)
 * 5.  GET /reports/gstr3b           — GSTR-3B (needs taxMode, taxBreakup, placeOfSupply)
 * 6.  GET /reports/gstr1/b2b        — B2B (customer with GSTIN + placeOfSupply)
 * 7.  GET /reports/gstr1/b2c-large  — B2C Large (IGST, no GSTIN, total > 2.5L)
 * 8.  GET /reports/gstr1/b2c-small  — B2C Small (no GSTIN, intrastate or small interstate)
 * 9.  GET /reports/gstr1/nil-exempt  — Nil/Exempt (taxMode=NONE or taxRate=0)
 * 10. GET /reports/gstr1/credit-notes — Credit Notes (documentType=credit_note)
 * 11. GET /reports/gstr1/doc-summary  — Doc Summary (needs CANCELLED invoices too)
 * 12. GET /reports/gstr1/hsn-summary  — HSN Summary (needs hsnCode on line items)
 * 13. GET /reports/sales-register      — Sales Register (chronological with tax breakup)
 * 14. GET /reports/customer-summary    — Customer Summary (multiple customers, PAID vs ISSUED)
 * 15. GET /reports/tax-rate-report     — Tax Rate Report (multiple tax rates: 5%, 12%, 18%, 28%)
 * 16. GET /reports/receivables         — Receivables Aging (ISSUED invoices with various due dates)
 * 17. GET /reports/customer-ledger/:id — Customer Ledger (multiple invoices for one customer)
 * 18. GET /reports/annual-summary      — Annual Summary (invoices across FY months)
 * 19. GET /reports/gstr9              — GSTR-9 (full FY data with B2B/B2C split)
 * 20. GET /reports/ca-package         — CA Package (combined — all above)
 */

async function main() {
  console.log('🧪 Seeding comprehensive report test data...\n')

  // ─── Find or create test user & business ────────────────────────────

  let testUser = await prisma.user.findUnique({ where: { phone: '7287820821' } })
  if (!testUser) {
    testUser = await prisma.user.create({
      data: { phone: '7287820821', otpVerifiedAt: new Date() }
    })
  }

  let business = await prisma.business.findFirst({
    where: { ownerUserId: testUser.id }
  })

  if (!business) {
    const proPlan = await prisma.plan.findUnique({ where: { name: 'pro' } })
    business = await prisma.business.create({
      data: {
        ownerUserId: testUser.id,
        name: 'Velisoju Tech Solutions',
        phone: '7287820821',
        stateCode: '36',          // Telangana
        gstEnabled: true,
        gstin: '36AABCU9603R1ZM',
        invoicePrefix: 'VTS-',
        nextInvoiceNumber: 200,
        planId: proPlan?.id || null,
        address: '123 Hitech City, Hyderabad, Telangana 500081',
        email: 'billing@velisoju.tech',
        bankName: 'HDFC Bank',
        accountNumber: '50100123456789',
        ifscCode: 'HDFC0001234',
        upiId: 'velisoju@upi',
        defaultTerms: 'Payment due within 30 days of invoice date.',
        defaultNotes: 'Thank you for your business!'
      }
    })
  } else {
    // Update business to ensure GST fields are set
    business = await prisma.business.update({
      where: { id: business.id },
      data: {
        stateCode: '36',
        gstEnabled: true,
        gstin: '36AABCU9603R1ZM',
        name: business.name || 'Velisoju Tech Solutions'
      }
    })
  }
  console.log('✅ Business:', business.name, '(state: 36-Telangana, GSTIN:', business.gstin + ')')

  // ─── Clean up old test invoices (only report-seed ones) ─────────────

  const existingReportInvoices = await prisma.invoice.findMany({
    where: {
      businessId: business.id,
      invoiceNumber: { startsWith: 'RPT-' }
    },
    select: { id: true }
  })
  if (existingReportInvoices.length > 0) {
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: { in: existingReportInvoices.map(i => i.id) } }
    })
    await prisma.invoice.deleteMany({
      where: { id: { in: existingReportInvoices.map(i => i.id) } }
    })
    console.log(`🗑️  Cleaned ${existingReportInvoices.length} old RPT-* invoices`)
  }

  // ─── Tax Rates ──────────────────────────────────────────────────────

  const taxRateData = [
    { name: 'GST 5%', rate: 5 },
    { name: 'GST 12%', rate: 12 },
    { name: 'GST 18%', rate: 18, isDefault: true },
    { name: 'GST 28%', rate: 28 },
  ]
  for (const tr of taxRateData) {
    const existing = await prisma.taxRate.findFirst({
      where: { businessId: business.id, rate: tr.rate }
    })
    if (!existing) {
      await prisma.taxRate.create({
        data: { businessId: business.id, ...tr }
      })
    }
  }
  console.log('✅ Tax rates: 5%, 12%, 18%, 28%')

  // ─── Products with HSN codes ────────────────────────────────────────

  const productDefs = [
    { name: 'Laptop', defaultRate: 55000, unit: 'nos', taxRate: 18, hsnCode: '8471' },
    { name: 'Printer', defaultRate: 12000, unit: 'nos', taxRate: 18, hsnCode: '8443' },
    { name: 'Office Chair', defaultRate: 8500, unit: 'nos', taxRate: 18, hsnCode: '9401' },
    { name: 'Software License', defaultRate: 25000, unit: 'license', taxRate: 18, hsnCode: '998314' },
    { name: 'Cloud Hosting', defaultRate: 5000, unit: 'month', taxRate: 18, hsnCode: '998315' },
    { name: 'Web Development', defaultRate: 75000, unit: 'project', taxRate: 18, hsnCode: '998314' },
    { name: 'Consulting', defaultRate: 3000, unit: 'hour', taxRate: 18, hsnCode: '998311' },
    { name: 'Rice (Basmati)', defaultRate: 120, unit: 'kg', taxRate: 5, hsnCode: '1006' },
    { name: 'Milk', defaultRate: 55, unit: 'litre', taxRate: 0, hsnCode: '0401' },
    { name: 'Books', defaultRate: 350, unit: 'nos', taxRate: 0, hsnCode: '4901' },
    { name: 'AC Unit', defaultRate: 42000, unit: 'nos', taxRate: 28, hsnCode: '8415' },
    { name: 'Car Parts', defaultRate: 15000, unit: 'set', taxRate: 28, hsnCode: '8708' },
    { name: 'Mobile Phone', defaultRate: 18000, unit: 'nos', taxRate: 12, hsnCode: '8517' },
    { name: 'Fertilizer', defaultRate: 800, unit: 'bag', taxRate: 5, hsnCode: '3105' },
  ]

  const products = {}
  for (const pd of productDefs) {
    let p = await prisma.productService.findFirst({
      where: { businessId: business.id, name: pd.name }
    })
    if (!p) {
      p = await prisma.productService.create({
        data: { businessId: business.id, ...pd }
      })
    } else {
      // Update hsnCode if missing
      if (!p.hsnCode) {
        p = await prisma.productService.update({
          where: { id: p.id },
          data: { hsnCode: pd.hsnCode, taxRate: pd.taxRate }
        })
      }
    }
    products[pd.name] = p
  }
  console.log('✅ Products with HSN codes:', Object.keys(products).length)

  // ─── Customers (mix of B2B with GSTIN and B2C without) ─────────────

  const customerDefs = [
    // B2B — same state (Telangana 36) → CGST+SGST
    { name: 'Infosys Technologies', phone: '9876543210', gstin: '36AABCI1234F1Z5', stateCode: '36', email: 'billing@infosys.com', address: 'Gachibowli, Hyderabad, Telangana' },
    { name: 'Tata Consultancy', phone: '9876543211', gstin: '36AABCT5678G1Z2', stateCode: '36', email: 'accounts@tcs.com', address: 'Madhapur, Hyderabad, Telangana' },
    // B2B — different state (Maharashtra 27) → IGST
    { name: 'Reliance Industries', phone: '9876543212', gstin: '27AABCR9012H1Z8', stateCode: '27', email: 'finance@reliance.com', address: 'BKC, Mumbai, Maharashtra' },
    // B2B — different state (Karnataka 29) → IGST
    { name: 'Wipro Ltd', phone: '9876543213', gstin: '29AABCW3456I1Z4', stateCode: '29', email: 'ap@wipro.com', address: 'Electronic City, Bangalore, Karnataka' },
    // B2C — same state (no GSTIN) → CGST+SGST
    { name: 'Ramesh Kumar', phone: '9988776655', stateCode: '36', address: 'Kukatpally, Hyderabad' },
    // B2C — different state (no GSTIN, for B2C Large) → IGST
    { name: 'Suresh Patel', phone: '9988776656', stateCode: '24', address: 'Ahmedabad, Gujarat' },
    // B2C — different state (no GSTIN, small amount) → B2C Small interstate
    { name: 'Priya Sharma', phone: '9988776657', stateCode: '07', address: 'Connaught Place, New Delhi' },
    // B2C — no state (walk-in)
    { name: 'Walk-in Customer', phone: '9988776658', stateCode: '36', address: 'Hyderabad' },
  ]

  const customers = {}
  for (const cd of customerDefs) {
    let c = await prisma.customer.findFirst({
      where: { businessId: business.id, name: cd.name }
    })
    if (!c) {
      c = await prisma.customer.create({
        data: { businessId: business.id, ...cd }
      })
    }
    customers[cd.name] = c
  }
  console.log('✅ Customers:', Object.keys(customers).length, '(4 B2B + 4 B2C)')

  // ─── Helper: create invoice ─────────────────────────────────────────

  let invoiceSeq = 1
  async function createInvoice(opts) {
    const num = `RPT-${String(invoiceSeq++).padStart(4, '0')}`

    const customer = opts.customer ? customers[opts.customer] : null
    const businessStateCode = business.stateCode // '36'
    const custStateCode = opts.placeOfSupply || customer?.stateCode || businessStateCode
    const isInterstate = custStateCode !== businessStateCode
    const taxRate = opts.taxRate ?? 18
    const taxMode = taxRate === 0 ? (opts.taxMode || 'NONE') : (isInterstate ? 'IGST' : 'CGST_SGST')

    // Build line items
    const lineItems = opts.lineItems.map(li => {
      const product = li.product ? products[li.product] : null
      const qty = li.quantity || 1
      const rate = li.rate || (product ? parseFloat(product.defaultRate) : 0)
      return {
        name: li.name || product?.name || 'Item',
        hsnCode: li.hsnCode || product?.hsnCode || null,
        quantity: qty,
        rate,
        lineTotal: qty * rate,
        productServiceId: product?.id || null
      }
    })

    const subtotal = lineItems.reduce((s, li) => s + li.lineTotal, 0)
    const discountTotal = opts.discount || 0
    const taxableAmount = subtotal - discountTotal
    const taxTotal = taxRate > 0 ? (taxableAmount * taxRate) / 100 : 0
    const total = taxableAmount + taxTotal

    // Tax breakup
    let taxBreakup = null
    if (taxRate > 0) {
      if (taxMode === 'IGST') {
        taxBreakup = {
          igst: taxRate,
          igstAmount: taxTotal
        }
      } else {
        const halfRate = taxRate / 2
        const halfAmount = taxTotal / 2
        taxBreakup = {
          cgst: halfRate,
          cgstAmount: halfAmount,
          sgst: halfRate,
          sgstAmount: halfAmount
        }
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        businessId: business.id,
        customerId: customer?.id || null,
        invoiceNumber: num,
        documentType: opts.documentType || 'invoice',
        date: new Date(opts.date),
        dueDate: opts.dueDate ? new Date(opts.dueDate) : null,
        status: opts.status || 'ISSUED',
        issuedAt: opts.status !== 'DRAFT' ? new Date(opts.date) : null,
        paidAt: opts.status === 'PAID' ? new Date(opts.paidAt || opts.date) : null,
        subtotal,
        discountTotal,
        taxRate: taxRate || null,
        taxTotal,
        total,
        taxMode: taxRate > 0 ? taxMode : (opts.taxMode || 'NONE'),
        placeOfSupplyStateCode: custStateCode,
        taxBreakup,
        originalInvoiceId: opts.originalInvoiceId || null,
        reverseCharge: opts.reverseCharge || false,
        notes: 'Thank you for your business!',
        terms: 'Payment due within 30 days.',
        lineItems: {
          create: lineItems
        }
      }
    })

    const statusIcon = { PAID: '💰', ISSUED: '📄', DRAFT: '📝', CANCELLED: '❌', VOID: '🚫' }
    console.log(`  ${statusIcon[opts.status] || '📄'} ${num} | ${opts.customer || 'No customer'} | ${opts.date} | ₹${total.toFixed(0)} | ${taxRate}% ${taxMode} | ${opts.status}`)
    return invoice
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE INVOICES — Covering every report scenario
  // ═══════════════════════════════════════════════════════════════════════

  console.log('\n📋 Creating invoices...\n')

  // ── Current month (Feb 2026) — Main test month for GSTR-1/3B ────────

  console.log('--- February 2026 (current month) ---')

  // B2B intrastate (CGST+SGST) — for GSTR-1 Table 4A
  const inv1 = await createInvoice({
    customer: 'Infosys Technologies', date: '2026-02-01', dueDate: '2026-03-03',
    status: 'PAID', paidAt: '2026-02-10', taxRate: 18,
    lineItems: [
      { product: 'Laptop', quantity: 5 },
      { product: 'Printer', quantity: 2 },
    ]
  })

  await createInvoice({
    customer: 'Tata Consultancy', date: '2026-02-03', dueDate: '2026-03-05',
    status: 'ISSUED', taxRate: 18,
    lineItems: [
      { product: 'Software License', quantity: 10 },
      { product: 'Cloud Hosting', quantity: 6 },
    ]
  })

  // B2B interstate (IGST) — for GSTR-1 Table 4A + GSTR-3B 3.2
  await createInvoice({
    customer: 'Reliance Industries', date: '2026-02-05', dueDate: '2026-03-07',
    status: 'PAID', paidAt: '2026-02-15', taxRate: 18,
    lineItems: [
      { product: 'Web Development', quantity: 1 },
      { product: 'Consulting', quantity: 20 },
    ]
  })

  await createInvoice({
    customer: 'Wipro Ltd', date: '2026-02-07', dueDate: '2026-03-09',
    status: 'ISSUED', taxRate: 12,
    lineItems: [
      { product: 'Mobile Phone', quantity: 15 },
    ]
  })

  // B2C intrastate (CGST+SGST) — for GSTR-1 Table 7 B2C Small
  await createInvoice({
    customer: 'Ramesh Kumar', date: '2026-02-08', dueDate: '2026-03-10',
    status: 'PAID', paidAt: '2026-02-08', taxRate: 18,
    lineItems: [
      { product: 'Office Chair', quantity: 4 },
      { product: 'Printer', quantity: 1 },
    ]
  })

  await createInvoice({
    customer: 'Walk-in Customer', date: '2026-02-09',
    status: 'PAID', paidAt: '2026-02-09', taxRate: 5,
    lineItems: [
      { product: 'Rice (Basmati)', quantity: 50 },
      { product: 'Fertilizer', quantity: 10 },
    ]
  })

  // B2C interstate LARGE (IGST, total > 2.5L) — for GSTR-1 Table 5A
  await createInvoice({
    customer: 'Suresh Patel', date: '2026-02-10', dueDate: '2026-03-12',
    status: 'ISSUED', taxRate: 28,
    lineItems: [
      { product: 'AC Unit', quantity: 8 },   // 8 × 42000 = 3,36,000 > 2.5L
    ]
  })

  // B2C interstate SMALL (IGST, total < 2.5L) — for GSTR-1 Table 7
  await createInvoice({
    customer: 'Priya Sharma', date: '2026-02-11', dueDate: '2026-03-13',
    status: 'ISSUED', taxRate: 18,
    lineItems: [
      { product: 'Laptop', quantity: 1 },     // 55000 < 2.5L
    ]
  })

  // Nil-rated / Exempt — for GSTR-1 Table 8, GSTR-3B 3.1(c)
  await createInvoice({
    customer: 'Ramesh Kumar', date: '2026-02-12',
    status: 'PAID', paidAt: '2026-02-12', taxRate: 0, taxMode: 'NONE',
    lineItems: [
      { product: 'Milk', quantity: 100 },
      { product: 'Books', quantity: 20 },
    ]
  })

  // Nil-rated B2B (registered, exempt)
  await createInvoice({
    customer: 'Infosys Technologies', date: '2026-02-13',
    status: 'ISSUED', taxRate: 0, taxMode: 'NONE',
    lineItems: [
      { product: 'Books', quantity: 50 },
    ]
  })

  // Credit note — for GSTR-1 Table 9B
  await createInvoice({
    customer: 'Infosys Technologies', date: '2026-02-14',
    status: 'ISSUED', taxRate: 18, documentType: 'credit_note',
    originalInvoiceId: inv1.id,
    lineItems: [
      { product: 'Laptop', quantity: 1 },  // Return 1 laptop
    ]
  })

  // CANCELLED invoice — for Doc Summary Table 13
  await createInvoice({
    customer: 'Tata Consultancy', date: '2026-02-15',
    status: 'CANCELLED', taxRate: 18,
    lineItems: [
      { product: 'Consulting', quantity: 5 },
    ]
  })

  // DRAFT invoice — should NOT appear in most reports
  await createInvoice({
    customer: 'Walk-in Customer', date: '2026-02-16',
    status: 'DRAFT', taxRate: 18,
    lineItems: [
      { product: 'Cloud Hosting', quantity: 3 },
    ]
  })

  // 28% tax rate invoice (intrastate) — for Tax Rate Report variety
  await createInvoice({
    customer: 'Ramesh Kumar', date: '2026-02-17', dueDate: '2026-03-19',
    status: 'ISSUED', taxRate: 28,
    lineItems: [
      { product: 'Car Parts', quantity: 2 },
    ]
  })

  // ── January 2026 ────────────────────────────────────────────────────

  console.log('\n--- January 2026 ---')

  await createInvoice({
    customer: 'Infosys Technologies', date: '2026-01-05', dueDate: '2026-02-04',
    status: 'PAID', paidAt: '2026-01-20', taxRate: 18,
    lineItems: [
      { product: 'Web Development', quantity: 1 },
    ]
  })

  await createInvoice({
    customer: 'Reliance Industries', date: '2026-01-10', dueDate: '2026-02-09',
    status: 'ISSUED', taxRate: 18,
    lineItems: [
      { product: 'Software License', quantity: 5 },
      { product: 'Consulting', quantity: 10 },
    ]
  })

  await createInvoice({
    customer: 'Ramesh Kumar', date: '2026-01-15', dueDate: '2026-02-14',
    status: 'ISSUED', taxRate: 5,
    lineItems: [
      { product: 'Rice (Basmati)', quantity: 100 },
    ]
  })

  await createInvoice({
    customer: 'Wipro Ltd', date: '2026-01-20', dueDate: '2026-02-19',
    status: 'PAID', paidAt: '2026-01-25', taxRate: 12,
    lineItems: [
      { product: 'Mobile Phone', quantity: 10 },
    ]
  })

  // ── December 2025 ───────────────────────────────────────────────────

  console.log('\n--- December 2025 ---')

  await createInvoice({
    customer: 'Tata Consultancy', date: '2025-12-01', dueDate: '2025-12-31',
    status: 'PAID', paidAt: '2025-12-20', taxRate: 18,
    lineItems: [
      { product: 'Laptop', quantity: 10 },
      { product: 'Office Chair', quantity: 10 },
    ]
  })

  await createInvoice({
    customer: 'Suresh Patel', date: '2025-12-10', dueDate: '2026-01-09',
    status: 'ISSUED', taxRate: 28,
    lineItems: [
      { product: 'AC Unit', quantity: 5 },
    ]
  })

  await createInvoice({
    customer: 'Priya Sharma', date: '2025-12-15',
    status: 'PAID', paidAt: '2025-12-15', taxRate: 0, taxMode: 'NONE',
    lineItems: [
      { product: 'Books', quantity: 30 },
    ]
  })

  // ── November 2025 ───────────────────────────────────────────────────

  console.log('\n--- November 2025 ---')

  await createInvoice({
    customer: 'Infosys Technologies', date: '2025-11-05', dueDate: '2025-12-05',
    status: 'PAID', paidAt: '2025-11-25', taxRate: 18,
    lineItems: [
      { product: 'Consulting', quantity: 40 },
    ]
  })

  await createInvoice({
    customer: 'Reliance Industries', date: '2025-11-15', dueDate: '2025-12-15',
    status: 'PAID', paidAt: '2025-12-01', taxRate: 18,
    lineItems: [
      { product: 'Web Development', quantity: 2 },
    ]
  })

  // ── October 2025 ────────────────────────────────────────────────────

  console.log('\n--- October 2025 ---')

  await createInvoice({
    customer: 'Wipro Ltd', date: '2025-10-10', dueDate: '2025-11-09',
    status: 'PAID', paidAt: '2025-10-30', taxRate: 12,
    lineItems: [
      { product: 'Mobile Phone', quantity: 20 },
    ]
  })

  await createInvoice({
    customer: 'Ramesh Kumar', date: '2025-10-20', dueDate: '2025-11-19',
    status: 'PAID', paidAt: '2025-10-25', taxRate: 18,
    lineItems: [
      { product: 'Printer', quantity: 3 },
    ]
  })

  // ── September 2025 ──────────────────────────────────────────────────

  console.log('\n--- September 2025 ---')

  await createInvoice({
    customer: 'Tata Consultancy', date: '2025-09-01', dueDate: '2025-10-01',
    status: 'PAID', paidAt: '2025-09-20', taxRate: 18,
    lineItems: [
      { product: 'Software License', quantity: 8 },
    ]
  })

  // ── August 2025 ─────────────────────────────────────────────────────

  console.log('\n--- August 2025 ---')

  await createInvoice({
    customer: 'Infosys Technologies', date: '2025-08-15', dueDate: '2025-09-14',
    status: 'PAID', paidAt: '2025-09-01', taxRate: 18,
    lineItems: [
      { product: 'Cloud Hosting', quantity: 12 },
    ]
  })

  // ── July 2025 ───────────────────────────────────────────────────────

  console.log('\n--- July 2025 ---')

  await createInvoice({
    customer: 'Reliance Industries', date: '2025-07-01', dueDate: '2025-07-31',
    status: 'PAID', paidAt: '2025-07-20', taxRate: 18,
    lineItems: [
      { product: 'Web Development', quantity: 1 },
      { product: 'Consulting', quantity: 15 },
    ]
  })

  // ── June 2025 ───────────────────────────────────────────────────────

  console.log('\n--- June 2025 ---')

  await createInvoice({
    customer: 'Wipro Ltd', date: '2025-06-10', dueDate: '2025-07-10',
    status: 'PAID', paidAt: '2025-06-28', taxRate: 12,
    lineItems: [
      { product: 'Mobile Phone', quantity: 25 },
    ]
  })

  // ── May 2025 ────────────────────────────────────────────────────────

  console.log('\n--- May 2025 ---')

  await createInvoice({
    customer: 'Suresh Patel', date: '2025-05-05', dueDate: '2025-06-04',
    status: 'PAID', paidAt: '2025-05-25', taxRate: 28,
    lineItems: [
      { product: 'AC Unit', quantity: 3 },
    ]
  })

  // ── April 2025 (start of FY 2025-26) ───────────────────────────────

  console.log('\n--- April 2025 (FY start) ---')

  await createInvoice({
    customer: 'Tata Consultancy', date: '2025-04-01', dueDate: '2025-05-01',
    status: 'PAID', paidAt: '2025-04-15', taxRate: 18,
    lineItems: [
      { product: 'Laptop', quantity: 3 },
      { product: 'Software License', quantity: 3 },
    ]
  })

  await createInvoice({
    customer: 'Ramesh Kumar', date: '2025-04-10',
    status: 'PAID', paidAt: '2025-04-10', taxRate: 5,
    lineItems: [
      { product: 'Rice (Basmati)', quantity: 200 },
      { product: 'Fertilizer', quantity: 20 },
    ]
  })

  // ── Receivables: ISSUED invoices with various overdue dates ─────────

  console.log('\n--- Receivables test invoices (ISSUED, various due dates) ---')

  // Not yet due
  await createInvoice({
    customer: 'Infosys Technologies', date: '2026-02-01', dueDate: '2026-03-15',
    status: 'ISSUED', taxRate: 18,
    lineItems: [
      { product: 'Consulting', quantity: 10 },
    ]
  })

  // 1-30 days overdue (due Jan 20, ~22 days overdue as of Feb 11)
  await createInvoice({
    customer: 'Reliance Industries', date: '2025-12-20', dueDate: '2026-01-20',
    status: 'ISSUED', taxRate: 18,
    lineItems: [
      { product: 'Software License', quantity: 3 },
    ]
  })

  // 31-60 days overdue (due Dec 15, ~58 days overdue)
  await createInvoice({
    customer: 'Wipro Ltd', date: '2025-11-15', dueDate: '2025-12-15',
    status: 'ISSUED', taxRate: 12,
    lineItems: [
      { product: 'Mobile Phone', quantity: 5 },
    ]
  })

  // 61-90 days overdue (due Nov 15, ~88 days overdue)
  await createInvoice({
    customer: 'Suresh Patel', date: '2025-10-15', dueDate: '2025-11-15',
    status: 'ISSUED', taxRate: 28,
    lineItems: [
      { product: 'AC Unit', quantity: 2 },
    ]
  })

  // 90+ days overdue (due Sep 1, ~163 days overdue)
  await createInvoice({
    customer: 'Priya Sharma', date: '2025-08-01', dueDate: '2025-09-01',
    status: 'ISSUED', taxRate: 18,
    lineItems: [
      { product: 'Laptop', quantity: 2 },
    ]
  })

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════

  const totalInvoices = await prisma.invoice.count({
    where: { businessId: business.id, invoiceNumber: { startsWith: 'RPT-' } }
  })
  const byStatus = await prisma.invoice.groupBy({
    by: ['status'],
    where: { businessId: business.id, invoiceNumber: { startsWith: 'RPT-' } },
    _count: true
  })
  const byTaxMode = await prisma.invoice.groupBy({
    by: ['taxMode'],
    where: { businessId: business.id, invoiceNumber: { startsWith: 'RPT-' } },
    _count: true
  })

  console.log('\n═══════════════════════════════════════════')
  console.log(`📊 Total RPT-* invoices: ${totalInvoices}`)
  console.log('   By status:', byStatus.map(s => `${s.status}=${s._count}`).join(', '))
  console.log('   By taxMode:', byTaxMode.map(s => `${s.taxMode || 'null'}=${s._count}`).join(', '))
  console.log('═══════════════════════════════════════════')

  console.log('\n✅ Report coverage checklist:')
  console.log('  ✓ Invoice Summary — ISSUED + PAID invoices')
  console.log('  ✓ GST Summary — taxMode CGST_SGST + IGST + NONE')
  console.log('  ✓ Document Report — invoice + credit_note + CANCELLED')
  console.log('  ✓ Monthly Trend — Apr 2025 → Feb 2026 (11 months)')
  console.log('  ✓ GSTR-3B — taxable + zero-rated + nil/exempt + interstate unregistered')
  console.log('  ✓ GSTR-1 B2B — 4 registered customers with GSTIN (intra + inter)')
  console.log('  ✓ GSTR-1 B2C Large — 1 interstate unregistered > ₹2.5L')
  console.log('  ✓ GSTR-1 B2C Small — intrastate + small interstate unregistered')
  console.log('  ✓ GSTR-1 Nil/Exempt — taxRate=0 + taxMode=NONE (registered + unregistered)')
  console.log('  ✓ GSTR-1 Credit Notes — 1 credit note linked to original invoice')
  console.log('  ✓ GSTR-1 Doc Summary — invoices + credit_note + CANCELLED')
  console.log('  ✓ GSTR-1 HSN Summary — line items with hsnCode (8471, 8443, 998314, etc.)')
  console.log('  ✓ Sales Register — all statuses with tax breakup')
  console.log('  ✓ Customer Summary — 8 customers with varying PAID/ISSUED')
  console.log('  ✓ Tax Rate Report — 5%, 12%, 18%, 28% slabs')
  console.log('  ✓ Receivables Aging — not due + 1-30 + 31-60 + 61-90 + 90+ days')
  console.log('  ✓ Customer Ledger — multiple invoices per customer')
  console.log('  ✓ Annual Summary — FY 2025-26 (Apr 2025 → Feb 2026)')
  console.log('  ✓ GSTR-9 — full FY with B2B/B2C/exempt split')
  console.log('  ✓ CA Package — all of the above combined')

  console.log('\n🎉 Report test data seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
