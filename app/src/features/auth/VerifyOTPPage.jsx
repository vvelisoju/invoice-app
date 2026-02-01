import { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  IonBackButton,
  IonButtons,
  useIonToast
} from '@ionic/react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [present] = useIonToast()
  const history = useHistory()
  const location = useLocation()
  const inputRefs = useRef([])
  const setAuth = useAuthStore((state) => state.setAuth)

  const phone = location.state?.phone

  useEffect(() => {
    if (!phone) {
      history.replace('/auth/phone')
    }
  }, [phone, history])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const verifyOTPMutation = useMutation({
    mutationFn: ({ phone, otp }) => authApi.verifyOTP(phone, otp),
    onSuccess: (response) => {
      const { token, user, business } = response.data
      setAuth(token, user, business)
      
      present({
        message: 'Welcome! Setting up your workspace...',
        duration: 2000,
        color: 'success'
      })
      
      // Redirect to new invoice
      setTimeout(() => {
        history.replace('/invoices/new')
      }, 500)
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Invalid OTP',
        duration: 3000,
        color: 'danger'
      })
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  })

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      const otpString = [...newOtp.slice(0, 5), value].join('')
      verifyOTPMutation.mutate({ phone, otp: otpString })
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendOTP = () => {
    // TODO: Implement resend OTP
    present({
      message: 'OTP resent successfully',
      duration: 2000,
      color: 'success'
    })
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/auth/phone" />
          </IonButtons>
          <IonTitle>Verify OTP</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto', 
          paddingTop: '60px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Enter verification code
          </h2>
          <IonText color="medium">
            <p style={{ marginBottom: '40px' }}>
              We sent a code to {phone}
            </p>
          </IonText>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={verifyOTPMutation.isPending}
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '24px',
                  textAlign: 'center',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  backgroundColor: verifyOTPMutation.isPending ? '#f5f5f5' : 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0'
                }}
              />
            ))}
          </div>

          {verifyOTPMutation.isPending && (
            <div style={{ marginBottom: '24px' }}>
              <IonSpinner name="crescent" />
              <IonText color="medium">
                <p style={{ marginTop: '8px' }}>Verifying...</p>
              </IonText>
            </div>
          )}

          <IonButton
            fill="clear"
            onClick={handleResendOTP}
            disabled={verifyOTPMutation.isPending}
          >
            Didn't receive code? Resend
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
