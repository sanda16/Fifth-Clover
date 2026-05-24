import { useState } from 'react';
import './Login.css'; // reuses the same neumorphic styles

/* ---- validators ---------------------------------------------------- */

// South African ID: 13 digits, valid DOB, valid citizenship digit, Luhn checksum
function validateID(value) {
  if (!value) return 'ID number is required';
  if (!/^\d{13}$/.test(value)) return 'ID number must be exactly 13 digits';

  const year = parseInt(value.slice(0, 2), 10);
  const month = parseInt(value.slice(2, 4), 10);
  const day = parseInt(value.slice(4, 6), 10);

  if (month < 1 || month > 12) return 'ID has an invalid birth month';

  const nowYY = new Date().getFullYear() % 100;
  const fullYear = year <= nowYY ? 2000 + year : 1900 + year;
  const daysInMonth = new Date(fullYear, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return 'ID has an invalid birth date';

  const citizenship = parseInt(value.charAt(10), 10);
  if (citizenship !== 0 && citizenship !== 1) return 'ID has an invalid citizenship digit';

  // SA ID specific checksum:
  // Sum digits in odd positions (1,3,5,7,9,11) -> sumOdd
  // Concatenate digits in even positions (2,4,6,8,10,12), multiply by 2, then sum the digits -> sumEven
  // total = sumOdd + sumEven; checkDigit = (10 - (total % 10)) % 10
  const digits = value.split('').map((d) => parseInt(d, 10));
  const sumOdd = [0,2,4,6,8,10].reduce((acc, idx) => acc + digits[idx], 0);
  const evenConcat = [1,3,5,7,9,11].map((i) => digits[i]).join('');
  const evenProduct = String(Number(evenConcat) * 2);
  const sumEven = evenProduct.split('').reduce((acc, ch) => acc + parseInt(ch, 10), 0);
  const total = sumOdd + sumEven;
  const checkDigit = (10 - (total % 10)) % 10;
  if (checkDigit !== digits[12]) return 'ID number is invalid (checksum failed)';

  return '';
}

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

function validateBusinessName(value) {
  const v = value.trim();
  if (!v) return 'Business name is required';
  if (v.length < 2) return 'Business name is too short';
  if (v.length > 100) return 'Business name is too long';
  return '';
}

/* ---- component ----------------------------------------------------- */

const EMPTY = { businessName: '', saId: '', phoneNumber: '', pin: '', confirmPin: '' };

export default function Register({ onSwitch }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg }

  const onlyDigits = (v, maxLen) => v.replace(/\D/g, '').slice(0, maxLen);

  // run the right validator for one field, given the latest values
  const validateField = (name, all) => {
    switch (name) {
      case 'businessName': return validateBusinessName(all.businessName);
      case 'saId':         return validateID(all.saId);
      case 'phoneNumber':  return validatePhone(all.phoneNumber);
      case 'pin':          return validatePIN(all.pin);
      case 'confirmPin':
        if (!all.confirmPin) return 'Please confirm your PIN';
        if (all.confirmPin !== all.pin) return 'PINs do not match';
        return '';
      default: return '';
    }
  };

  const setField = (name, raw) => {
    let v = raw;
    if (name === 'saId') v = onlyDigits(raw, 13);
    else if (name === 'phoneNumber') v = onlyDigits(raw, 10);
    else if (name === 'pin' || name === 'confirmPin') v = onlyDigits(raw, 8);

    const next = { ...values, [name]: v };
    setValues(next);

    if (touched[name]) {
      setErrors((p) => ({ ...p, [name]: validateField(name, next) }));
    }
    // keep confirm-pin error in sync while editing pin
    if (name === 'pin' && touched.confirmPin) {
      setErrors((p) => ({ ...p, confirmPin: validateField('confirmPin', next) }));
    }
  };

  const onBlur = (name) => {
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validateField(name, values) }));
  };

  const validateAll = () => {
    const next = {};
    ['businessName', 'saId', 'phoneNumber', 'pin', 'confirmPin'].forEach((n) => {
      next[n] = validateField(n, values);
    });
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const nextErrors = validateAll();
    setErrors(nextErrors);
    setTouched({
      businessName: true, saId: true, phoneNumber: true, pin: true, confirmPin: true,
    });
    if (Object.values(nextErrors).some(Boolean)) return;

    // payload matches the API spec exactly (confirmPin is NOT sent)
    const payload = {
      saId: values.saId,
      phoneNumber: values.phoneNumber,
      pin: values.pin,
      businessName: values.businessName.trim(),
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // API returns { error: "...", details: "..." } on 400
        let msg = data.error || `Registration failed (${res.status})`;
        if (data.details) msg += `: ${data.details}`;
        setStatus({ type: 'error', msg });
        return;
      }

      // API returns { message: "Registration successful!", user: {...} }
      setStatus({ type: 'success', msg: data.message || 'Account created. You can now sign in.' });
      setValues(EMPTY);
      setTouched({});
    } catch {
      setStatus({
        type: 'error',
        msg: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // small helper to render the inline error span
  const Msg = ({ name }) => (
    <span className={`tw-msg${errors[name] ? ' tw-show' : ''}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
      {errors[name]}
    </span>
  );

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

        <h1 className="tw-title">Create <span>Account</span></h1>
        <p className="tw-subtitle">Register a new trader profile</p>

        {status && (
          <div className={`tw-status tw-status-${status.type}`}>
            {status.type === 'success' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
            )}
            {status.msg}
          </div>
        )}

        {/* Business name */}
        <div className="tw-group">
          <label className="tw-label" htmlFor="businessName">BUSINESS NAME</label>
          <div className={`tw-field${errors.businessName ? ' tw-invalid' : ''}`}>
            <svg className="tw-icon" width="19" height="19" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
            </svg>
            <input
              id="businessName"
              type="text"
              placeholder="Spaza Corner Market"
              value={values.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
              onBlur={() => onBlur('businessName')}
              autoComplete="organization"
              aria-invalid={!!errors.businessName}
            />
          </div>
          <Msg name="businessName" />
        </div>

        {/* ID number */}
        <div className="tw-group">
          <label className="tw-label" htmlFor="saId">ID NUMBER</label>
          <div className={`tw-field${errors.saId ? ' tw-invalid' : ''}`}>
            <svg className="tw-icon" width="19" height="19" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M15 8h4M15 12h4M5 16h14" />
            </svg>
            <input
              id="saId"
              type="text"
              inputMode="numeric"
              placeholder="13-digit SA ID number"
              value={values.saId}
              onChange={(e) => setField('saId', e.target.value)}
              onBlur={() => onBlur('saId')}
              autoComplete="off"
              aria-invalid={!!errors.saId}
            />
          </div>
          <Msg name="saId" />
        </div>

        {/* Phone number */}
        <div className="tw-group">
          <label className="tw-label" htmlFor="phoneNumber">PHONE NUMBER</label>
          <div className={`tw-field${errors.phoneNumber ? ' tw-invalid' : ''}`}>
            <svg className="tw-icon" width="19" height="19" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            <input
              id="phoneNumber"
              type="tel"
              inputMode="numeric"
              placeholder="0825551234"
              value={values.phoneNumber}
              onChange={(e) => setField('phoneNumber', e.target.value)}
              onBlur={() => onBlur('phoneNumber')}
              autoComplete="tel"
              aria-invalid={!!errors.phoneNumber}
            />
          </div>
          <Msg name="phoneNumber" />
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
              value={values.pin}
              onChange={(e) => setField('pin', e.target.value)}
              onBlur={() => onBlur('pin')}
              autoComplete="new-password"
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
          <Msg name="pin" />
        </div>

        {/* Confirm PIN */}
        <div className="tw-group">
          <label className="tw-label" htmlFor="confirmPin">CONFIRM PIN</label>
          <div className={`tw-field${errors.confirmPin ? ' tw-invalid' : ''}`}>
            <svg className="tw-icon" width="19" height="19" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              <path d="m9 16 2 2 4-4" />
            </svg>
            <input
              id="confirmPin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="Re-enter PIN"
              value={values.confirmPin}
              onChange={(e) => setField('confirmPin', e.target.value)}
              onBlur={() => onBlur('confirmPin')}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPin}
            />
          </div>
          <Msg name="confirmPin" />
        </div>

        <button className="tw-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="tw-foot">
          Already have an account?{' '}
          <a className="tw-link" href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
