import { prisma } from '../../common/prisma.js'
import { getStateName } from '../../common/indianStates.js'

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

// ============================================================================
// GSTR-3B Summary (Tables 3.1, 3.2, 5.1 — outward supplies only)
// ============================================================================

function getMonthDateRange(month) {
  // month format: YYYY-MM
  const [year, mon] = month.split('-').map(Number)
  const from = new Date(year, mon - 1, 1)
  const to = new Date(year, mon, 0, 23, 59, 59, 999)
  return { from, to }
}

export async function getGSTR3BSummary(businessId, month, documentType) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { stateCode: true, gstin: true, name: true, gstEnabled: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      ...(documentType && { documentType })
    },
    select: {
      id: true,
      taxMode: true,
      taxRate: true,
      taxTotal: true,
      taxBreakup: true,
      subtotal: true,
      discountTotal: true,
      total: true,
      placeOfSupplyStateCode: true,
      customerId: true,
      customer: { select: { gstin: true } }
    }
  })

  // 3.1(a) Outward taxable supplies (with tax > 0)
  const taxable = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
  // 3.1(b) Zero-rated supplies
  const zeroRated = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
  // 3.1(c) Nil-rated / exempt
  const nilExempt = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
  // 3.1(e) Non-GST supplies
  const nonGst = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
  // 3.2 Interstate to unregistered
  const interstateUnregistered = { taxableValue: 0, igst: 0 }

  invoices.forEach(inv => {
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
    const breakup = inv.taxBreakup || {}
    const taxRate = parseFloat(inv.taxRate || 0)
    const hasGstin = !!inv.customer?.gstin
    const isInterstate = business.stateCode !== inv.placeOfSupplyStateCode && inv.placeOfSupplyStateCode

    if (inv.taxMode === 'NONE' || !inv.taxMode) {
      if (!business.gstEnabled) {
        // Non-GST supply
        nonGst.taxableValue += taxableValue
      } else {
        // Nil-rated / exempt
        nilExempt.taxableValue += taxableValue
      }
    } else if (taxRate === 0) {
      // Zero-rated
      zeroRated.taxableValue += taxableValue
    } else {
      // Taxable supply
      taxable.taxableValue += taxableValue
      taxable.igst += parseFloat(breakup.igstAmount || 0)
      taxable.cgst += parseFloat(breakup.cgstAmount || 0)
      taxable.sgst += parseFloat(breakup.sgstAmount || 0)
    }

    // 3.2 Interstate to unregistered
    if (!hasGstin && isInterstate) {
      interstateUnregistered.taxableValue += taxableValue
      interstateUnregistered.igst += parseFloat(breakup.igstAmount || 0)
    }
  })

  // 5.1 Tax payable
  const taxPayable = {
    igst: taxable.igst + zeroRated.igst,
    cgst: taxable.cgst,
    sgst: taxable.sgst,
    cess: 0
  }

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    table3_1: {
      a_taxable: taxable,
      b_zeroRated: zeroRated,
      c_nilExempt: nilExempt,
      e_nonGst: nonGst
    },
    table3_2: interstateUnregistered,
    table5_1: taxPayable,
    invoiceCount: invoices.length
  }
}

// ============================================================================
// GSTR-1 Table 4A — B2B Invoices (supplies to registered persons)
// ============================================================================

export async function getGSTR1B2B(businessId, month, documentType) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      customer: { gstin: { not: null } },
      ...(documentType && { documentType })
    },
    include: {
      customer: { select: { gstin: true, name: true } }
    },
    orderBy: { date: 'asc' }
  })

  // Filter out invoices where customer GSTIN is empty string
  const b2bInvoices = invoices.filter(inv => inv.customer?.gstin?.trim())

  const rows = b2bInvoices.map(inv => {
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)

    return {
      gstinOfRecipient: inv.customer.gstin,
      receiverName: inv.customer.name,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.date,
      invoiceValue: parseFloat(inv.total || 0),
      placeOfSupply: `${inv.placeOfSupplyStateCode || ''}-${getStateName(inv.placeOfSupplyStateCode)}`,
      reverseCharge: 'N',
      invoiceType: 'Regular',
      rate: parseFloat(inv.taxRate || 0),
      taxableValue,
      igstAmount: parseFloat(breakup.igstAmount || 0),
      cgstAmount: parseFloat(breakup.cgstAmount || 0),
      sgstAmount: parseFloat(breakup.sgstAmount || 0),
      cessAmount: 0
    }
  })

  // Totals
  const totals = rows.reduce((acc, r) => ({
    invoiceValue: acc.invoiceValue + r.invoiceValue,
    taxableValue: acc.taxableValue + r.taxableValue,
    igstAmount: acc.igstAmount + r.igstAmount,
    cgstAmount: acc.cgstAmount + r.cgstAmount,
    sgstAmount: acc.sgstAmount + r.sgstAmount,
    cessAmount: 0
  }), { invoiceValue: 0, taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0 })

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    rows,
    totals: { ...totals, count: rows.length }
  }
}

