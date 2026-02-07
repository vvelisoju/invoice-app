import { prisma } from '../../common/prisma.js'

export async function getInvoiceSummary(businessId, dateFrom, dateTo) {
  const where = {
    businessId,
    status: { in: ['ISSUED', 'PAID'] },
    ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
    ...(dateTo && { date: { lte: new Date(dateTo) } })
  }

  const [totals, byStatus] = await Promise.all([
    prisma.invoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        discountTotal: true,
        taxTotal: true,
        total: true
      },
      _count: true
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { businessId },
      _sum: { total: true },
      _count: true
    })
  ])

  return {
    period: {
      from: dateFrom || null,
      to: dateTo || null
    },
    totals: {
      invoiceCount: totals._count,
      subtotal: totals._sum.subtotal || 0,
      discountTotal: totals._sum.discountTotal || 0,
      taxTotal: totals._sum.taxTotal || 0,
      total: totals._sum.total || 0
    },
    byStatus: byStatus.map(s => ({
      status: s.status,
      count: s._count,
      total: s._sum.total || 0
    }))
  }
}

export async function getGSTSummary(businessId, dateFrom, dateTo) {
  const where = {
    businessId,
    status: { in: ['ISSUED', 'PAID'] },
    taxMode: { not: 'NONE' },
    ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
    ...(dateTo && { date: { lte: new Date(dateTo) } })
  }

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      taxMode: true,
      taxRate: true,
      taxTotal: true,
      taxBreakup: true,
      subtotal: true,
      discountTotal: true
    }
  })

  let totalTaxableValue = 0
  let totalGST = 0
  let totalCGST = 0
  let totalSGST = 0
  let totalIGST = 0

  invoices.forEach(inv => {
    const taxableValue = (inv.subtotal || 0) - (inv.discountTotal || 0)
    totalTaxableValue += taxableValue
    totalGST += inv.taxTotal || 0

    if (inv.taxBreakup) {
      if (inv.taxMode === 'CGST_SGST') {
        totalCGST += inv.taxBreakup.cgstAmount || 0
        totalSGST += inv.taxBreakup.sgstAmount || 0
      } else if (inv.taxMode === 'IGST') {
        totalIGST += inv.taxBreakup.igstAmount || 0
      }
    }
  })

  // Group by tax rate
  const byTaxRate = {}
  invoices.forEach(inv => {
    const rate = inv.taxRate || 0
    if (!byTaxRate[rate]) {
      byTaxRate[rate] = {
        taxRate: rate,
        count: 0,
        taxableValue: 0,
        taxAmount: 0
      }
    }
    byTaxRate[rate].count++
    byTaxRate[rate].taxableValue += (inv.subtotal || 0) - (inv.discountTotal || 0)
    byTaxRate[rate].taxAmount += inv.taxTotal || 0
  })

  return {
    period: {
      from: dateFrom || null,
      to: dateTo || null
    },
    summary: {
      invoiceCount: invoices.length,
      totalTaxableValue,
      totalGST,
      breakdown: {
        cgst: totalCGST,
        sgst: totalSGST,
        igst: totalIGST
      }
    },
    byTaxRate: Object.values(byTaxRate).sort((a, b) => a.taxRate - b.taxRate)
  }
}

export async function getDocumentReport(businessId, filters = {}) {
  const { dateFrom, dateTo, status, documentType } = filters

  const where = {
    businessId,
    ...(dateFrom && dateTo
      ? { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } }
      : dateFrom
        ? { date: { gte: new Date(dateFrom) } }
        : dateTo
          ? { date: { lte: new Date(dateTo) } }
          : {}),
    ...(status && status !== 'all' && { status }),
    ...(documentType && documentType !== 'all' && { documentType })
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true, gstin: true, phone: true }
      }
    },
    orderBy: { date: 'desc' }
  })

  let totalSubtotal = 0
  let totalTax = 0
  let totalPaid = 0
  let totalAmount = 0

  const documents = invoices.map(inv => {
    const subtotal = parseFloat(inv.subtotal || 0)
    const tax = parseFloat(inv.taxTotal || 0)
    const paid = parseFloat(inv.paidAmount || 0)
    const total = parseFloat(inv.total || 0)

    totalSubtotal += subtotal
    totalTax += tax
    totalPaid += paid
    totalAmount += total

    return {
      id: inv.id,
      customerName: inv.customer?.name || inv.customerName || '',
      customerGstin: inv.customer?.gstin || '',
      documentType: inv.documentType || 'INVOICE',
      invoiceNumber: inv.invoiceNumber || '',
      date: inv.date,
      subtotal,
      tax,
      paidAmount: paid,
      total
    }
  })

  return {
    documents,
    totals: {
      count: documents.length,
      subtotal: totalSubtotal,
      tax: totalTax,
      paidAmount: totalPaid,
      total: totalAmount
    }
  }
}

export async function getMonthlyTrend(businessId, months = 6) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: startDate }
    },
    select: {
      date: true,
      total: true,
      status: true
    }
  })

  // Group by month
  const monthlyData = {}
  invoices.forEach(inv => {
    const monthKey = `${inv.date.getFullYear()}-${String(inv.date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        invoiceCount: 0,
        totalAmount: 0,
        paidAmount: 0
      }
    }
    monthlyData[monthKey].invoiceCount++
    monthlyData[monthKey].totalAmount += inv.total || 0
    if (inv.status === 'PAID') {
      monthlyData[monthKey].paidAmount += inv.total || 0
    }
  })

  // Fill missing months
  const result = []
  const current = new Date(startDate)
  while (current <= new Date()) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    result.push(monthlyData[monthKey] || {
      month: monthKey,
      invoiceCount: 0,
      totalAmount: 0,
      paidAmount: 0
    })
    current.setMonth(current.getMonth() + 1)
  }

  return result
}
