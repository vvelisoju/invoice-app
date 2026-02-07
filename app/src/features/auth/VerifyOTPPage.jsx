import { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
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
    inputRefs.current[0]?.focus()
  }, [])

  const verifyOTPMutation = useMutation({
    mutationFn: ({ phone, otp }) => authApi.verifyOTP(phone, otp),
    onSuccess: (response) => {
      const { token, user, business } = response.data
      setAuth(token, user, business)
      setTimeout(() => {
        history.replace('/invoices/new')
      }, 500)
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  })

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return
    setError('')

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

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
    setError('')
    // TODO: Implement resend OTP via API
  }

  return (
    <div className="min-h-screen bg-bgPrimary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => history.push('/auth/phone')}
          className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Card */}
        <div className="bg-bgSecondary rounded-2xl shadow-card border border-border p-8 text-center">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">
            Enter verification code
          </h2>
          <p className="text-textSecondary text-sm mb-8">
            We sent a code to {phone}
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-3 justify-center mb-6">
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
                className="w-12 h-14 text-2xl text-center border-2 border-border rounded-xl bg-white text-textPrimary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:bg-bgPrimary disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {verifyOTPMutation.isPending && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-textSecondary">Verifying...</p>
            </div>
          )}

          <button
            onClick={handleResendOTP}
            disabled={verifyOTPMutation.isPending}
            className="text-sm text-primary hover:underline disabled:text-textSecondary disabled:cursor-not-allowed"
          >
            Didn't receive code? Resend
          </button>
        </div>
      </div>
    </div>
  )
}
