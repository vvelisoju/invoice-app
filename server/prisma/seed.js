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
