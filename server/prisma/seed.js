import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default plans
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Free Plan',
      description: 'Perfect for getting started',
      entitlements: {
        monthlyInvoicesLimit: 20,
        customersLimit: 50,
        productsLimit: 50,
        templatesLimit: 1,
        advancedTemplateCustomization: false,
        csvExport: false
      },
      active: true
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro Plan',
      description: 'For growing businesses',
      entitlements: {
        monthlyInvoicesLimit: 500,
        customersLimit: 1000,
        productsLimit: 500,
        templatesLimit: 5,
        advancedTemplateCustomization: true,
        csvExport: true
      },
      priceMonthly: 499.00,
      priceYearly: 4990.00,
      active: true
    }
  })

  console.log('✅ Created plans:', { freePlan: freePlan.name, proPlan: proPlan.name })

  // Create base templates
  const cleanTemplate = await prisma.baseTemplate.upsert({
    where: { name: 'clean' },
    update: {},
    create: {
      name: 'clean',
      description: 'Clean and minimal invoice template',
      configSchema: {
        supports: [
          'logo',
          'logoPosition',
          'primaryColor',
          'accentColor',
          'headerAlignment',
          'spacingDensity',
          'showBusinessGSTIN',
          'showCustomerGSTIN',
          'showPlaceOfSupply',
          'showDueDate',
          'showNotes',
          'showTerms',
          'showSignature',
          'showBankDetails',
          'showDiscount',
          'showTax',
          'invoiceTitle',
          'footerMessage'
        ],
        defaults: {
          logoPosition: 'left',
          primaryColor: '#1F2937',
          accentColor: '#3B82F6',
          headerAlignment: 'left',
          spacingDensity: 'regular',
          showBusinessGSTIN: true,
          showCustomerGSTIN: true,
          showPlaceOfSupply: true,
          showDueDate: true,
          showNotes: true,
          showTerms: true,
          showSignature: false,
          showBankDetails: false,
          showDiscount: true,
          showTax: true,
          invoiceTitle: 'Tax Invoice'
        }
      },
      renderConfig: {
        componentId: 'clean-template-v1',
        layout: {
          type: 'single-column',
          sections: ['header', 'business', 'customer', 'items', 'totals', 'gst', 'notes', 'footer']
        },
        defaultStyles: {
          fonts: {
            primary: 'Inter, sans-serif',
            heading: 'Inter, sans-serif'
          },
          spacing: {
            section: '24px',
            item: '8px'
          }
        },
        printSettings: {
          pageSize: 'A4',
          margins: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          }
        }
      },
      active: true
    }
  })

  console.log('✅ Created base template:', cleanTemplate.name)

  // =========================================================================
  // SAMPLE DATA — Test user, business, customers, invoices
  // =========================================================================

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { phone: '7287820821' },
    update: {},
    create: {
      phone: '7287820821',
      otpVerifiedAt: new Date()
    }
  })
  console.log('✅ Created test user:', testUser.phone)

  // Create business for the test user
  let business = await prisma.business.findFirst({
    where: { ownerUserId: testUser.id }
  })
  if (!business) {
    business = await prisma.business.create({
      data: {
        ownerUserId: testUser.id,
        name: 'Business 0821',
        phone: '7287820821',
        stateCode: '36',
        gstEnabled: true,
        gstin: '36AABCU9603R1ZM',
        invoicePrefix: 'INV-',
        nextInvoiceNumber: 106,
        planId: proPlan.id,
        defaultTerms: 'Payment due within 30 days.',
        defaultNotes: 'Thank you for your business!'
      }
    })
  }
  console.log('✅ Business:', business.name)

  // Create customers
  const customers = []
  const customerData = [
    { name: 'Anvesh Group', phone: '9876543210', gstin: '98989898989', stateCode: '36', email: 'anvesh@group.com', address: 'Hyderabad, Telangana' },
    { name: 'Priya Enterprises', phone: '9123456789', gstin: '36BBBCE1234F1Z5', stateCode: '36', email: 'priya@enterprises.in', address: 'Secunderabad, Telangana' },
    { name: 'Ravi Traders', phone: '9988776655', stateCode: '27', email: 'ravi@traders.com', address: 'Mumbai, Maharashtra' },
    { name: 'Lakshmi Stores', phone: '8877665544', gstin: '36CCCLS5678G1Z2', stateCode: '36', address: 'Warangal, Telangana' },
    { name: 'Sai Constructions', phone: '7766554433', stateCode: '36', email: 'sai@constructions.in', address: 'Karimnagar, Telangana' },
  ]

  for (const cd of customerData) {
    const existing = await prisma.customer.findFirst({
      where: { businessId: business.id, name: cd.name }
    })
    if (existing) {
      customers.push(existing)
    } else {
      const c = await prisma.customer.create({
        data: { businessId: business.id, ...cd }
      })
      customers.push(c)
    }
  }
  console.log('✅ Created', customers.length, 'customers')

  // Create invoices with various statuses
  const invoiceData = [
    {
      invoiceNumber: 'INV-0100',
      customerId: customers[0].id,
      date: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
      status: 'PAID',
      issuedAt: new Date('2026-02-01'),
      taxRate: 18,
      lineItems: [
        { name: 'Web Development', quantity: 1, rate: 100 },
        { name: 'Hosting (Annual)', quantity: 1, rate: 23 },
      ]
    },
    {
      invoiceNumber: 'INV-0101',
      customerId: customers[0].id,
      date: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
      status: 'ISSUED',
      issuedAt: new Date('2026-02-01'),
      taxRate: 18,
      lineItems: [
        { name: 'SEO Optimization', quantity: 1, rate: 500 },
        { name: 'Content Writing (10 pages)', quantity: 10, rate: 68 },
      ]
    },
    {
      invoiceNumber: 'INV-0102',
      customerId: customers[1].id,
      date: new Date('2026-01-25'),
      dueDate: new Date('2026-02-25'),
      status: 'ISSUED',
      issuedAt: new Date('2026-01-25'),
      taxRate: 0,
      lineItems: [
        { name: 'Logo Design', quantity: 1, rate: 3500 },
        { name: 'Brand Guidelines', quantity: 1, rate: 2000 },
      ]
    },
    {
      invoiceNumber: 'INV-0103',
      customerId: customers[2].id,
      date: new Date('2026-02-05'),
      status: 'DRAFT',
      taxRate: 18,
      lineItems: [
        { name: 'Consulting (hours)', quantity: 5, rate: 1200 },
      ]
    },
    {
      invoiceNumber: 'INV-0104',
      customerId: customers[3].id,
      date: new Date('2026-02-03'),
      dueDate: new Date('2026-03-03'),
      status: 'PAID',
      issuedAt: new Date('2026-02-03'),
      taxRate: 18,
      lineItems: [
        { name: 'Plumbing Materials', quantity: 50, rate: 120 },
        { name: 'Labour Charges', quantity: 3, rate: 800 },
      ]
    },
    {
      invoiceNumber: 'INV-0105',
      customerId: customers[4].id,
      date: new Date('2026-02-06'),
      dueDate: new Date('2026-03-06'),
      status: 'ISSUED',
      issuedAt: new Date('2026-02-06'),
      taxRate: 18,
      lineItems: [
        { name: 'Cement (bags)', quantity: 100, rate: 380 },
        { name: 'Steel Rods (kg)', quantity: 200, rate: 65 },
        { name: 'Transport', quantity: 1, rate: 2500 },
      ]
    },
  ]

  for (const inv of invoiceData) {
    const existing = await prisma.invoice.findFirst({
      where: { businessId: business.id, invoiceNumber: inv.invoiceNumber }
    })
    if (existing) {
      console.log('  ⏭️  Invoice', inv.invoiceNumber, 'already exists, skipping')
      continue
    }

    const subtotal = inv.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0)
    const discountTotal = 0
    const taxRate = inv.taxRate || 0
    const taxTotal = taxRate > 0 ? ((subtotal - discountTotal) * taxRate) / 100 : 0
    const total = subtotal - discountTotal + taxTotal

    await prisma.invoice.create({
      data: {
        businessId: business.id,
        customerId: inv.customerId,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        dueDate: inv.dueDate || null,
        status: inv.status,
        issuedAt: inv.issuedAt || null,
        subtotal,
        discountTotal,
        taxRate: taxRate || null,
        taxTotal,
        total,
        notes: 'Thank you for your business!',
        terms: 'Payment due within 30 days.',
        lineItems: {
          create: inv.lineItems.map((li) => ({
            name: li.name,
            quantity: li.quantity,
            rate: li.rate,
            lineTotal: li.quantity * li.rate
          }))
        }
      }
    })
    console.log('  ✅ Invoice', inv.invoiceNumber, '—', inv.status, '— ₹' + total.toFixed(2))
  }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
