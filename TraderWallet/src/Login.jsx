import { useState } from 'react';
import './Login.css';

/* ---- validators ---------------------------------------------------- */

// SA phone: 10 digits starting with 0 (e.g. 0825551234)
function validatePhone(value) {
  if (!value) return 'Phone number is required';
  if (!/^0\d{9}$/.test(value)) return 'Enter a 10-digit number starting with 0';
  return '';
}

// PIN: strictly 8 digits
function validatePIN(value) {
  if (!value) return 'PIN is required';
  if (!/^\d{8}$/.test(value)) return 'PIN must be exactly 8 digits';
  return '';
}

/* ---- component ----------------------------------------------------- */

export default function Login({ onSwitch, onAuth }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ phone: '', pin: '' });
  const [touched, setTouched] = useState({ phone: false, pin: false });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type, msg }

  const onlyDigits = (v, maxLen) => v.replace(/\D/g, '').slice(0, maxLen);

  const handlePhoneChange = (e) => {
    const v = onlyDigits(e.target.value, 10);
    setPhone(v);
    if (touched.phone) setErrors((p) => ({ ...p, phone: validatePhone(v) }));
  };

  const handlePinChange = (e) => {
    const v = onlyDigits(e.target.value, 8);
    setPin(v);
    if (touched.pin) setErrors((p) => ({ ...p, pin: validatePIN(v) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const nextErrors = { phone: validatePhone(phone), pin: validatePIN(pin) };
    setErrors(nextErrors);
    setTouched({ phone: true, pin: true });
    if (nextErrors.phone || nextErrors.pin) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, pin }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // API returns { error: "..." } on 401
        setStatus({ type: 'error', msg: data.error || `Login failed (${res.status})` });
        return;
      }

      // success: hand the session up to App (token + userId needed later)
      if (onAuth) {
        onAuth({
          token: data.token,
          userId: data.userId,
          idNumber: data.idNumber,
          businessName: data.businessName,
          phoneNumber: data.phoneNumber,
          balance: data.omnibusBalance ?? 0,
          remember,
        });
      }
    } catch {
      setStatus({
        type: 'error',
        msg: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tw-login">
      <form className="tw-card" onSubmit={handleSubmit} noValidate>
        <div className="tw-logo">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="13" rx="3" />
            <path d="M16 12h.01" />
            <path d="M2 9h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H2" />
            <path d="M5 6V5a2 2 0 0 1 2-2h9" />
          </svg>
        </div>

        <h1 className="tw-title">Trader<span>Wallet</span></h1>
        <p className="tw-subtitle">Sign in to manage your portfolio</p>

        {status && (
          <div className={`tw-status tw-status-${status.type}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {status.msg}
          </div>
        )}

        {/* Phone number */}
        <div className="tw-group">
          <label className="tw-label" htmlFor="phone">PHONE NUMBER</label>
          <div className={`tw-field${errors.phone ? ' tw-invalid' : ''}`}>
            <svg className="tw-icon" width="19" height="19" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="0825551234"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => {
                setTouched((p) => ({ ...p, phone: true }));
                setErrors((p) => ({ ...p, phone: validatePhone(phone) }));
              }}
              autoComplete="tel"
              aria-invalid={!!errors.phone}
            />
          </div>
          <span className={`tw-msg${errors.phone ? ' tw-show' : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {errors.phone}
          </span>
        </div>

        {/* PIN */}
        <div className="tw-group">
          <label className="tw-label" htmlFor="pin">PIN</label>
          <div className={`tw-field${errors.pin ? ' tw-invalid' : ''}`}>
            <svg className="tw-icon" width="19" height="19" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="pin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="8-digit PIN"
              value={pin}
              onChange={handlePinChange}
              onBlur={() => {
                setTouched((p) => ({ ...p, pin: true }));
                setErrors((p) => ({ ...p, pin: validatePIN(pin) }));
              }}
              autoComplete="current-password"
              aria-invalid={!!errors.pin}
            />
            <button
              type="button"
              className="tw-eye"
              onClick={() => setShowPin((s) => !s)}
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <span className={`tw-msg${errors.pin ? ' tw-show' : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {errors.pin}
          </span>
        </div>

        <div className="tw-row">
          <label className="tw-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="tw-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            Remember me
          </label>
          <a className="tw-link" href="#">Forgot PIN?</a>
        </div>

        <button className="tw-btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="tw-foot">
          New to TraderWallet?{' '}
          <a className="tw-link" href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>
            Create an account
          </a>
        </p>
      </form>
    </div>
  );
}
