import { prisma } from '../../common/prisma.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
import { generateToken } from '../../common/auth.js'

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getDashboardStats(filters = {}) {
  const now = new Date()
  const { from, to } = filters

  // Date range for filtered stats
  const rangeFrom = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1)
  const rangeTo = to ? new Date(new Date(to).getTime() + 86400000) : now // end of "to" day

  // Previous period of same length for comparison
  const rangeDuration = rangeTo.getTime() - rangeFrom.getTime()
  const prevFrom = new Date(rangeFrom.getTime() - rangeDuration)
  const prevTo = new Date(rangeFrom)

  // Fixed time anchors (always relative to now, not the filter)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // ── All-time totals ────────────────────────────────────────────────────
  const [
    totalUsers,
    totalBusinesses,
    totalInvoices,
    totalCustomers,
    totalProducts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.invoice.count(),
    prisma.customer.count(),
    prisma.productService.count()
  ])

  // ── Filtered-range stats ───────────────────────────────────────────────
  const rangeWhere = { createdAt: { gte: rangeFrom, lt: rangeTo } }
  const prevWhere = { createdAt: { gte: prevFrom, lt: prevTo } }

  const [
    usersInRange,
    usersInPrev,
    businessesInRange,
    businessesInPrev,
    invoicesInRange,
    invoicesInPrev,
    customersInRange,
    productsInRange,
    invoiceAmounts,
    prevInvoiceAmounts
  ] = await Promise.all([
    prisma.user.count({ where: rangeWhere }),
    prisma.user.count({ where: prevWhere }),
    prisma.business.count({ where: rangeWhere }),
    prisma.business.count({ where: prevWhere }),
    prisma.invoice.count({ where: rangeWhere }),
    prisma.invoice.count({ where: prevWhere }),
    prisma.customer.count({ where: rangeWhere }),
    prisma.productService.count({ where: rangeWhere }),
    prisma.invoice.aggregate({ where: rangeWhere, _sum: { total: true }, _avg: { total: true }, _max: { total: true } }),
    prisma.invoice.aggregate({ where: prevWhere, _sum: { total: true } })
  ])

  // ── Quick "today / this week / this month" counts (always live) ────────
  const [newUsersToday, newUsersThisWeek, newUsersThisMonth, invoicesToday] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.invoice.count({ where: { createdAt: { gte: startOfDay } } })
  ])

  // ── Activity & health ──────────────────────────────────────────────────
  const [
    activeBusinesses,
    businessStatusBreakdown,
    userStatusBreakdown,
    planDistribution,
    revenueData,
    invoiceStatusBreakdown,
    recentSignups,
    topBusinesses
  ] = await Promise.all([
    prisma.business.count({
      where: { invoices: { some: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } } }
    }),
    prisma.business.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.user.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.business.groupBy({ by: ['planId'], _count: { id: true } }),
    prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: rangeWhere,
      _count: { id: true },
      _sum: { total: true }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { id: true, phone: true, name: true, email: true, role: true, createdAt: true }
    }),
    prisma.business.findMany({
      orderBy: { invoices: { _count: 'desc' } },
      take: 10,
      select: {
        id: true, name: true, status: true,
        owner: { select: { phone: true, name: true } },
        plan: { select: { displayName: true } },
        _count: { select: { invoices: true, customers: true } },
        createdAt: true
      }
    })
  ])

  // ── Daily trend (signups + invoices per day within range, max 90 days) ─
  const maxTrendDays = Math.min(Math.ceil(rangeDuration / 86400000), 90)
  const trendStartDate = new Date(rangeTo.getTime() - maxTrendDays * 86400000)

  const [dailyUsers, dailyInvoices] = await Promise.all([
    prisma.$queryRawUnsafe(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "User" WHERE "createdAt" >= $1 AND "createdAt" < $2 GROUP BY DATE("createdAt") ORDER BY date`,
      trendStartDate, rangeTo
    ),
    prisma.$queryRawUnsafe(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "Invoice" WHERE "createdAt" >= $1 AND "createdAt" < $2 GROUP BY DATE("createdAt") ORDER BY date`,
      trendStartDate, rangeTo
    )
  ])

  // ── Resolve plan names ─────────────────────────────────────────────────
  const planIds = planDistribution.map(p => p.planId).filter(Boolean)
  const plans = planIds.length > 0
    ? await prisma.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, displayName: true } })
    : []
  const planMap = Object.fromEntries(plans.map(p => [p.id, p.displayName]))

  // ── Helpers ────────────────────────────────────────────────────────────
  const pct = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : (curr > 0 ? 100 : 0)
  const toNum = (v) => v ? Number(v) : 0

  return {
    // Filter metadata
    dateRange: { from: rangeFrom.toISOString(), to: rangeTo.toISOString() },

    // All-time totals
    overview: {
      totalUsers,
      totalBusinesses,
      totalInvoices,
      totalCustomers,
      totalProducts,
      activeBusinesses,
      dormantBusinesses: totalBusinesses - activeBusinesses
    },

    // Live quick stats (always "now" based)
    live: {
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      invoicesToday
    },

    // Filtered range stats with comparison
    rangeStats: {
      users: { count: usersInRange, prev: usersInPrev, growth: pct(usersInRange, usersInPrev) },
      businesses: { count: businessesInRange, prev: businessesInPrev, growth: pct(businessesInRange, businessesInPrev) },
      invoices: { count: invoicesInRange, prev: invoicesInPrev, growth: pct(invoicesInRange, invoicesInPrev) },
      customers: { count: customersInRange },
      products: { count: productsInRange },
      invoiceRevenue: {
        total: toNum(invoiceAmounts._sum.total),
        avg: toNum(invoiceAmounts._avg.total),
        max: toNum(invoiceAmounts._max.total),
        prevTotal: toNum(prevInvoiceAmounts._sum.total),
        growth: pct(toNum(invoiceAmounts._sum.total), toNum(prevInvoiceAmounts._sum.total))
      }
    },

    // Breakdowns
    businessStatusBreakdown: businessStatusBreakdown.map(b => ({ status: b.status, count: b._count.id })),
    userStatusBreakdown: userStatusBreakdown.map(u => ({ status: u.status, count: u._count.id })),
    invoiceStatusBreakdown: invoiceStatusBreakdown.map(i => ({
      status: i.status, count: i._count.id, total: toNum(i._sum.total)
    })),
    planBreakdown: planDistribution.map(p => ({
      planId: p.planId,
      planName: p.planId ? (planMap[p.planId] || 'Unknown') : 'No Plan',
      count: p._count.id
    })),

    // Revenue
    revenue: {
      activeSubscriptions: revenueData._count.id,
      mrr: toNum(revenueData._sum.amount)
    },

    // Trends (daily)
    trends: {
      users: dailyUsers.map(r => ({ date: r.date, count: r.count })),
      invoices: dailyInvoices.map(r => ({ date: r.date, count: r.count }))
    },

    // Lists
    topBusinesses,
    recentSignups
  }
}

