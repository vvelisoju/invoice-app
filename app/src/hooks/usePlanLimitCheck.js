import { useState, useCallback } from 'react'
import { plansApi } from '../lib/api'

/**
 * Hook to pre-check plan limits before opening add/create modals.
 * Returns { planLimitData, setPlanLimitData, checkLimit }
 *
 * Usage:
 *   const { planLimitData, setPlanLimitData, checkLimit } = usePlanLimitCheck()
 *   const handleAdd = async () => {
 *     const blocked = await checkLimit('customer') // or 'product' or 'invoice'
 *     if (blocked) return // PlanLimitModal will show automatically
 *     setShowAddModal(true)
 *   }
 */
export default function usePlanLimitCheck() {
  const [planLimitData, setPlanLimitData] = useState(null)

  /**
   * Check if the user can create a resource of the given type.
   * @param {'customer' | 'product' | 'invoice'} resourceType
   * @returns {Promise<boolean>} true if limit reached (blocked), false if allowed
   */
  const checkLimit = useCallback(async (resourceType) => {
    try {
      const { data: usage } = await plansApi.getUsage()

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
  }, [])

  return { planLimitData, setPlanLimitData, checkLimit }
}