// ============================================================================
// Sales Register — chronological invoice list with tax breakup
// ============================================================================

export async function getSalesRegister(businessId, dateFrom, dateTo, documentType) {
  const where = {
    businessId,
    status: { in: ['ISSUED', 'PAID', 'CANCELLED', 'VOID'] },
    ...(dateFrom && dateTo
      ? { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } }
      : dateFrom
        ? { date: { gte: new Date(dateFrom) } }
        : dateTo
          ? { date: { lte: new Date(dateTo) } }
          : {}),
    ...(documentType && { documentType })
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { name: true, gstin: true, stateCode: true } }
    },
    orderBy: { date: 'asc' }
  })

  const rows = invoices.map(inv => {
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)

    return {
      date: inv.date,
      invoiceNumber: inv.invoiceNumber,
      documentType: inv.documentType || 'invoice',
      customerName: inv.customer?.name || '',
      customerGstin: inv.customer?.gstin || '',
      placeOfSupply: getStateName(inv.placeOfSupplyStateCode),
      placeOfSupplyCode: inv.placeOfSupplyStateCode || '',
      taxableValue,
      taxRate: parseFloat(inv.taxRate || 0),
      cgst: parseFloat(breakup.cgstAmount || 0),
      sgst: parseFloat(breakup.sgstAmount || 0),
      igst: parseFloat(breakup.igstAmount || 0),
      totalInvoiceValue: parseFloat(inv.total || 0),
      status: inv.status,
      paidAt: inv.paidAt
    }
  })

  const totals = rows.reduce((acc, r) => ({
    taxableValue: acc.taxableValue + r.taxableValue,
    cgst: acc.cgst + r.cgst,
    sgst: acc.sgst + r.sgst,
    igst: acc.igst + r.igst,
    totalInvoiceValue: acc.totalInvoiceValue + r.totalInvoiceValue
  }), { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalInvoiceValue: 0 })

  return {
    period: { from: dateFrom || null, to: dateTo || null },
    rows,
    totals: { ...totals, count: rows.length }
  }
}

// ============================================================================
// GSTR-1 Table 5A — B2C Large (Interstate to unregistered > threshold)
// ============================================================================

export async function getGSTR1B2CLarge(businessId, month, threshold = 250000, documentType) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true, stateCode: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      taxMode: 'IGST',
      ...(documentType && { documentType }),
      OR: [
        { customer: { gstin: null } },
        { customer: { gstin: '' } },
        { customerId: null }
      ]
    },
    include: {
      customer: { select: { gstin: true } }
    },
    orderBy: { date: 'asc' }
  })

  // Filter: no GSTIN and total > threshold
  const filtered = invoices.filter(inv => {
    const noGstin = !inv.customer?.gstin?.trim()
    return noGstin && parseFloat(inv.total || 0) > threshold
  })

  const rows = filtered.map(inv => {
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
    return {
      placeOfSupply: `${inv.placeOfSupplyStateCode || ''}-${getStateName(inv.placeOfSupplyStateCode)}`,
      rate: parseFloat(inv.taxRate || 0),
      taxableValue,
      igstAmount: parseFloat(breakup.igstAmount || 0),
      cessAmount: 0
    }
  })

  const totals = rows.reduce((acc, r) => ({
    taxableValue: acc.taxableValue + r.taxableValue,
    igstAmount: acc.igstAmount + r.igstAmount,
    cessAmount: 0
  }), { taxableValue: 0, igstAmount: 0, cessAmount: 0 })

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    rows,
    totals: { ...totals, count: rows.length }
  }
}

// ============================================================================
// GSTR-1 Table 7 — B2C Small (all other B2C, grouped by state + rate)
// ============================================================================