// ============================================================================
// BUSINESS MANAGEMENT
// ============================================================================

export async function listBusinesses(filters = {}) {
  const {
    search, planId, status, gstEnabled, createdFrom, createdTo,
    sortBy = 'createdAt', sortOrder = 'desc', limit = 20, offset = 0
  } = filters

  const where = {
    ...(status && { status }),
    ...(planId && { planId }),
    ...(gstEnabled !== undefined && gstEnabled !== '' && { gstEnabled: gstEnabled === 'true' || gstEnabled === true }),
    ...((createdFrom || createdTo) && {
      createdAt: {
        ...(createdFrom && { gte: new Date(createdFrom) }),
        ...(createdTo && { lt: new Date(new Date(createdTo).getTime() + 86400000) })
      }
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
        { owner: { phone: { contains: search } } },
        { owner: { name: { contains: search, mode: 'insensitive' } } }
      ]
    })
  }

  // Determine orderBy — support nested sort for invoices/customers count
  let orderBy = { [sortBy]: sortOrder }
  if (sortBy === 'invoices') orderBy = { invoices: { _count: sortOrder } }
  else if (sortBy === 'customers') orderBy = { customers: { _count: sortOrder } }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        owner: { select: { id: true, phone: true, name: true, email: true, role: true, status: true, createdAt: true } },
        plan: { select: { id: true, name: true, displayName: true } },
        subscription: { select: { id: true, status: true, amount: true, currency: true, startDate: true, renewAt: true, cancelledAt: true } },
        _count: { select: { invoices: true, customers: true, products: true, taxRates: true } }
      },
      orderBy,
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.business.count({ where })
  ])

  return { businesses, total, limit: parseInt(limit), offset: parseInt(offset) }
}

