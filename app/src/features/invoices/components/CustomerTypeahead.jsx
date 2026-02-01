import { useState, useEffect } from 'react'
import {
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonText
} from '@ionic/react'
import { useQuery } from '@tanstack/react-query'
import { customerApi } from '../../../lib/api'
import { db } from '../../../db'
import { useAuthStore } from '../../../store/authStore'

export default function CustomerTypeahead({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const business = useAuthStore((state) => state.business)

  // Search customers (local first, then API)
  const { data: suggestions = [] } = useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      
      // Try local first
      const localCustomers = await db.customers
        .where('businessId')
        .equals(business?.id)
        .toArray()
      
      const filtered = localCustomers.filter(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query)
      ).slice(0, 5)

      if (filtered.length > 0) return filtered

      // Fall back to API
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
    const newValue = e.detail.value
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
    // Delay to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200)
  }

  return (
    <div style={{ position: 'relative' }}>
      <IonItem>
        <IonLabel position="stacked">Customer</IonLabel>
        <IonInput
          value={query}
          placeholder="Search by name or phone"
          onIonInput={handleInputChange}
          onIonFocus={() => setShowSuggestions(true)}
          onIonBlur={handleBlur}
        />
      </IonItem>

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
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {suggestions.map((customer) => (
            <IonItem
              key={customer.id}
              button
              onClick={() => handleSelect(customer)}
              style={{ '--min-height': '48px' }}
            >
              <IonLabel>
                <h3>{customer.name}</h3>
                {customer.phone && (
                  <IonText color="medium">
                    <p style={{ fontSize: '12px' }}>{customer.phone}</p>
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