export async function getGSTR1B2CSmall(businessId, month, b2cLargeThreshold = 250000, documentType) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true, stateCode: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      ...(documentType && { documentType }),
      OR: [
        { customer: { gstin: null } },
        { customer: { gstin: '' } },
        { customerId: null }
      ]
    },
    include: {
      customer: { select: { gstin: true } }
    }
  })

  // Filter: no GSTIN and NOT B2C Large
  const filtered = invoices.filter(inv => {
    const noGstin = !inv.customer?.gstin?.trim()
    const isB2CLarge = inv.taxMode === 'IGST' && parseFloat(inv.total || 0) > b2cLargeThreshold
    return noGstin && !isB2CLarge
  })

  // Group by Place of Supply + Tax Rate
  const groups = {}
  filtered.forEach(inv => {
    const stateCode = inv.placeOfSupplyStateCode || 'NA'
    const rate = parseFloat(inv.taxRate || 0)
    const key = `${stateCode}_${rate}`
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)

    if (!groups[key]) {
      groups[key] = {
        placeOfSupply: `${stateCode}-${getStateName(stateCode)}`,
        placeOfSupplyCode: stateCode,
        rate,
        taxableValue: 0,
        igstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        cessAmount: 0,
        count: 0
      }
    }
    groups[key].taxableValue += taxableValue
    groups[key].igstAmount += parseFloat(breakup.igstAmount || 0)
    groups[key].cgstAmount += parseFloat(breakup.cgstAmount || 0)
    groups[key].sgstAmount += parseFloat(breakup.sgstAmount || 0)
    groups[key].count++
  })

  const rows = Object.values(groups).sort((a, b) => a.placeOfSupplyCode.localeCompare(b.placeOfSupplyCode) || a.rate - b.rate)

  const totals = rows.reduce((acc, r) => ({
    taxableValue: acc.taxableValue + r.taxableValue,
    igstAmount: acc.igstAmount + r.igstAmount,
    cgstAmount: acc.cgstAmount + r.cgstAmount,
    sgstAmount: acc.sgstAmount + r.sgstAmount,
    cessAmount: 0
  }), { taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0 })

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    rows,
    totals: { ...totals, count: filtered.length }
  }
}

// ============================================================================
// GSTR-1 Table 8 — Nil-rated, Exempt, Non-GST Supplies
// ============================================================================

export async function getGSTR1NilExempt(businessId, month, documentType) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true, stateCode: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      ...(documentType && { documentType }),
      OR: [
        { taxMode: 'NONE' },
        { taxMode: null },
        { taxRate: 0 },
        { taxRate: null }
      ]
    },
    include: {
      customer: { select: { gstin: true } }
    }
  })

  // Classify: Registered (B2B) vs Unregistered (B2C), Interstate vs Intrastate
  const summary = {
    registeredInter: { nilRated: 0, exempt: 0, nonGst: 0 },
    registeredIntra: { nilRated: 0, exempt: 0, nonGst: 0 },
    unregisteredInter: { nilRated: 0, exempt: 0, nonGst: 0 },
    unregisteredIntra: { nilRated: 0, exempt: 0, nonGst: 0 },
  }

  invoices.forEach(inv => {
    const hasGstin = !!inv.customer?.gstin?.trim()
    const isInterstate = business.stateCode !== inv.placeOfSupplyStateCode && inv.placeOfSupplyStateCode
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)

    let bucket
    if (hasGstin) {
      bucket = isInterstate ? summary.registeredInter : summary.registeredIntra
    } else {
      bucket = isInterstate ? summary.unregisteredInter : summary.unregisteredIntra
    }

    // Classify as nil-rated (taxRate=0 with GST enabled) vs non-GST (no tax mode)
    if (inv.taxMode === 'NONE' || !inv.taxMode) {
      bucket.nonGst += taxableValue
    } else {
      bucket.nilRated += taxableValue
    }
  })

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    summary,
    invoiceCount: invoices.length
  }
}

// ============================================================================
// GSTR-1 Table 9B — Credit / Debit Notes
// ============================================================================

export async function getGSTR1CreditNotes(businessId, month) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      documentType: { in: ['credit_note', 'credit_memo'] }
    },
    include: {
      customer: { select: { gstin: true, name: true } },
      originalInvoice: { select: { invoiceNumber: true, date: true } }
    },
    orderBy: { date: 'asc' }
  })

  const rows = invoices.map(inv => {
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
    const noteType = inv.documentType === 'credit_note' || inv.documentType === 'credit_memo' ? 'C' : 'D'

    return {
      gstinOfRecipient: inv.customer?.gstin || '',
      receiverName: inv.customer?.name || '',
      noteNumber: inv.invoiceNumber,
      noteDate: inv.date,
      noteType,
      noteValue: parseFloat(inv.total || 0),
      originalInvoiceNumber: inv.originalInvoice?.invoiceNumber || '',
      originalInvoiceDate: inv.originalInvoice?.date || null,
      rate: parseFloat(inv.taxRate || 0),
      taxableValue,
      igstAmount: parseFloat(breakup.igstAmount || 0),
      cgstAmount: parseFloat(breakup.cgstAmount || 0),
      sgstAmount: parseFloat(breakup.sgstAmount || 0),
      cessAmount: 0
    }
  })

  const totals = rows.reduce((acc, r) => ({
    noteValue: acc.noteValue + r.noteValue,
    taxableValue: acc.taxableValue + r.taxableValue,
    igstAmount: acc.igstAmount + r.igstAmount,
    cgstAmount: acc.cgstAmount + r.cgstAmount,
    sgstAmount: acc.sgstAmount + r.sgstAmount,
  }), { noteValue: 0, taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0 })

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    rows,
    totals: { ...totals, count: rows.length }
  }
}

