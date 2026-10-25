import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[App] Render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b0f19', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <section style={{ maxWidth: 560, width: '100%', padding: 28, borderRadius: 16, background: '#121927', border: '1px solid #334155', boxShadow: '0 20px 60px #0008' }}>
          <h1 style={{ margin: '0 0 10px', color: '#fbbf24', fontSize: 22 }}>Ứng dụng đang khởi động lại</h1>
          <p style={{ margin: '0 0 18px', color: '#cbd5e1' }}>Đã xảy ra lỗi tạm thời khi tải giao diện. Hãy tải lại trang.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px', borderRadius: 8, border: 0, background: '#f97316', color: '#111827', fontWeight: 700, cursor: 'pointer' }}>Tải lại trang</button>
          {import.meta.env.DEV && <pre style={{ marginTop: 18, whiteSpace: 'pre-wrap', color: '#fca5a5', fontSize: 12 }}>{this.state.error?.stack || String(this.state.error)}</pre>}
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
)
