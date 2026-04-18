import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Register.module.css';

const BASE_URL = 'http://localhost:8080';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
   // role: 'USER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.name.trim())              return 'Full name is required.';
    if (!form.email.trim())             return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6)       return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id:       data.userId,
        name:     data.name,
        email:    data.email,
        role:     data.role,
        imageUrl: data.imageUrl,
      }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${BASE_URL}/oauth2/authorization/google`;
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

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join SmartCampus today — it's free</p>

        {error && (
          <div className={styles.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Full name */}
          <div className={styles.field}>
            <label className={styles.label}>Full name</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={styles.input}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={styles.input}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Role */}
          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`${styles.input} ${styles.select}`}
              >
                <option value="USER">Student</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className={styles.input}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
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

            {/* Password strength */}
            {form.password && <PasswordStrength password={form.password} />}
          </div>

          {/* Confirm password */}
          <div className={styles.field}>
            <label className={styles.label}>Confirm password</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={`${styles.input} ${
                  form.confirmPassword
                    ? form.confirmPassword === form.password
                      ? styles.inputValid
                      : styles.inputInvalid
                    : ''
                }`}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading && <span className={styles.btnSpinner} />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>

        <button className={styles.googleBtn} onClick={handleGoogleRegister} type="button">
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Password strength indicator ── */
function PasswordStrength({ password }) {
  const getScore = (p) => {
    let s = 0;
    if (p.length >= 6)           s++;
    if (p.length >= 10)          s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    return s;
  };

  const score  = getScore(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i <= score ? colors[score] : '#e5e7eb',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}