// ============================================================================
// GSTR-1 Table 13 — Document Summary (number ranges, totals, cancellations)
// ============================================================================

export async function getGSTR1DocSummary(businessId, month) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      date: { gte: from, lte: to }
    },
    select: {
      invoiceNumber: true,
      documentType: true,
      status: true
    },
    orderBy: { invoiceNumber: 'asc' }
  })

  // Group by document type
  const groups = {}
  invoices.forEach(inv => {
    const docType = inv.documentType || 'invoice'
    if (!groups[docType]) {
      groups[docType] = { numbers: [], cancelled: 0, total: 0 }
    }
    groups[docType].numbers.push(inv.invoiceNumber)
    groups[docType].total++
    if (inv.status === 'CANCELLED' || inv.status === 'VOID') {
      groups[docType].cancelled++
    }
  })

  const DOC_NATURE_MAP = {
    invoice: 'Invoices for outward supply',
    tax_invoice: 'Tax Invoices',
    proforma: 'Proforma Invoices',
    receipt: 'Receipts',
    sales_receipt: 'Sales Receipts',
    cash_receipt: 'Receipt Vouchers',
    quote: 'Quotations',
    estimate: 'Estimates',
    credit_memo: 'Credit Memos',
    credit_note: 'Credit Notes',
    purchase_order: 'Purchase Orders',
    delivery_note: 'Delivery Challans',
  }

  const rows = Object.entries(groups).map(([docType, data]) => ({
    natureOfDocument: DOC_NATURE_MAP[docType] || docType,
    documentType: docType,
    srNoFrom: data.numbers[0] || '',
    srNoTo: data.numbers[data.numbers.length - 1] || '',
    totalNumber: data.total,
    cancelled: data.cancelled,
    netIssued: data.total - data.cancelled
  }))

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    rows,
    grandTotal: {
      totalNumber: invoices.length,
      cancelled: rows.reduce((s, r) => s + r.cancelled, 0),
      netIssued: rows.reduce((s, r) => s + r.netIssued, 0)
    }
  }
}

// ============================================================================
// Customer-wise Sales Summary
// ============================================================================

export async function getCustomerSummary(businessId, dateFrom, dateTo, documentType) {
  const where = {
    businessId,
    status: { in: ['ISSUED', 'PAID'] },
    ...(dateFrom && dateTo
      ? { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } }
      : dateFrom
        ? { date: { gte: new Date(dateFrom) } }
        : dateTo
          ? { date: { lte: new Date(dateTo) } }
          : {}),
    ...(documentType && { documentType })
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, gstin: true, phone: true, stateCode: true } }
    }
  })

  const customerMap = {}
  invoices.forEach(inv => {
    const custId = inv.customerId || '_no_customer'
    if (!customerMap[custId]) {
      customerMap[custId] = {
        customerId: inv.customerId,
        customerName: inv.customer?.name || 'Walk-in / No Customer',
        gstin: inv.customer?.gstin || '',
        phone: inv.customer?.phone || '',
        state: getStateName(inv.customer?.stateCode),
        invoiceCount: 0,
        taxableValue: 0,
        taxCollected: 0,
        totalRevenue: 0,
        paidAmount: 0,
        outstanding: 0
      }
    }
    const c = customerMap[custId]
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
    c.invoiceCount++
    c.taxableValue += taxableValue
    c.taxCollected += parseFloat(inv.taxTotal || 0)
    c.totalRevenue += parseFloat(inv.total || 0)
    if (inv.status === 'PAID') {
      c.paidAmount += parseFloat(inv.total || 0)
    }
  })

  // Calculate outstanding
  Object.values(customerMap).forEach(c => {
    c.outstanding = c.totalRevenue - c.paidAmount
  })

  const rows = Object.values(customerMap).sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totals = rows.reduce((acc, r) => ({
    invoiceCount: acc.invoiceCount + r.invoiceCount,
    taxableValue: acc.taxableValue + r.taxableValue,
    taxCollected: acc.taxCollected + r.taxCollected,
    totalRevenue: acc.totalRevenue + r.totalRevenue,
    paidAmount: acc.paidAmount + r.paidAmount,
    outstanding: acc.outstanding + r.outstanding,
  }), { invoiceCount: 0, taxableValue: 0, taxCollected: 0, totalRevenue: 0, paidAmount: 0, outstanding: 0 })

  return {
    period: { from: dateFrom || null, to: dateTo || null },
    rows,
    totals: { ...totals, customerCount: rows.length }
  }
}

