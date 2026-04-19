import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuth2Callback() {
  const navigate   = useNavigate();
  const processed  = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const role    = params.get('role');
    const name    = params.get('name');
    const email   = params.get('email');
    const userId  = params.get('userId');

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userId, name, email, role,
      }));
      navigate('/home', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1d4ed8 100%)',
      fontFamily: 'Segoe UI, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(255,255,255,0.2)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ fontSize: 16, color: '#94a3b8' }}>Signing you in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}