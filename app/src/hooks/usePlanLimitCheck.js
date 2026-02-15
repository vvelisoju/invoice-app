import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { plansApi } from '../lib/api'

/**
 * Hook to pre-check plan limits before opening add/create modals.
 *
 * Uses React Query's fetchQuery with a 30-second staleTime so repeated clicks
 * within that window hit the cache instead of making a new network request.
 * After mutations (create/delete customer/product, save invoice) the cache is
 * automatically invalidated by those mutation's onSuccess handlers, so the next
 * check will fetch fresh data.
 *
 * Usage:
 *   const { planLimitData, setPlanLimitData, checkLimit } = usePlanLimitCheck()
 *   const handleAdd = async () => {
 *     const blocked = await checkLimit('customer')
 *     if (blocked) return // PlanLimitModal will show automatically
 *     setShowAddModal(true)
 *   }
 */

const PLAN_USAGE_QUERY_KEY = ['plan-usage']
const PLAN_USAGE_STALE_TIME = 30_000 // 30 seconds

export default function usePlanLimitCheck() {
  const queryClient = useQueryClient()
  const [planLimitData, setPlanLimitData] = useState(null)

  /**
   * Check if the user can create a resource of the given type.
   * Uses cached plan usage data (30s staleTime) to avoid redundant API calls.
   * @param {'customer' | 'product' | 'invoice'} resourceType
   * @returns {Promise<boolean>} true if limit reached (blocked), false if allowed
   */
  const checkLimit = useCallback(async (resourceType) => {
    try {
      const usage = await queryClient.fetchQuery({
        queryKey: PLAN_USAGE_QUERY_KEY,
        queryFn: async () => {
          const response = await plansApi.getUsage()
          // Server returns { data: { plan, usage, canCreateProduct, ... } }
          // Axios wraps it as response.data = { data: { ... } }
          return response.data.data || response.data
        },
        staleTime: PLAN_USAGE_STALE_TIME,
      })

      if (resourceType === 'customer' && !usage.canCreateCustomer) {
        setPlanLimitData({ type: 'customer', usage })
        return true
      }
      if (resourceType === 'product' && !usage.canCreateProduct) {
        setPlanLimitData({ type: 'product', usage })
        return true
      }
      if (resourceType === 'invoice' && !usage.canIssueInvoice) {
        setPlanLimitData({ type: 'invoice', usage })
        return true
      }

      return false
    } catch {
      // If usage check fails, allow the action (server will still enforce)
      return false
    }
  }, [queryClient])

  return { planLimitData, setPlanLimitData, checkLimit }
}

export { PLAN_USAGE_QUERY_KEY }
