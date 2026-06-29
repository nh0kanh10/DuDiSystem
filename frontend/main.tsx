import React, { Component, ErrorInfo, ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./app/App.tsx"
import "./styles/index.css"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: 16, margin: 24, fontFamily: 'sans-serif' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>Đã xảy ra lỗi hệ thống (React Crash)</h2>
          <p style={{ fontWeight: 'bold', margin: '0 0 16px 0', fontFamily: 'monospace' }}>{this.state.error?.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12, background: 'rgba(0,0,0,0.05)', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
)
