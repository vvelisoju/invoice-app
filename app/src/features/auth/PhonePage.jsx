import { useState, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../lib/api'
import { isNative } from '../../lib/capacitor'

export default function PhonePage() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const history = useHistory()
  const isMobileApp = isNative()

  const requestOTPMutation = useMutation({
    mutationFn: authApi.requestOTP,
    onSuccess: () => {
      history.push('/auth/verify', { phone })
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to send OTP')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    requestOTPMutation.mutate(phone)
  }

  return (
    <div className={`bg-bgPrimary flex items-center justify-center p-4 ${isMobileApp ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/assets/brand/logo-full-transparent.png"
            alt="Invoice Baba"
            className="h-16 mx-auto mb-4"
          />
          <p className="text-textSecondary text-sm">
            Enter your phone number to get started
          </p>
        </div>

        {/* Card */}
        <div className="bg-bgSecondary rounded-2xl shadow-card border border-border p-8">
          <form onSubmit={handleSubmit}>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block">
              Phone Number
            </label>
            <input
              ref={inputRef}
              type="tel"
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError('') }}
              maxLength={10}
              inputMode="numeric"
              disabled={requestOTPMutation.isPending}
              className="w-full h-14 px-4 text-lg bg-bgPrimary border border-border rounded-xl text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all mb-2 disabled:opacity-50"
            />

            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={requestOTPMutation.isPending || phone.length !== 10}
              className="w-full h-14 mt-4 bg-primary hover:bg-primaryHover text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-base"
            >
              {requestOTPMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'SEND OTP'
              )}
            </button>
          </form>

          <p className="text-textSecondary text-sm text-center mt-6">
            We'll send you a 6-digit verification code
          </p>
        </div>
      </div>
    </div>
  )
}
