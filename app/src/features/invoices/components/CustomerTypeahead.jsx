import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customerApi } from '../../../lib/api'
import { db } from '../../../db'
import { useAuthStore } from '../../../store/authStore'

export default function CustomerTypeahead({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const business = useAuthStore((state) => state.business)

  const { data: suggestions = [] } = useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      
      const localCustomers = await db.customers
        .where('businessId')
        .equals(business?.id)
        .toArray()
      
      const filtered = localCustomers.filter(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query)
      ).slice(0, 5)

      if (filtered.length > 0) return filtered

      try {
        const response = await customerApi.search(query)
        return response.data || []
      } catch {
        return []
      }
    },
    enabled: query.length >= 2
  })

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange?.(newValue)
    setShowSuggestions(true)
  }

  const handleSelect = (customer) => {
    setQuery(customer.name)
    onSelect?.(customer)
    setShowSuggestions(false)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Customer</label>
      <input
        type="text"
        value={query}
        placeholder="Search by name or phone"
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        className="w-full px-3 py-2.5 bg-bgPrimary border border-border rounded-lg text-sm text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-border rounded-b-lg shadow-lg max-h-48 overflow-auto">
          {suggestions.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelect(customer)}
              className="w-full px-4 py-3 text-left hover:bg-bgPrimary transition-colors border-b border-border last:border-b-0"
            >
              <div className="text-sm font-medium text-textPrimary">{customer.name}</div>
              {customer.phone && (
                <div className="text-xs text-textSecondary">{customer.phone}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
