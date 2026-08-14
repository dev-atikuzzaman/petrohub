// src/components/ErrorBoundary.js
// React render-এ কোনো unhandled error হলে সম্পূর্ণ সাদা স্ক্রিন না দেখিয়ে
// একটা বোঝা যায় এমন error message এবং "আবার চেষ্টা করুন" বাটন দেখায়।
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('🔴 App crashed:', error, info);
  }

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(n => caches.delete(n)));
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          textAlign: 'center', background: '#f8fafc', fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>অ্যাপ লোড করতে সমস্যা হয়েছে</h2>
          <p style={{ color: '#64748b', fontSize: 14, maxWidth: 340, marginBottom: 20 }}>
            একটা টেকনিক্যাল সমস্যা হয়েছে। নিচের বাটনে চাপ দিলে ক্যাশ পরিষ্কার করে আবার লোড করার চেষ্টা করবে।
          </p>
          <button
            onClick={this.handleReload}
            style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#1e3a5f', color: '#fff', fontWeight: 700, fontSize: 14 }}
          >
            আবার চেষ্টা করুন
          </button>
          {this.state.error && (
            <pre style={{ marginTop: 20, fontSize: 11, color: '#94a3b8', maxWidth: 320, whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {String(this.state.error && this.state.error.message)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
