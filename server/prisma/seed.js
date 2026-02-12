import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default plans
  const freePlanData = {
    displayName: 'Free',
    description: 'Get started with basic invoicing',
    entitlements: {
      monthlyInvoicesLimit: 10,
      customersLimit: 20,
      productsLimit: 20,
      templatesLimit: 1
    },
    priceMonthly: null,
    priceYearly: null,
    active: true
  }
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: freePlanData,
    create: { name: 'free', ...freePlanData }
  })

  const starterPlanData = {
    displayName: 'Starter',
    description: 'For small businesses',
    entitlements: {
      monthlyInvoicesLimit: 200,
      customersLimit: 500,
      productsLimit: 200,
      templatesLimit: 3
    },
    priceMonthly: 149.00,
    priceYearly: 1188.00,
    active: true
  }
  const starterPlan = await prisma.plan.upsert({
    where: { name: 'starter' },
    update: starterPlanData,
    create: { name: 'starter', ...starterPlanData }
  })

  const proPlanData = {
    displayName: 'Pro',
    description: 'Unlimited invoicing for growing businesses',
    entitlements: {
      monthlyInvoicesLimit: 999999,
      customersLimit: 999999,
      productsLimit: 999999,
      templatesLimit: 10
    },
    priceMonthly: 449.00,
    priceYearly: 3588.00,
    active: true
  }
  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: proPlanData,
    create: { name: 'pro', ...proPlanData }
  })

  console.log('✅ Created plans:', { free: freePlan.name, starter: starterPlan.name, pro: proPlan.name })

  // =========================================================================
  // BASE TEMPLATES — 100 templates from 20 layouts × 5 palettes + 6 legacy
  // =========================================================================

  // Shared configSchema for all templates
  const sharedConfigSchema = {
    supports: [
      'logo', 'logoPosition', 'primaryColor', 'accentColor',
      'headerAlignment', 'spacingDensity',
      'showBusinessGSTIN', 'showCustomerGSTIN', 'showPlaceOfSupply',
      'showDueDate', 'showNotes', 'showTerms', 'showSignature',
      'showBankDetails', 'showDiscount', 'showTax', 'invoiceTitle', 'footerMessage'
    ],
    defaults: {
      logoPosition: 'left',
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
  }

  // 5 color palettes
  const palettes = {
    charcoal: { key: 'charcoal', family: 'black', primary: '#374151' },
    crimson:  { key: 'crimson',  family: 'red',   primary: '#DC2626' },
    ocean:    { key: 'ocean',    family: 'blue',  primary: '#2563EB' },
    forest:   { key: 'forest',   family: 'green', primary: '#047857' },
    royal:    { key: 'royal',    family: 'purple', primary: '#7C3AED' },
  }

  // 20 layout families
  const layouts = [
    { key: 'clean',     name: 'Clean',     category: 'minimal' },
    { key: 'sidebar',   name: 'Sidebar',   category: 'modern' },
    { key: 'stripe',    name: 'Stripe',    category: 'classic' },
    { key: 'banner',    name: 'Banner',    category: 'modern' },
    { key: 'executive', name: 'Executive', category: 'professional' },
    { key: 'compact',   name: 'Compact',   category: 'minimal' },
    { key: 'elegant',   name: 'Elegant',   category: 'professional' },
    { key: 'bold',      name: 'Bold',      category: 'creative' },
    { key: 'split',     name: 'Split',     category: 'modern' },
    { key: 'grid',      name: 'Grid',      category: 'classic' },
    { key: 'ribbon',    name: 'Ribbon',    category: 'creative' },
    { key: 'ledger',    name: 'Ledger',    category: 'classic' },
    { key: 'minimal',   name: 'Minimal',   category: 'minimal' },
    { key: 'prestige',  name: 'Prestige',  category: 'professional' },
    { key: 'dual',      name: 'Dual',      category: 'professional' },
    { key: 'wave',      name: 'Wave',      category: 'creative' },
    { key: 'corner',    name: 'Corner',    category: 'modern' },
    { key: 'frame',     name: 'Frame',     category: 'classic' },
    { key: 'accent',    name: 'Accent',    category: 'modern' },
    { key: 'classic',   name: 'Classic',   category: 'classic' },
  ]

  const paletteDisplayNames = {
    charcoal: 'Charcoal', crimson: 'Crimson', ocean: 'Ocean', forest: 'Forest', royal: 'Royal'
  }

  // Generate all 100 themed template definitions
  const themedTemplates = []
  for (const layout of layouts) {
    for (const [palKey, pal] of Object.entries(palettes)) {
      const id = `${layout.key}-${palKey}`
      themedTemplates.push({
        name: id,
        description: `${layout.name} layout with ${paletteDisplayNames[palKey]} color scheme`,
        configSchema: {
          ...sharedConfigSchema,
          defaults: { ...sharedConfigSchema.defaults, primaryColor: pal.primary }
        },
        renderConfig: {
          themeId: id,
          layoutKey: layout.key,
          paletteKey: palKey,
          category: layout.category,
          colorFamily: pal.family,
        },
        active: true,
      })
    }
  }

  // Legacy 6 templates (kept for backward compatibility)
  const legacyTemplates = [
    {
      name: 'clean',
      description: 'Clean and minimal invoice template',
      configSchema: { ...sharedConfigSchema, defaults: { ...sharedConfigSchema.defaults, primaryColor: '#1F2937' } },
      renderConfig: { componentId: 'clean-template-v1', themeId: 'clean-charcoal', layoutKey: 'clean', paletteKey: 'charcoal' },
      active: true,
    },
    {
      name: 'modern-red',
      description: 'Bold red accents with a modern sidebar layout',
      configSchema: { ...sharedConfigSchema, defaults: { ...sharedConfigSchema.defaults, primaryColor: '#DC2626' } },
      renderConfig: { componentId: 'modern-red', themeId: 'sidebar-crimson', layoutKey: 'sidebar', paletteKey: 'crimson' },
      active: true,
    },
    {
      name: 'classic-red',
      description: 'Traditional invoice layout with green header stripe',
      configSchema: { ...sharedConfigSchema, defaults: { ...sharedConfigSchema.defaults, primaryColor: '#047857' } },
      renderConfig: { componentId: 'classic-red', themeId: 'stripe-forest', layoutKey: 'stripe', paletteKey: 'forest' },
      active: true,
    },
    {
      name: 'wexler',
      description: 'Colorful accent band with bold typography',
      configSchema: { ...sharedConfigSchema, defaults: { ...sharedConfigSchema.defaults, primaryColor: '#1E3A5F' } },
      renderConfig: { componentId: 'wexler', themeId: 'executive-ocean', layoutKey: 'executive', paletteKey: 'ocean' },
      active: true,
    },
    {
      name: 'plexer',
      description: 'Professional two-tone layout with clean lines',
      configSchema: { ...sharedConfigSchema, defaults: { ...sharedConfigSchema.defaults, primaryColor: '#374151' } },
      renderConfig: { componentId: 'plexer', themeId: 'compact-charcoal', layoutKey: 'compact', paletteKey: 'charcoal' },
      active: true,
    },
    {
      name: 'contemporary',
      description: 'Modern gradient header with spacious layout',
      configSchema: { ...sharedConfigSchema, defaults: { ...sharedConfigSchema.defaults, primaryColor: '#E11D48' } },
      renderConfig: { componentId: 'contemporary', themeId: 'banner-crimson', layoutKey: 'banner', paletteKey: 'crimson' },
      active: true,
    },
  ]

  // Upsert legacy templates first
  const seededLegacy = []
  for (const tpl of legacyTemplates) {
    const result = await prisma.baseTemplate.upsert({
      where: { name: tpl.name },
      update: { description: tpl.description, configSchema: tpl.configSchema, renderConfig: tpl.renderConfig },
      create: tpl,
    })
    seededLegacy.push(result.name)
  }
  console.log('✅ Seeded legacy templates:', seededLegacy.join(', '))

  // Upsert all 100 themed templates
  let themedCount = 0
  for (const tpl of themedTemplates) {
    await prisma.baseTemplate.upsert({
      where: { name: tpl.name },
      update: { description: tpl.description, configSchema: tpl.configSchema, renderConfig: tpl.renderConfig },
      create: tpl,
    })
    themedCount++
  }
  console.log(`✅ Seeded ${themedCount} themed templates (20 layouts × 5 palettes)`)

  // =========================================================================
  // SUPER ADMIN USER
  // =========================================================================

  const superAdmin = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
    create: {
      phone: '9999999999',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      otpVerifiedAt: new Date()
    }
  })
  console.log('✅ Created super admin:', superAdmin.phone, '(role:', superAdmin.role + ')')

  // Seed default platform settings
  const defaultSettings = [
    { key: 'platform_name', value: 'Invoice Baba' },
    { key: 'support_email', value: 'support@invoicebaba.com' },
    { key: 'new_registrations_enabled', value: true },
    { key: 'maintenance_mode', value: false },
  ]
  for (const setting of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value, updatedBy: superAdmin.id }
    })
  }
  console.log('✅ Seeded platform settings')

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

  // Create products & services
  const productData = [
    { name: 'Web Development', defaultRate: 15000, unit: 'project' },
    { name: 'Hosting (Annual)', defaultRate: 2300, unit: 'year' },
    { name: 'SEO Optimization', defaultRate: 5000, unit: 'month' },
    { name: 'Content Writing', defaultRate: 680, unit: 'page' },
    { name: 'Logo Design', defaultRate: 3500, unit: 'item' },
    { name: 'Brand Guidelines', defaultRate: 2000, unit: 'item' },
    { name: 'Consulting', defaultRate: 1200, unit: 'hour' },
    { name: 'Plumbing Materials', defaultRate: 120, unit: 'piece' },
    { name: 'Labour Charges', defaultRate: 800, unit: 'day' },
    { name: 'Cement', defaultRate: 380, unit: 'bag' },
    { name: 'Steel Rods', defaultRate: 65, unit: 'kg' },
    { name: 'Transport', defaultRate: 2500, unit: 'trip' },
    { name: 'UI/UX Design', defaultRate: 8000, unit: 'screen' },
    { name: 'Mobile App Development', defaultRate: 50000, unit: 'project' },
    { name: 'Server Maintenance', defaultRate: 3000, unit: 'month' },
    { name: 'Domain Registration', defaultRate: 800, unit: 'year' },
    { name: 'SSL Certificate', defaultRate: 1500, unit: 'year' },
    { name: 'Email Marketing', defaultRate: 2000, unit: 'campaign' },
    { name: 'Social Media Management', defaultRate: 4500, unit: 'month' },
    { name: 'Photography', defaultRate: 5000, unit: 'session' },
  ]

  let productCount = 0
  for (const pd of productData) {
    const existing = await prisma.productService.findFirst({
      where: { businessId: business.id, name: pd.name }
    })
    if (!existing) {
      await prisma.productService.create({
        data: {
          businessId: business.id,
          name: pd.name,
          defaultRate: pd.defaultRate,
          unit: pd.unit
        }
      })
      productCount++
    }
  }
  console.log('✅ Created', productCount, 'products/services')

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
