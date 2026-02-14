import { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authApi, customerApi, productApi, businessApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { DEMO_INVOICE_KEY } from '../invoices/NewInvoicePage'
import { clearAllDemoData } from '../../lib/demoStorage'
import { isNative } from '../../lib/capacitor'

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const history = useHistory()
  const location = useLocation()
  const inputRefs = useRef([])
  const setAuth = useAuthStore((state) => state.setAuth)
  const isMobileApp = isNative()

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
    onSuccess: async (response) => {
      const { token, user, business } = response.data
      setAuth(token, user, business)

      // Check if there's pending demo invoice data to migrate
      const rawDemo = localStorage.getItem(DEMO_INVOICE_KEY)
      if (rawDemo) {
        try {
          const demoData = JSON.parse(rawDemo)
          // Map demo IDs → real IDs so invoice line items reference real products
          const customerIdMap = {}
          const productIdMap = {}

          // Create real customers from demo data
          if (demoData.customers?.length) {
            for (const c of demoData.customers) {
              try {
                const res = await customerApi.create({
                  name: c.name, phone: c.phone || undefined, email: c.email || undefined,
                  gstin: c.gstin || undefined, stateCode: c.stateCode || undefined, address: c.address || undefined,
                })
                const real = res.data?.data || res.data
                if (real?.id) customerIdMap[c.id] = real.id
              } catch {}
            }
          }

          // Create real products from demo data
          if (demoData.products?.length) {
            for (const p of demoData.products) {
              try {
                const res = await productApi.create({
                  name: p.name, defaultRate: p.defaultRate, unit: p.unit, taxRate: p.taxRate,
                })
                const real = res.data?.data || res.data
                if (real?.id) productIdMap[p.id] = real.id
              } catch {}
            }
          }

          // Upload logo if present
          if (demoData.logo) {
            try {
              const blob = await fetch(demoData.logo).then(r => r.blob())
              const file = new File([blob], 'logo.png', { type: blob.type })
              await businessApi.uploadLogo(file)
            } catch {}
          }

          // Upload signature if present
          if (demoData.signature) {
            try {
              const blob = await fetch(demoData.signature).then(r => r.blob())
              const file = new File([blob], 'signature.png', { type: blob.type })
              await businessApi.uploadSignature(file)
            } catch {}
          }

          // Remap demo IDs to real IDs in the invoice data
          if (demoData.invoice) {
            if (demoData.invoice.customerId && customerIdMap[demoData.invoice.customerId]) {
              demoData.invoice.customerId = customerIdMap[demoData.invoice.customerId]
            }
            if (demoData.invoice.lineItems) {
              demoData.invoice.lineItems = demoData.invoice.lineItems.map(item => ({
                ...item,
                productServiceId: item.productServiceId && productIdMap[item.productServiceId]
                  ? productIdMap[item.productServiceId] : item.productServiceId
              }))
            }
          }

          // Save updated demo data back (with real IDs)
          localStorage.setItem(DEMO_INVOICE_KEY, JSON.stringify(demoData))
          clearAllDemoData()
        } catch {}

        history.replace('/invoices/new?restore=demo')
      } else {
        setTimeout(() => history.replace('/invoices/new'), 500)
      }
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
    <div className={`bg-bgPrimary flex items-center justify-center p-4 ${isMobileApp ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <div className="w-full max-w-md">
        {/* Header — matches login screen */}
        <div className="text-center mb-10">
          <img
            src="/assets/brand/logo-full-transparent.png"
            alt="Invoice Baba"
            className="h-16 mx-auto mb-4"
          />
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
