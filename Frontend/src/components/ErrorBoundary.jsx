import { Component } from 'react'
import { FiRefreshCw } from 'react-icons/fi'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-fallback" role="alert">
          <span className="eyebrow">TERJADI GANGGUAN</span>
          <h1>{this.props.title || 'Halaman tidak dapat ditampilkan'}</h1>
          <p>{this.props.description || 'Silakan muat ulang halaman. Jika masalah berlanjut, coba kembali beberapa saat lagi.'}</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            <FiRefreshCw /> Muat ulang halaman
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
