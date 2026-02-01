import { Component } from 'react'
import { IonApp, IonContent, IonHeader, IonTitle, IonToolbar, IonText } from '@ionic/react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <IonApp>
          <IonHeader>
            <IonToolbar color="danger">
              <IonTitle>Application Error</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <h1>Something went wrong</h1>
            <IonText color="danger">
              <h2>{this.state.error && this.state.error.toString()}</h2>
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
                {this.state.error && this.state.error.stack}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </details>
            </IonText>
          </IonContent>
        </IonApp>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
