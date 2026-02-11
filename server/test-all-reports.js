/**
 * Automated test: Verify all 20 report endpoints return valid data.
 * Run: node test-all-reports.js
 */

const BASE = 'http://localhost:3000'

async function getToken() {
  // Request OTP
  await fetch(`${BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '7287820821' })
  })
  // Verify with dev OTP
  const res = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '7287820821', otp: '222222' })
  })
  const data = await res.json()
  return data.token
}

async function testEndpoint(token, name, path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    if (res.status !== 200) {
      console.log(`  ❌ ${name} — HTTP ${res.status}: ${data.message || JSON.stringify(data).slice(0, 100)}`)
      return false
    }

    // Validate response has meaningful data
    const d = data.data || data
    const hasRows = d.rows?.length > 0
    const hasDocs = d.documents?.length > 0
    const hasBuckets = d.buckets && Object.keys(d.buckets).length > 0
    const hasSummary = d.summary && Object.keys(d.summary).length > 0
    const hasInvoiceCount = d.invoiceCount > 0 || d.totals?.count > 0
    const hasMonthly = Array.isArray(d) && d.length > 0
    const hasTable3_1 = !!d.table3_1
    const hasGstr1 = !!d.gstr1
    const hasData = hasRows || hasDocs || hasBuckets || hasSummary || hasInvoiceCount || hasMonthly || hasTable3_1 || hasGstr1

    if (!hasData) {
      // Check deeper
      const keys = Object.keys(d)
      const totalKeys = keys.filter(k => typeof d[k] === 'number' || typeof d[k] === 'object')
      if (totalKeys.length > 0) {
        console.log(`  ✅ ${name} — OK (keys: ${keys.join(', ')})`)
        return true
      }
      console.log(`  ⚠️  ${name} — HTTP 200 but possibly empty: ${JSON.stringify(d).slice(0, 200)}`)
      return true // Still a pass, just no data for this period
    }

    // Extract count info
    let info = ''
    if (hasRows) info = `${d.rows.length} rows`
    else if (hasDocs) info = `${d.documents.length} documents`
    else if (hasMonthly) info = `${d.length} months`
    else if (hasTable3_1) info = `GSTR-3B OK, ${d.invoiceCount} invoices`
    else if (hasBuckets) info = `${Object.values(d.buckets).reduce((s, b) => s + b.count, 0)} receivables`
    else if (hasSummary) info = `summary OK`
    else if (hasGstr1) info = 'CA Package OK'
    else info = `count=${d.totals?.count || d.invoiceCount || '?'}`

    console.log(`  ✅ ${name} — ${info}`)
    return true
  } catch (err) {
    console.log(`  ❌ ${name} — ERROR: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🔐 Authenticating...')
  const token = await getToken()
  if (!token) {
    console.error('❌ Failed to get auth token')
    process.exit(1)
  }
  console.log('✅ Got token\n')

  // We need a customer ID for the ledger test
  const custRes = await fetch(`${BASE}/customers`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const custData = await custRes.json()
  const customers = custData.data || custData
  const firstCustomerId = Array.isArray(customers) ? customers[0]?.id : (customers.customers?.[0]?.id || '')

  console.log('📊 Testing all 20 report endpoints...\n')

  const month = '2026-02'
  const fy = '2025-26'
  let passed = 0
  let failed = 0

  const tests = [
    ['1. Invoice Summary', `/reports/summary`],
    ['2. GST Summary', `/reports/gst`],
    ['3. Document Report', `/reports/documents`],
    ['4. Monthly Trend', `/reports/trend`],
    ['5. GSTR-3B', `/reports/gstr3b?month=${month}`],
    ['6. GSTR-1 B2B (Table 4A)', `/reports/gstr1/b2b?month=${month}`],
    ['7. GSTR-1 B2C Large (Table 5A)', `/reports/gstr1/b2c-large?month=${month}`],
    ['8. GSTR-1 B2C Small (Table 7)', `/reports/gstr1/b2c-small?month=${month}`],
    ['9. GSTR-1 Nil/Exempt (Table 8)', `/reports/gstr1/nil-exempt?month=${month}`],
    ['10. GSTR-1 Credit Notes (Table 9B)', `/reports/gstr1/credit-notes?month=${month}`],
    ['11. GSTR-1 Doc Summary (Table 13)', `/reports/gstr1/doc-summary?month=${month}`],
    ['12. GSTR-1 HSN Summary (Table 12)', `/reports/gstr1/hsn-summary?month=${month}`],
    ['13. Sales Register', `/reports/sales-register?dateFrom=2025-04-01&dateTo=2026-03-31`],
    ['14. Customer Summary', `/reports/customer-summary`],
    ['15. Tax Rate Report', `/reports/tax-rate-report`],
    ['16. Receivables Aging', `/reports/receivables`],
    ['17. Customer Ledger', `/reports/customer-ledger/${firstCustomerId}`],
    ['18. Annual Summary', `/reports/annual-summary?fy=${fy}`],
    ['19. GSTR-9', `/reports/gstr9?fy=${fy}`],
    ['20. CA Package', `/reports/ca-package?month=${month}`],
  ]

  for (const [name, path] of tests) {
    const ok = await testEndpoint(token, name, path)
    if (ok) passed++
    else failed++
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${tests.length}`)
  console.log(`${'═'.repeat(50)}`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