// ============================================================================
// Tax Rate Report — tax collected grouped by rate slab
// ============================================================================

export async function getTaxRateReport(businessId, dateFrom, dateTo) {
  const where = {
    businessId,
    status: { in: ['ISSUED', 'PAID'] },
    taxMode: { not: 'NONE' },
    ...(dateFrom && dateTo
      ? { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } }
      : dateFrom
        ? { date: { gte: new Date(dateFrom) } }
        : dateTo
          ? { date: { lte: new Date(dateTo) } }
          : {})
  }

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      taxRate: true,
      taxTotal: true,
      taxBreakup: true,
      subtotal: true,
      discountTotal: true,
      taxMode: true
    }
  })

  const rateMap = {}
  invoices.forEach(inv => {
    const rate = parseFloat(inv.taxRate || 0)
    const key = rate.toString()
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)

    if (!rateMap[key]) {
      rateMap[key] = {
        taxRate: rate,
        invoiceCount: 0,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0
      }
    }
    rateMap[key].invoiceCount++
    rateMap[key].taxableValue += taxableValue
    rateMap[key].cgst += parseFloat(breakup.cgstAmount || 0)
    rateMap[key].sgst += parseFloat(breakup.sgstAmount || 0)
    rateMap[key].igst += parseFloat(breakup.igstAmount || 0)
    rateMap[key].totalTax += parseFloat(inv.taxTotal || 0)
  })

  const rows = Object.values(rateMap).sort((a, b) => a.taxRate - b.taxRate)

  const totals = rows.reduce((acc, r) => ({
    invoiceCount: acc.invoiceCount + r.invoiceCount,
    taxableValue: acc.taxableValue + r.taxableValue,
    cgst: acc.cgst + r.cgst,
    sgst: acc.sgst + r.sgst,
    igst: acc.igst + r.igst,
    totalTax: acc.totalTax + r.totalTax,
  }), { invoiceCount: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 })

  return {
    period: { from: dateFrom || null, to: dateTo || null },
    rows,
    totals
  }
}

// ============================================================================
// Receivables Aging Report
// ============================================================================

export async function getReceivablesAging(businessId, asOfDate) {
  const asOf = asOfDate ? new Date(asOfDate) : new Date()

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: 'ISSUED',
      dueDate: { not: null }
    },
    include: {
      customer: { select: { name: true, phone: true } }
    },
    orderBy: { dueDate: 'asc' }
  })

  const buckets = {
    notDue: { label: 'Not Yet Due', count: 0, amount: 0, invoices: [] },
    '1_30': { label: '1–30 Days', count: 0, amount: 0, invoices: [] },
    '31_60': { label: '31–60 Days', count: 0, amount: 0, invoices: [] },
    '61_90': { label: '61–90 Days', count: 0, amount: 0, invoices: [] },
    '90_plus': { label: '90+ Days', count: 0, amount: 0, invoices: [] },
  }

  invoices.forEach(inv => {
    const dueDate = new Date(inv.dueDate)
    const diffDays = Math.floor((asOf - dueDate) / (1000 * 60 * 60 * 24))
    const total = parseFloat(inv.total || 0)

    let bucket
    if (diffDays <= 0) bucket = buckets.notDue
    else if (diffDays <= 30) bucket = buckets['1_30']
    else if (diffDays <= 60) bucket = buckets['31_60']
    else if (diffDays <= 90) bucket = buckets['61_90']
    else bucket = buckets['90_plus']

    bucket.count++
    bucket.amount += total
    bucket.invoices.push({
      customerName: inv.customer?.name || '',
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.date,
      dueDate: inv.dueDate,
      daysOverdue: Math.max(0, diffDays),
      amount: total
    })
  })

  const grandTotal = {
    count: invoices.length,
    amount: invoices.reduce((s, inv) => s + parseFloat(inv.total || 0), 0)
  }

  return {
    asOfDate: asOf,
    buckets,
    grandTotal
  }
}

