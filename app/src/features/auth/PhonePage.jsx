import { useState } from 'react'
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
    
    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      present({
        message: 'Please enter a valid 10-digit phone number',
        duration: 3000,
        color: 'warning'
      })
      return
    }

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
            Invoice App 123123
          </h1>
          <IonText color="medium">
            <p style={{ marginBottom: '40px' }}>
              Enter your phone number to get started
            </p>
          </IonText>

          <form onSubmit={handleSubmit}>
            <IonInput
              type="tel"
              placeholder="10-digit phone number"
              value={phone}
              onIonInput={(e) => setPhone(e.detail.value || '')}
              maxlength={10}
              inputmode="numeric"
              style={{
                '--background': '#f5f5f5',
                '--padding-start': '16px',
                '--padding-end': '16px',
                marginBottom: '24px',
                fontSize: '18px',
                height: '56px',
                borderRadius: '8px'
              }}
              disabled={requestOTPMutation.isPending}
            />

            <IonButton
              expand="block"
              type="submit"
              disabled={requestOTPMutation.isPending || phone.length !== 10}
              style={{ height: '56px', fontSize: '16px', fontWeight: '600' }}
            >
              {requestOTPMutation.isPending ? (
                <IonSpinner name="crescent" />
              ) : (
                'Send OTP'
              )}
            </IonButton>
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
