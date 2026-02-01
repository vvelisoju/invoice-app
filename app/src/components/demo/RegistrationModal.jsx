import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonIcon } from '@ionic/react'
import { closeOutline, logoGoogle, logoFacebook } from 'ionicons/icons'
import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './RegistrationModal.css'

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

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="registration-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <span className="modal-brand">{BRANDING.name}</span>
          </IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="registration-content">
        <div className="registration-container">
          <div className="registration-header">
            <h2>Sign up to save your invoice</h2>
            <p>Enter your phone number to print, download, or send your invoice</p>
          </div>

          <div className="registration-form">
            <IonButton 
              expand="block" 
              size="large"
              className="primary-signup-btn"
              onClick={handleSignUp}
            >
              Continue with Phone Number
            </IonButton>

            <div className="divider">
              <span>or</span>
            </div>

            <IonButton 
              expand="block" 
              size="large"
              fill="outline"
              className="social-btn google-btn"
              disabled
            >
              <IonIcon icon={logoGoogle} slot="start" />
              Continue with Google
            </IonButton>

            <IonButton 
              expand="block" 
              size="large"
              fill="outline"
              className="social-btn facebook-btn"
              disabled
            >
              <IonIcon icon={logoFacebook} slot="start" />
              Continue with Facebook
            </IonButton>

            <p className="terms-text">
              By continuing, you are creating a new account with us.
              See our <a href="/terms">Terms</a> for details.
            </p>

            <div className="login-link">
              Already a user? <button onClick={handleLogin}>Log In</button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  )
}

export default RegistrationModal