// ============================================================================
// Customer Ledger — all transactions for a specific customer
// ============================================================================

export async function getCustomerLedger(businessId, customerId, dateFrom, dateTo) {
  const where = {
    businessId,
    customerId,
    ...(dateFrom && dateTo
      ? { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } }
      : dateFrom
        ? { date: { gte: new Date(dateFrom) } }
        : dateTo
          ? { date: { lte: new Date(dateTo) } }
          : {})
  }

  const [customer, invoices] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, gstin: true, phone: true, email: true, address: true, stateCode: true }
    }),
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        documentType: true,
        date: true,
        total: true,
        status: true,
        paidAt: true
      },
      orderBy: { date: 'asc' }
    })
  ])

  let totalInvoiced = 0
  let totalPaid = 0

  const rows = invoices.map(inv => {
    const amount = parseFloat(inv.total || 0)
    totalInvoiced += amount
    if (inv.status === 'PAID') totalPaid += amount

    return {
      date: inv.date,
      documentNumber: inv.invoiceNumber,
      documentType: inv.documentType || 'invoice',
      amount,
      status: inv.status,
      paidAt: inv.paidAt
    }
  })

  return {
    customer: {
      ...customer,
      state: getStateName(customer?.stateCode)
    },
    period: { from: dateFrom || null, to: dateTo || null },
    rows,
    summary: {
      totalInvoiced,
      totalPaid,
      outstanding: totalInvoiced - totalPaid,
      invoiceCount: rows.length
    }
  }
}

// ============================================================================
// Annual Sales Summary (Financial Year: April–March)
// ============================================================================

function getFYDateRange(fy) {
  // fy format: "2025-26"
  const [startYear] = fy.split('-').map(Number)
  const from = new Date(startYear, 3, 1) // April 1
  const to = new Date(startYear + 1, 2, 31, 23, 59, 59, 999) // March 31
  return { from, to }
}

