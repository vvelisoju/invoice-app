import { X } from 'lucide-react'
import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './RegistrationModal.css'
import Portal from '../Portal'

function RegistrationModal({ isOpen, onClose }) {
  const history = useHistory()

  const handleSignUp = () => {
    onClose()
    history.push('/auth/phone')
  }

  const handleLogin = () => {
    onClose()
    history.push('/auth/phone')
  }

  if (!isOpen) return null

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden registration-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <span className="modal-brand text-lg font-bold">{BRANDING.name}</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="registration-content p-6">
          <div className="registration-container">
            <div className="registration-header text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Sign up to save your invoice</h2>
              <p className="text-sm text-gray-500">Enter your phone number to print, download, or send your invoice</p>
            </div>

            <div className="registration-form space-y-3">
              <button
                className="primary-signup-btn w-full py-3 bg-primary hover:bg-primaryHover text-white rounded-xl font-semibold text-sm transition-colors"
                onClick={handleSignUp}
              >
                Continue with Phone Number
              </button>

              <div className="divider flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <button
                className="social-btn google-btn w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                Continue with Google
              </button>

              <button
                className="social-btn facebook-btn w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                Continue with Facebook
              </button>

              <p className="terms-text text-xs text-gray-400 text-center mt-4">
                By continuing, you are creating a new account with us.
                See our <a href="/terms" className="text-primary hover:underline">Terms</a> for details.
              </p>

              <div className="login-link text-center text-sm text-gray-500 mt-2">
                Already a user? <button onClick={handleLogin} className="text-primary font-medium hover:underline">Log In</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  )
}

export default RegistrationModal
