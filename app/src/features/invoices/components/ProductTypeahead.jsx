import { useState, useEffect } from 'react'
import {
  IonInput,
  IonList,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/react'
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
      
      // Try local first
      const localProducts = await db.products
        .where('businessId')
        .equals(business?.id)
        .toArray()
      
      const filtered = localProducts.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)

      if (filtered.length > 0) return filtered

      // Fall back to API
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
    const newValue = e.detail.value
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
    <div style={{ position: 'relative', flex: 1 }}>
      <IonInput
        value={query}
        placeholder="Item name"
        onIonInput={handleInputChange}
        onIonFocus={() => setShowSuggestions(true)}
        onIonBlur={handleBlur}
        style={{ '--padding-start': '0' }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <IonList style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '0 0 8px 8px',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          {suggestions.map((product) => (
            <IonItem
              key={product.id}
              button
              onClick={() => handleSelect(product)}
              style={{ '--min-height': '44px' }}
            >
              <IonLabel>
                <h3 style={{ fontSize: '14px' }}>{product.name}</h3>
                {product.defaultRate && (
                  <IonText color="medium">
                    <p style={{ fontSize: '12px' }}>₹{product.defaultRate}</p>
                  </IonText>
                )}
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  )
}