export async function getBusinessDetails(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      owner: { select: { id: true, phone: true, name: true, email: true, role: true, status: true, createdAt: true } },
      plan: true,
      subscription: true,
      templateConfigs: {
        include: { baseTemplate: { select: { id: true, name: true, description: true } } }
      },
      _count: {
        select: { invoices: true, customers: true, products: true, taxRates: true }
      }
    }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  // Get current month usage
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const usage = await prisma.usageCounter.findUnique({
    where: { businessId_monthKey: { businessId, monthKey } }
  })

  // Get all invoices (last 50) with full detail
  const recentInvoices = await prisma.invoice.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, invoiceNumber: true, documentType: true, status: true,
      total: true, subtotal: true, taxTotal: true, date: true, dueDate: true,
      issuedAt: true, createdAt: true,
      customer: { select: { id: true, name: true, phone: true } }
    }
  })

  // Invoice aggregates
  const invoiceAggregates = await prisma.invoice.aggregate({
    where: { businessId },
    _sum: { total: true },
    _avg: { total: true },
    _max: { total: true },
    _count: { id: true }
  })

  // Invoice status breakdown
  const invoiceStatusBreakdown = await prisma.invoice.groupBy({
    by: ['status'],
    where: { businessId },
    _count: { id: true },
    _sum: { total: true }
  })

  // Customers (last 50)
  const customers = await prisma.customer.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, name: true, phone: true, email: true, gstin: true,
      billingAddress: true, createdAt: true,
      _count: { select: { invoices: true } }
    }
  })

  // Products (last 50)
  const products = await prisma.productService.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, name: true, type: true, rate: true, unit: true,
      hsnCode: true, taxRate: true, createdAt: true
    }
  })

  // Tax rates
  const taxRates = await prisma.taxRate.findMany({
    where: { businessId },
    select: { id: true, name: true, rate: true, isDefault: true, createdAt: true }
  })

  return {
    ...business,
    usage: usage || { invoicesIssuedCount: 0, customersCount: 0, productsCount: 0 },
    recentInvoices,
    invoiceAggregates: {
      totalRevenue: invoiceAggregates._sum.total ? Number(invoiceAggregates._sum.total) : 0,
      avgInvoice: invoiceAggregates._avg.total ? Number(invoiceAggregates._avg.total) : 0,
      maxInvoice: invoiceAggregates._max.total ? Number(invoiceAggregates._max.total) : 0,
      count: invoiceAggregates._count.id
    },
    invoiceStatusBreakdown: invoiceStatusBreakdown.map(s => ({
      status: s.status, count: s._count.id, total: s._sum.total ? Number(s._sum.total) : 0
    })),
    customers,
    products,
    taxRates
  }
}

export async function updateBusinessStatus(businessId, status) {
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED']
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) throw new NotFoundError('Business not found')

  return prisma.business.update({
    where: { id: businessId },
    data: { status },
    include: {
      owner: { select: { id: true, phone: true, name: true } },
      plan: { select: { id: true, displayName: true } }
    }
  })
}

export async function updateBusinessPlan(businessId, planId) {
  const [business, plan] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.plan.findUnique({ where: { id: planId } })
  ])

  if (!business) throw new NotFoundError('Business not found')
  if (!plan) throw new NotFoundError('Plan not found')

  return prisma.business.update({
    where: { id: businessId },
    data: { planId },
    include: {
      plan: { select: { id: true, name: true, displayName: true } }
    }
  })
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function listUsers(filters = {}) {
  const { search, role, status, sortBy = 'createdAt', sortOrder = 'desc', limit = 20, offset = 0 } = filters

  const where = {
    ...(role && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { phone: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, phone: true, name: true, email: true, role: true, status: true,
        otpVerifiedAt: true, createdAt: true, updatedAt: true,
        businesses: {
          select: {
            id: true, name: true, status: true,
            plan: { select: { id: true, displayName: true } },
            _count: { select: { invoices: true } }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.user.count({ where })
  ])

  return { users, total, limit: parseInt(limit), offset: parseInt(offset) }
}

export async function getUserDetails(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        include: {
          plan: true,
          subscription: true,
          _count: { select: { invoices: true, customers: true, products: true } }
        }
      },
      otpRequests: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, phone: true, verified: true, createdAt: true }
      }
    }
  })

  if (!user) throw new NotFoundError('User not found')

  return user
}

export async function updateUserRole(userId, role) {
  const validRoles = ['USER', 'SUPER_ADMIN']
  if (!validRoles.includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError('User not found')

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, phone: true, name: true, role: true, status: true }
  })
}

export async function updateUserStatus(userId, status) {
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED']
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError('User not found')

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, phone: true, name: true, role: true, status: true }
  })
}

// ============================================================================
// IMPERSONATION (Admin views as a business user)
// ============================================================================

export async function impersonateBusiness(adminUserId, businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: { select: { id: true, phone: true, name: true, role: true, status: true } } }
  })

  if (!business) throw new NotFoundError('Business not found')

  // Generate a short-lived token for the business user context
  const token = generateToken({
    userId: business.owner.id,
    phone: business.owner.phone,
    businessId: business.id,
    role: business.owner.role,
    status: business.owner.status,
    impersonatedBy: adminUserId
  })

  return {
    token,
    user: business.owner,
    business: { id: business.id, name: business.name }
  }
}

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

export async function getPlatformSettings() {
  const settings = await prisma.platformSetting.findMany()
  return Object.fromEntries(settings.map(s => [s.key, s.value]))
}

export async function updatePlatformSetting(key, value, adminUserId) {
  return prisma.platformSetting.upsert({
    where: { key },
    update: { value, updatedBy: adminUserId },
    create: { key, value, updatedBy: adminUserId }
  })
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function listAuditLogs(filters = {}) {
  const { businessId, userId, entityType, action, limit = 50, offset = 0 } = filters

  const where = {
    ...(businessId && { businessId }),
    ...(userId && { userId }),
    ...(entityType && { entityType }),
    ...(action && { action })
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.auditLog.count({ where })
  ])

  return { logs, total, limit: parseInt(limit), offset: parseInt(offset) }
}
