import { useState, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  useIonToast
} from '@ionic/react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../lib/api'

export default function PhonePage() {
  const [phone, setPhone] = useState('')
  const inputRef = useRef(null)
  const [present] = useIonToast()
  const history = useHistory()

  const requestOTPMutation = useMutation({
    mutationFn: authApi.requestOTP,
    onSuccess: () => {
      present({
        message: 'OTP sent successfully! Check your phone.',
        duration: 3000,
        color: 'success'
      })
      history.push('/auth/verify', { phone })
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to send OTP',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted with phone:', phone)
    
    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      console.log('Phone validation failed')
      present({
        message: 'Please enter a valid 10-digit phone number',
        duration: 3000,
        color: 'warning'
      })
      return
    }

    console.log('Calling API with phone:', phone)
    requestOTPMutation.mutate(phone)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto', 
          paddingTop: '60px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Invoice App 
          </h1>
          <IonText color="medium">
            <p style={{ marginBottom: '40px' }}>
              Enter your phone number to get started
            </p>
          </IonText>

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="tel"
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              inputMode="numeric"
              disabled={requestOTPMutation.isPending}
              style={{
                width: '100%',
                height: '56px',
                padding: '0 16px',
                fontSize: '18px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '24px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3880ff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />

            <button
              type="submit"
              disabled={requestOTPMutation.isPending || phone.length !== 10}
              style={{
                width: '100%',
                height: '56px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: (requestOTPMutation.isPending || phone.length !== 10) ? '#ccc' : '#3880ff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (requestOTPMutation.isPending || phone.length !== 10) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!requestOTPMutation.isPending && phone.length === 10) {
                  e.target.style.backgroundColor = '#3171e0'
                }
              }}
              onMouseLeave={(e) => {
                if (!requestOTPMutation.isPending && phone.length === 10) {
                  e.target.style.backgroundColor = '#3880ff'
                }
              }}
            >
              {requestOTPMutation.isPending ? (
                <IonSpinner name="crescent" />
              ) : (
                'SEND OTP'
              )}
            </button>
          </form>

          <IonText color="medium">
            <p style={{ marginTop: '24px', fontSize: '14px' }}>
              We'll send you a 6-digit verification code
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  )
}
