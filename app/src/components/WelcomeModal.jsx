import { useState, useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { Building2, FileText, ArrowRight, Sparkles } from 'lucide-react'
import Portal from './Portal'

// Confetti particle component — pure CSS animation, no dependencies
function ConfettiParticle({ index, total }) {
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#F43F5E', '#14B8A6']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2.5 + Math.random() * 2
  const size = 6 + Math.random() * 6
  const rotation = Math.random() * 360
  const shape = index % 3 // 0=square, 1=circle, 2=rectangle

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${left}%`,
        animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <div
        style={{
          width: shape === 2 ? size * 1.5 : size,
          height: shape === 2 ? size * 0.6 : size,
          backgroundColor: color,
          borderRadius: shape === 1 ? '50%' : '2px',
          transform: `rotate(${rotation}deg)`,
          animation: `confetti-spin ${duration * 0.5}s linear ${delay}s infinite`,
        }}
      />
    </div>
  )
}

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {Array.from({ length: 60 }).map((_, i) => (
        <ConfettiParticle key={i} index={i} total={60} />
      ))}
    </div>
  )
}

// Feature highlights for the welcome modal
const FEATURES = [
  {
    icon: '📄',
    title: 'Create Invoices',
    description: 'Professional GST-compliant invoices in seconds',
  },
  {
    icon: '👥',
    title: 'Manage Customers',
    description: 'Keep track of all your clients in one place',
  },
  {
    icon: '📊',
    title: 'Track Payments',
    description: 'Monitor revenue, pending payments & reports',
  },
]

export default function WelcomeModal({ isOpen, onClose }) {
  const history = useHistory()
  const [showConfetti, setShowConfetti] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay for mount animation
      requestAnimationFrame(() => {
        setVisible(true)
        setShowConfetti(true)
      })
      // Stop confetti after 4 seconds
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
      setShowConfetti(false)
    }
  }, [isOpen])

  const handleSetupBusiness = useCallback(() => {
    localStorage.removeItem('show_welcome')
    onClose()
    history.push('/settings')
  }, [history, onClose])

  const handleCreateInvoice = useCallback(() => {
    localStorage.removeItem('show_welcome')
    onClose()
    history.push('/invoices/new')
  }, [history, onClose])

  const handleSkip = useCallback(() => {
    localStorage.removeItem('show_welcome')
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <Portal>
      {/* Confetti keyframes — injected once */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes welcome-scale-in {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes welcome-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.25); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
          visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
        }`}
        onClick={handleSkip}
      >
        {/* Confetti layer */}
        {showConfetti && <Confetti />}

        {/* Modal */}
        <div
          className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-500 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            animation: visible ? 'welcome-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, welcome-glow 3s ease-in-out 1s infinite' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div className="relative bg-gradient-to-br from-primary via-blue-500 to-indigo-600 px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />

            {/* Logo */}
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center p-1">
                <img
                  src="/assets/brand/icon-transparent.png"
                  alt="Invoice Baba"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h2 className="text-xl font-bold text-white">Welcome to Invoice Baba!</h2>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-sm text-blue-100">
                Billing Made Easy — Your invoicing journey starts here
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="px-6 py-5 space-y-3">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                style={{
                  animation: visible ? `welcome-scale-in 0.4s ease-out ${0.3 + i * 0.1}s both` : 'none',
                }}
              >
                <span className="text-xl leading-none mt-0.5">{feature.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-textPrimary">{feature.title}</p>
                  <p className="text-xs text-textSecondary mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-2.5">
            {/* Primary: Setup Business */}
            <button
              onClick={handleSetupBusiness}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              Set Up My Business
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary: Create Invoice */}
            <button
              onClick={handleCreateInvoice}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 active:bg-emerald-100 md:hover:bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-sm transition-all border border-emerald-200"
            >
              <FileText className="w-4 h-4" />
              Create My First Invoice
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full py-2 text-xs text-textSecondary active:text-textPrimary md:hover:text-textPrimary transition-colors"
            >
              Skip for now — I'll explore on my own
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
