import { Component } from 'react'

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
        <div className="min-h-screen bg-bgPrimary flex flex-col">
          <div className="bg-red-500 text-white px-6 py-3">
            <h1 className="text-lg font-semibold">Application Error</h1>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-textPrimary mb-2">Something went wrong</h2>
            <p className="text-red-600 text-sm mb-4">
              {this.state.error && this.state.error.toString()}
            </p>
            <details className="whitespace-pre-wrap text-xs text-textSecondary bg-bgSecondary p-4 rounded-lg border border-border">
              {this.state.error && this.state.error.stack}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
