import { Component } from 'react'

const isDev = import.meta.env.DEV

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    // In production, errors would be sent to an error reporting service (e.g. Sentry)
    if (isDev) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bgPrimary flex flex-col">
          <div className="bg-red-500 text-white px-6 py-3">
            <h1 className="text-lg font-semibold">Application Error</h1>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-textPrimary mb-2">Something went wrong</h2>
            <p className="text-textSecondary text-sm mb-6">
              We're sorry for the inconvenience. Please try again or reload the page.
            </p>
            <div className="flex gap-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-bgSecondary text-textPrimary border border-border rounded-lg font-medium text-sm"
              >
                Reload Page
              </button>
            </div>
            {isDev && this.state.error && (
              <>
                <p className="text-red-600 text-sm mb-4">
                  {this.state.error.toString()}
                </p>
                <details className="whitespace-pre-wrap text-xs text-textSecondary bg-bgSecondary p-4 rounded-lg border border-border">
                  {this.state.error.stack}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </details>
              </>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
