import { prisma } from '../../common/prisma.js'
import { NotFoundError } from '../../common/errors.js'

export async function listBaseTemplates() {
  const templates = await prisma.baseTemplate.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      description: true,
      configSchema: true,
      renderConfig: true,
      previewImageUrl: true
    },
    orderBy: { name: 'asc' }
  })

  return templates
}

export async function getBaseTemplate(templateId) {
  const template = await prisma.baseTemplate.findUnique({
    where: { id: templateId }
  })

  if (!template) {
    throw new NotFoundError('Template not found')
  }

  return template
}

export async function getBusinessTemplateConfig(businessId) {
  const config = await prisma.businessTemplateConfig.findFirst({
    where: { businessId, isActive: true },
    include: {
      baseTemplate: true
    }
  })

  if (!config) {
    // Return default config if none exists
    const defaultTemplate = await prisma.baseTemplate.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'asc' }
    })

    if (defaultTemplate) {
      return {
        id: null,
        businessId,
        baseTemplateId: defaultTemplate.id,
        baseTemplate: defaultTemplate,
        customConfig: getDefaultCustomConfig(),
        isActive: true
      }
    }

    return null
  }

  return config
}

export async function updateBusinessTemplateConfig(businessId, data) {
  const { baseTemplateId, customConfig } = data

  // Verify template exists
  if (baseTemplateId) {
    const template = await prisma.baseTemplate.findUnique({
      where: { id: baseTemplateId }
    })
    if (!template) {
      throw new NotFoundError('Template not found')
    }
  }

  // Deactivate existing configs
  await prisma.businessTemplateConfig.updateMany({
    where: { businessId, isActive: true },
    data: { isActive: false }
  })

  // Create or update config
  const existingConfig = await prisma.businessTemplateConfig.findFirst({
    where: { businessId, baseTemplateId }
  })

  let config
  if (existingConfig) {
    config = await prisma.businessTemplateConfig.update({
      where: { id: existingConfig.id },
      data: {
        customConfig: customConfig || existingConfig.customConfig,
        isActive: true,
        version: { increment: 1 }
      },
      include: { baseTemplate: true }
    })
  } else {
    config = await prisma.businessTemplateConfig.create({
      data: {
        businessId,
        baseTemplateId,
        customConfig: customConfig || getDefaultCustomConfig(),
        isActive: true,
        version: 1
      },
      include: { baseTemplate: true }
    })
  }

  return config
}

export async function getTemplateSnapshot(businessId) {
  const config = await getBusinessTemplateConfig(businessId)
  
  if (!config) {
    return null
  }

  return {
    templateBaseId: config.baseTemplateId,
    templateConfigSnapshot: {
      baseTemplate: config.baseTemplate,
      customConfig: config.customConfig
    },
    templateVersion: config.version || 1
  }
}

function getDefaultCustomConfig() {
  return {
    colors: {
      primary: '#3880ff',
      secondary: '#666666',
      accent: '#f5f5f5'
    },
    logo: {
      show: true,
      position: 'left',
      maxHeight: 60
    },
    header: {
      showBusinessName: true,
      showBusinessAddress: true,
      showBusinessGSTIN: true,
      showBusinessPhone: true,
      showBusinessEmail: true
    },
    customer: {
      showPhone: true,
      showEmail: true,
      showAddress: true,
      showGSTIN: true
    },
    lineItems: {
      showHSN: false,
      showUnit: false,
      showTaxPerItem: false
    },
    totals: {
      showSubtotal: true,
      showDiscount: true,
      showTaxBreakup: true,
      showAmountInWords: true
    },
    footer: {
      showBankDetails: true,
      showUPI: true,
      showSignature: true,
      showTerms: true,
      showNotes: true,
      customFooterText: ''
    },
    labels: {
      invoiceTitle: 'INVOICE',
      billTo: 'Bill To',
      shipTo: 'Ship To',
      itemDescription: 'Description',
      quantity: 'Qty',
      rate: 'Rate',
      amount: 'Amount'
    }
  }
}
