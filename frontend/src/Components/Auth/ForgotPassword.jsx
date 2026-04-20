import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../Register/Register.module.css';

const BASE_URL = 'http://localhost:8081';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Steps: 'email' | 'otp' | 'reset' | 'done'
  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);

  // ── STEP 1 — Send OTP ────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE_URL}/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 — Verify OTP ──────────────────────────────────────────
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setError('');
    setStep('reset');
  };

  // ── STEP 3 — Reset Password ──────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!/[A-Z]/.test(password)) { setError('Must contain uppercase letter.'); return; }
    if (!/[0-9]/.test(password)) { setError('Must contain a number.'); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Must contain a special character.'); return; }
    if (password !== confirmPw)   { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE_URL}/Auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgDecor} />
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logo}>SC</div>
          <span className={styles.brand}>SmartCampus</span>
        </div>

        {/* ── STEP: email ─────────────────────────────────────────── */}
        {step === 'email' && (
          <>
            <h1 className={styles.title}>Forgot password?</h1>
            <p className={styles.subtitle}>Enter your email and we'll send you a verification code.</p>

            {error && <div className={styles.errorBox}>{error}</div>}

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email address</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className={styles.input}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading && <span className={styles.btnSpinner} />}
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP: otp ───────────────────────────────────────────── */}
        {step === 'otp' && (
          <>
            <h1 className={styles.title}>Enter OTP</h1>
            <p className={styles.subtitle}>We sent a 6-digit code to <strong>{email}</strong>. Valid for 5 minutes.</p>

            {error && <div className={styles.errorBox}>{error}</div>}

            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Verification code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="000000"
                  className={styles.input}
                  style={{ letterSpacing: '8px', fontSize: '22px', textAlign: 'center', paddingLeft: '16px' }}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                Verify OTP
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', marginTop: 4 }}
              >
                ← Back
              </button>
            </form>
          </>
        )}

        {/* ── STEP: reset ─────────────────────────────────────────── */}
        {step === 'reset' && (
          <>
            <h1 className={styles.title}>New password</h1>
            <p className={styles.subtitle}>Choose a strong new password for your account.</p>

            {error && <div className={styles.errorBox}>{error}</div>}

            <form onSubmit={handleReset} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>New password</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    className={styles.input}
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirm new password</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setError(''); }}
                    placeholder="Re-enter password"
                    className={`${styles.input} ${confirmPw ? (confirmPw === password ? styles.inputValid : styles.inputInvalid) : ''}`}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading && <span className={styles.btnSpinner} />}
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP: done ──────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h1 className={styles.title}>Password reset!</h1>
            <p className={styles.subtitle}>Your password has been updated successfully.</p>
            <button
              className={styles.submitBtn}
              style={{ marginTop: 24 }}
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Back to login */}
        {step !== 'done' && (
          <p className={styles.switchText} style={{ marginTop: 20 }}>
            <Link to="/login" className={styles.switchLink}>← Back to login</Link>
          </p>
        )}

      </div>
    </div>
  );
}