import * as reportsService from './service.js'

export async function getInvoiceSummary(request, reply) {
  const { dateFrom, dateTo } = request.query
  const summary = await reportsService.getInvoiceSummary(
    request.businessId,
    dateFrom,
    dateTo
  )
  return { data: summary }
}

export async function getGSTSummary(request, reply) {
  const { dateFrom, dateTo } = request.query
  const summary = await reportsService.getGSTSummary(
    request.businessId,
    dateFrom,
    dateTo
  )
  return { data: summary }
}

export async function getDocumentReport(request, reply) {
  const result = await reportsService.getDocumentReport(
    request.businessId,
    request.query
  )
  return { data: result }
}

export async function getMonthlyTrend(request, reply) {
  const { months } = request.query
  const trend = await reportsService.getMonthlyTrend(
    request.businessId,
    months ? parseInt(months) : 6
  )
  return { data: trend }
}

export async function getGSTR3BSummary(request, reply) {
  const { month } = request.query
  const summary = await reportsService.getGSTR3BSummary(
    request.businessId,
    month
  )
  return { data: summary }
}

export async function getGSTR1B2B(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1B2B(
    request.businessId,
    month
  )
  return { data: result }
}

export async function getSalesRegister(request, reply) {
  const { dateFrom, dateTo } = request.query
  const result = await reportsService.getSalesRegister(
    request.businessId,
    dateFrom,
    dateTo
  )
  return { data: result }
}

export async function getGSTR1B2CLarge(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1B2CLarge(request.businessId, month)
  return { data: result }
}

export async function getGSTR1B2CSmall(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1B2CSmall(request.businessId, month)
  return { data: result }
}

export async function getGSTR1NilExempt(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1NilExempt(request.businessId, month)
  return { data: result }
}

export async function getGSTR1CreditNotes(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1CreditNotes(request.businessId, month)
  return { data: result }
}

export async function getGSTR1DocSummary(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1DocSummary(request.businessId, month)
  return { data: result }
}

export async function getCustomerSummary(request, reply) {
  const { dateFrom, dateTo } = request.query
  const result = await reportsService.getCustomerSummary(request.businessId, dateFrom, dateTo)
  return { data: result }
}

export async function getTaxRateReport(request, reply) {
  const { dateFrom, dateTo } = request.query
  const result = await reportsService.getTaxRateReport(request.businessId, dateFrom, dateTo)
  return { data: result }
}

export async function getReceivablesAging(request, reply) {
  const { asOfDate } = request.query
  const result = await reportsService.getReceivablesAging(request.businessId, asOfDate)
  return { data: result }
}

export async function getCustomerLedger(request, reply) {
  const { dateFrom, dateTo } = request.query
  const { customerId } = request.params
  const result = await reportsService.getCustomerLedger(request.businessId, customerId, dateFrom, dateTo)
  return { data: result }
}

export async function getAnnualSummary(request, reply) {
  const { fy } = request.query
  const result = await reportsService.getAnnualSummary(request.businessId, fy)
  return { data: result }
}

export async function getGSTR9Data(request, reply) {
  const { fy } = request.query
  const result = await reportsService.getGSTR9Data(request.businessId, fy)
  return { data: result }
}

export async function getGSTR1HSNSummary(request, reply) {
  const { month } = request.query
  const result = await reportsService.getGSTR1HSNSummary(request.businessId, month)
  return { data: result }
}

export async function getCAPackage(request, reply) {
  const { month } = request.query
  const result = await reportsService.getCAPackage(request.businessId, month)
  return { data: result }
}
