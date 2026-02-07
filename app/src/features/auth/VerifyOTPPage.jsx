import { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { FileText, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
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

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

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

  const resendOTPMutation = useMutation({
    mutationFn: () => authApi.requestOTP(phone),
    onSuccess: () => {
      setResendTimer(30)
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to resend OTP')
    }
  })

  const handleOtpChange = (index, value) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d
      })
      setOtp(newOtp)
      setError('')
      const nextIndex = Math.min(index + digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      if (newOtp.every((d) => d !== '')) {
        verifyOTPMutation.mutate({ phone, otp: newOtp.join('') })
      }
      return
    }

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
    if (resendTimer > 0 || resendOTPMutation.isPending) return
    resendOTPMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-bgPrimary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header — matches login screen */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Invoice App</h1>
          <p className="text-textSecondary text-sm">
            Enter the verification code sent to your phone
          </p>
        </div>

        {/* Card */}
        <div className="bg-bgSecondary rounded-2xl shadow-card border border-border px-5 py-8 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-textPrimary mb-1">
            Verification Code
          </h2>
          <p className="text-textSecondary text-sm mb-8">
            We sent a 6-digit code to <span className="font-semibold text-textPrimary">{phone}</span>
          </p>

          {/* OTP Inputs — responsive sizing */}
          <div className="flex gap-2 sm:gap-3 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={verifyOTPMutation.isPending}
                className="w-11 h-13 sm:w-12 sm:h-14 text-xl sm:text-2xl text-center border-2 border-border rounded-xl bg-white text-textPrimary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:bg-bgPrimary disabled:opacity-50"
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
            disabled={verifyOTPMutation.isPending || resendTimer > 0 || resendOTPMutation.isPending}
            className="text-sm text-primary active:underline md:hover:underline disabled:text-textSecondary disabled:cursor-not-allowed transition-colors"
          >
            {resendTimer > 0
              ? `Resend code in ${resendTimer}s`
              : resendOTPMutation.isPending
                ? 'Sending...'
                : "Didn't receive code? Resend"}
          </button>

          <button
            onClick={() => history.push('/auth/phone')}
            className="block mx-auto mt-4 text-sm text-textSecondary active:text-textPrimary md:hover:text-textPrimary transition-colors"
          >
            ← Change phone number
          </button>
        </div>
      </div>
    </div>
  )
}
