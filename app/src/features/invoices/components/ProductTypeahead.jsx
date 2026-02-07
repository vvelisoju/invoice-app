import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '../../../lib/api'
import { db } from '../../../db'
import { useAuthStore } from '../../../store/authStore'

export default function ProductTypeahead({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const business = useAuthStore((state) => state.business)

  const { data: suggestions = [] } = useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      
      const localProducts = await db.products
        .where('businessId')
        .equals(business?.id)
        .toArray()
      
      const filtered = localProducts.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)

      if (filtered.length > 0) return filtered

      try {
        const response = await productApi.search(query)
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

  const handleSelect = (product) => {
    setQuery(product.name)
    onSelect?.(product)
    setShowSuggestions(false)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={query}
        placeholder="Item name"
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        className="w-full bg-transparent text-sm text-textPrimary placeholder-textSecondary/40 focus:outline-none"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-border rounded-b-lg shadow-lg max-h-36 overflow-auto">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full px-3 py-2.5 text-left hover:bg-bgPrimary transition-colors border-b border-border last:border-b-0"
            >
              <div className="text-sm text-textPrimary">{product.name}</div>
              {product.defaultRate && (
                <div className="text-xs text-textSecondary">₹{product.defaultRate}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
