import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch() {
    // Logged to console; app continues to show fallback
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl font-bold">
            OOPS<span className="text-[var(--color-race-red)]">!</span>
          </p>
          <p className="mt-2 text-sm text-[var(--color-race-muted)]">
            Terjadi kesalahan. Muat ulang aplikasi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[var(--color-race-red)] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