export async function getAnnualSummary(businessId, fy, documentType) {
  const { from, to } = getFYDateRange(fy)

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      date: { gte: from, lte: to },
      ...(documentType && { documentType })
    },
    select: {
      date: true,
      status: true,
      documentType: true,
      subtotal: true,
      discountTotal: true,
      taxTotal: true,
      taxRate: true,
      total: true,
      taxMode: true,
      taxBreakup: true,
      customerId: true,
      customer: { select: { gstin: true } }
    }
  })

  // Revenue summary
  const active = invoices.filter(i => i.status === 'ISSUED' || i.status === 'PAID')
  const cancelled = invoices.filter(i => i.status === 'CANCELLED' || i.status === 'VOID')

  let grossSales = 0, totalDiscount = 0, totalTax = 0, totalInvoiced = 0, totalPaid = 0
  active.forEach(inv => {
    grossSales += parseFloat(inv.subtotal || 0)
    totalDiscount += parseFloat(inv.discountTotal || 0)
    totalTax += parseFloat(inv.taxTotal || 0)
    totalInvoiced += parseFloat(inv.total || 0)
    if (inv.status === 'PAID') totalPaid += parseFloat(inv.total || 0)
  })

  // Month-wise breakup
  const monthlyMap = {}
  for (let m = 0; m < 12; m++) {
    const d = new Date(from)
    d.setMonth(d.getMonth() + m)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = { month: key, invoiceCount: 0, grossSales: 0, discount: 0, netSales: 0, tax: 0, total: 0 }
  }
  active.forEach(inv => {
    const key = `${inv.date.getFullYear()}-${String(inv.date.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap[key]) {
      monthlyMap[key].invoiceCount++
      monthlyMap[key].grossSales += parseFloat(inv.subtotal || 0)
      monthlyMap[key].discount += parseFloat(inv.discountTotal || 0)
      monthlyMap[key].netSales += parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
      monthlyMap[key].tax += parseFloat(inv.taxTotal || 0)
      monthlyMap[key].total += parseFloat(inv.total || 0)
    }
  })

  // Document type breakup
  const docTypeMap = {}
  active.forEach(inv => {
    const dt = inv.documentType || 'invoice'
    if (!docTypeMap[dt]) docTypeMap[dt] = { documentType: dt, count: 0, totalValue: 0 }
    docTypeMap[dt].count++
    docTypeMap[dt].totalValue += parseFloat(inv.total || 0)
  })

  // Tax rate breakup
  const taxRateMap = {}
  active.forEach(inv => {
    const rate = parseFloat(inv.taxRate || 0)
    const key = rate.toString()
    if (!taxRateMap[key]) taxRateMap[key] = { taxRate: rate, count: 0, taxableValue: 0, taxAmount: 0 }
    taxRateMap[key].count++
    taxRateMap[key].taxableValue += parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
    taxRateMap[key].taxAmount += parseFloat(inv.taxTotal || 0)
  })

  // B2B vs B2C split
  let b2bCount = 0, b2bValue = 0, b2cCount = 0, b2cValue = 0
  active.forEach(inv => {
    const hasGstin = !!inv.customer?.gstin?.trim()
    if (hasGstin) { b2bCount++; b2bValue += parseFloat(inv.total || 0) }
    else { b2cCount++; b2cValue += parseFloat(inv.total || 0) }
  })

  return {
    fy,
    period: { from, to },
    revenue: {
      grossSales,
      totalDiscount,
      netSales: grossSales - totalDiscount,
      gstCollected: totalTax,
      totalInvoiced,
      totalPaid,
      outstanding: totalInvoiced - totalPaid,
      cancelledValue: cancelled.reduce((s, i) => s + parseFloat(i.total || 0), 0),
      cancelledCount: cancelled.length
    },
    monthWise: Object.values(monthlyMap),
    docTypeBreakup: Object.values(docTypeMap),
    taxRateBreakup: Object.values(taxRateMap).sort((a, b) => a.taxRate - b.taxRate),
    b2bVsB2c: { b2b: { count: b2bCount, value: b2bValue }, b2c: { count: b2cCount, value: b2cValue } },
    totalInvoiceCount: active.length
  }
}

// ============================================================================
// GSTR-9 Data Export (Annual Return — outward supplies only)
// ============================================================================

export async function getGSTR9Data(businessId, fy, documentType) {
  const { from, to } = getFYDateRange(fy)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true, stateCode: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to },
      ...(documentType && { documentType })
    },
    select: {
      taxMode: true,
      taxRate: true,
      taxTotal: true,
      taxBreakup: true,
      subtotal: true,
      discountTotal: true,
      total: true,
      documentType: true,
      customerId: true,
      customer: { select: { gstin: true } }
    }
  })

  // Table 4 — Outward supplies
  const table4 = {
    a_b2b: { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
    b_b2c: { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
    c_zeroRated: { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
  }

  // Table 5 — Amendments (credit notes)
  const table5 = { creditNotes: { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, count: 0 } }

  // Table 9 — Tax payable
  const table9 = { igst: 0, cgst: 0, sgst: 0 }

  invoices.forEach(inv => {
    const breakup = inv.taxBreakup || {}
    const taxableValue = parseFloat(inv.subtotal || 0) - parseFloat(inv.discountTotal || 0)
    const hasGstin = !!inv.customer?.gstin?.trim()
    const isCreditNote = inv.documentType === 'credit_note' || inv.documentType === 'credit_memo'

    if (isCreditNote) {
      table5.creditNotes.taxableValue += taxableValue
      table5.creditNotes.igst += parseFloat(breakup.igstAmount || 0)
      table5.creditNotes.cgst += parseFloat(breakup.cgstAmount || 0)
      table5.creditNotes.sgst += parseFloat(breakup.sgstAmount || 0)
      table5.creditNotes.count++
      return
    }

    const taxRate = parseFloat(inv.taxRate || 0)
    if (taxRate === 0 && (inv.taxMode !== 'NONE' && inv.taxMode)) {
      table4.c_zeroRated.taxableValue += taxableValue
    } else if (hasGstin) {
      table4.a_b2b.taxableValue += taxableValue
      table4.a_b2b.igst += parseFloat(breakup.igstAmount || 0)
      table4.a_b2b.cgst += parseFloat(breakup.cgstAmount || 0)
      table4.a_b2b.sgst += parseFloat(breakup.sgstAmount || 0)
    } else {
      table4.b_b2c.taxableValue += taxableValue
      table4.b_b2c.igst += parseFloat(breakup.igstAmount || 0)
      table4.b_b2c.cgst += parseFloat(breakup.cgstAmount || 0)
      table4.b_b2c.sgst += parseFloat(breakup.sgstAmount || 0)
    }

    // Table 9
    table9.igst += parseFloat(breakup.igstAmount || 0)
    table9.cgst += parseFloat(breakup.cgstAmount || 0)
    table9.sgst += parseFloat(breakup.sgstAmount || 0)
  })

  return {
    fy,
    period: { from, to },
    business: { name: business.name, gstin: business.gstin },
    table4,
    table5,
    table9,
    invoiceCount: invoices.length
  }
}

// ============================================================================
// GSTR-1 Table 12 — HSN Summary
// ============================================================================

export async function getGSTR1HSNSummary(businessId, month) {
  const { from, to } = getMonthDateRange(month)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, name: true }
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ['ISSUED', 'PAID'] },
      date: { gte: from, lte: to }
    },
    select: {
      taxRate: true,
      taxMode: true,
      taxBreakup: true,
      lineItems: {
        select: {
          hsnCode: true,
          name: true,
          quantity: true,
          rate: true,
          lineTotal: true
        }
      }
    }
  })

  // Group by HSN code + tax rate
  const hsnMap = {}
  invoices.forEach(inv => {
    const taxRate = parseFloat(inv.taxRate || 0)
    const breakup = inv.taxBreakup || {}
    const invoiceSubtotal = inv.lineItems.reduce((s, li) => s + parseFloat(li.lineTotal || 0), 0)

    inv.lineItems.forEach(li => {
      const hsn = li.hsnCode?.trim() || ''
      if (!hsn) return // Skip items without HSN

      const liTotal = parseFloat(li.lineTotal || 0)
      const proportion = invoiceSubtotal > 0 ? liTotal / invoiceSubtotal : 0
      const key = `${hsn}_${taxRate}`

      if (!hsnMap[key]) {
        hsnMap[key] = {
          hsnCode: hsn,
          description: li.name,
          uqc: 'NOS',
          totalQuantity: 0,
          taxableValue: 0,
          igstAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          cessAmount: 0,
          totalValue: 0,
          rate: taxRate
        }
      }

      hsnMap[key].totalQuantity += parseFloat(li.quantity || 0)
      hsnMap[key].taxableValue += liTotal
      hsnMap[key].igstAmount += parseFloat(breakup.igstAmount || 0) * proportion
      hsnMap[key].cgstAmount += parseFloat(breakup.cgstAmount || 0) * proportion
      hsnMap[key].sgstAmount += parseFloat(breakup.sgstAmount || 0) * proportion
      hsnMap[key].totalValue += liTotal + (parseFloat(inv.taxBreakup?.igstAmount || 0) + parseFloat(inv.taxBreakup?.cgstAmount || 0) + parseFloat(inv.taxBreakup?.sgstAmount || 0)) * proportion
    })
  })

  const rows = Object.values(hsnMap).sort((a, b) => a.hsnCode.localeCompare(b.hsnCode) || a.rate - b.rate)

  const totals = rows.reduce((acc, r) => ({
    totalQuantity: acc.totalQuantity + r.totalQuantity,
    taxableValue: acc.taxableValue + r.taxableValue,
    igstAmount: acc.igstAmount + r.igstAmount,
    cgstAmount: acc.cgstAmount + r.cgstAmount,
    sgstAmount: acc.sgstAmount + r.sgstAmount,
    totalValue: acc.totalValue + r.totalValue,
  }), { totalQuantity: 0, taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, totalValue: 0 })

  // Count unique HSN codes
  const uniqueHSN = new Set(rows.map(r => r.hsnCode)).size

  return {
    period: { month, from, to },
    business: { name: business.name, gstin: business.gstin },
    rows,
    totals: { ...totals, count: rows.length, uniqueHSN }
  }
}

// ============================================================================
// CA Package — Combined multi-report data for accountant
// ============================================================================

export async function getCAPackage(businessId, month) {
  const [
    gstr3b,
    b2b,
    b2cLarge,
    b2cSmall,
    nilExempt,
    creditNotes,
    docSummary,
    hsnSummary
  ] = await Promise.all([
    getGSTR3BSummary(businessId, month),
    getGSTR1B2B(businessId, month),
    getGSTR1B2CLarge(businessId, month),
    getGSTR1B2CSmall(businessId, month),
    getGSTR1NilExempt(businessId, month),
    getGSTR1CreditNotes(businessId, month),
    getGSTR1DocSummary(businessId, month),
    getGSTR1HSNSummary(businessId, month)
  ])

  // Also get sales register for the month
  const { from, to } = getMonthDateRange(month)
  const salesRegister = await getSalesRegister(businessId, from.toISOString().split('T')[0], to.toISOString().split('T')[0])

  return {
    month,
    generatedAt: new Date().toISOString(),
    gstr3b,
    gstr1: {
      b2b,
      b2cLarge,
      b2cSmall,
      nilExempt,
      creditNotes,
      docSummary,
      hsnSummary
    },
    salesRegister
  }
}
