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
