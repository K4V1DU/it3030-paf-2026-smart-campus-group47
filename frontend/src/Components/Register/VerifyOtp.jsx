import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './Register.module.css';


const BASE_URL = 'http://localhost:8080';

export default function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || '';

  const [digits, setDigits]   = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resent, setResent]   = useState(false);
  const [step, setStep]       = useState('otp'); // 'otp' | 'success'
  const [timer, setTimer]     = useState(60);

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');
    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) { setError('Please enter all 6 digits.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/Auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId, name: data.name,
        email: data.email, role: data.role,
        imageUrl: data.imageUrl,
      }));
      setStep('success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await fetch(`${BASE_URL}/Auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResent(true);
      setTimer(60);
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => setResent(false), 3000);
    } catch {
      setError('Failed to resend OTP. Try again.');
    }
  };

  // ── Success Screen ──
  if (step === 'success') return (
    <div className={styles.page}>
      <div className={styles.bgDecor} />
      <div className={styles.card} style={{ textAlign: 'center', padding: '48px 44px' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
        <h1 className={styles.title}>Account Created!</h1>
        <p className={styles.subtitle}>
          Welcome to SmartCampus! Redirecting to login…
        </p>
        <div style={{
          marginTop: 24, height: 4, borderRadius: 4,
          background: '#e5e7eb', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', background: '#1d4ed8',
            animation: 'progressBar 2.5s linear forwards'
          }} />
        </div>
      </div>
    </div>
  );

  // ── OTP Screen ──
  return (
    <div className={styles.page}>
      <div className={styles.bgDecor} />
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logo}>SC</div>
          <span className={styles.brand}>SmartCampus</span>
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28
          }}>📧</div>
        </div>

        <h1 className={styles.title} style={{ textAlign: 'center' }}>
          Verify your email
        </h1>
        <p className={styles.subtitle} style={{ textAlign: 'center' }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: '#1d4ed8' }}>{email}</strong>
        </p>

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Resent success */}
        {resent && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '11px 14px',
            color: '#15803d', fontSize: 13, fontWeight: 500,
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8
          }}>
            ✅ OTP resent successfully!
          </div>
        )}

        {/* OTP Input Boxes */}
        <form onSubmit={handleVerify}>
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'center',
            marginBottom: 24
          }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                style={{
                  width: 52, height: 60,
                  textAlign: 'center',
                  fontSize: 26, fontWeight: 700,
                  border: `2px solid ${d ? '#1d4ed8' : '#e5e7eb'}`,
                  borderRadius: 12,
                  outline: 'none',
                  background: d ? '#eff6ff' : '#f9fafb',
                  color: '#111827',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  boxShadow: d ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading && <span className={styles.btnSpinner} />}
            {loading ? 'Verifying…' : 'Verify & Create Account'}
          </button>
        </form>

        {/* Resend */}
        <p className={styles.switchText} style={{ marginTop: 20 }}>
          Didn't receive the code?{' '}
          {timer > 0 ? (
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>
              Resend in {timer}s
            </span>
          ) : (
            <span
              onClick={handleResend}
              className={styles.switchLink}
              style={{ cursor: 'pointer' }}
            >
              Resend OTP
            </span>
          )}
        </p>

        <p className={styles.switchText} style={{ marginTop: 8 }}>
          <Link to="/register" className={styles.switchLink}>
            ← Back to Register
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}