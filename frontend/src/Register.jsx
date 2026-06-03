import { useState } from 'react';

// Form validation helpers
function validateID(value) {
  if (!value) return 'ID number is required';
  if (!/^\d{13}$/.test(value)) return 'ID must be exactly 13 digits';
  return '';
}

function validatePhone(value) {
  if (!value) return 'Phone number is required';
  if (!/^0\d{9}$/.test(value)) return 'Enter a 10-digit number starting with 0';
  return '';
}

function validatePIN(value) {
  if (!value) return 'PIN is required';
  if (!/^\d{8}$/.test(value)) return 'PIN must be exactly 8 digits';
  return '';
}

function validateBusinessName(value) {
  if (!value || value.trim().length < 2) return 'Business name is required';
  return '';
}

export default function Register({ onSwitch }) {
  const [values, setValues] = useState({ businessName: '', saId: '', phoneNumber: '', pin: '', confirmPin: '' });
  const [errors, setErrors] = useState({});
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); 

  const setField = (name, raw) => {
    // Strip non-numeric characters for ID, Phone, and PIN
    let v = raw;
    if (['saId', 'phoneNumber', 'pin', 'confirmPin'].includes(name)) {
      v = raw.replace(/\D/g, ''); 
    }
    setValues({ ...values, [name]: v });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Basic frontend validation catch
    const nextErrors = {
      businessName: validateBusinessName(values.businessName),
      saId: validateID(values.saId),
      phoneNumber: validatePhone(values.phoneNumber),
      pin: validatePIN(values.pin),
      confirmPin: values.confirmPin !== values.pin ? 'PINs do not match' : ''
    };
    
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    
    try {
      // Direct connection to the C# Bridge
      const res = await fetch('http://localhost:5221/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saId: values.saId,
          phoneNumber: values.phoneNumber,
          pin: values.pin,
          businessName: values.businessName.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || `Registration failed` });
        return;
      }

      setStatus({ type: 'success', msg: 'Account created! You can now sign in.' });
      setValues({ businessName: '', saId: '', phoneNumber: '', pin: '', confirmPin: '' });
    } catch {
      setStatus({ type: 'error', msg: 'API Offline. Ensure C# backend runs on port 5221.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tw-login">
      <form className="tw-card" onSubmit={handleSubmit} noValidate>
        <div className="tw-logo">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="3" /><path d="M16 12h.01M2 9h14M5 6V5h9" /></svg>
        </div>

        <h1 className="tw-title">Create <span>Account</span></h1>
        <p className="tw-subtitle">Register a new trader profile</p>

        {status && (
          <div className={`tw-status ${status.type === 'error' ? 'tw-status-error' : 'tw-status-success'}`}>
            <strong>{status.type === 'error' ? 'Error: ' : 'Success: '}</strong> {status.msg}
          </div>
        )}

        <div className="tw-group">
          <label className="tw-label">BUSINESS NAME</label>
          <div className={`tw-field ${errors.businessName ? 'tw-invalid' : ''}`}>
            <input type="text" placeholder="Spaza Corner Market" value={values.businessName} onChange={(e) => setField('businessName', e.target.value)} />
          </div>
          {errors.businessName && <span style={{color: 'var(--error)', fontSize: '11px', marginLeft: '5px'}}>{errors.businessName}</span>}
        </div>

        <div className="tw-group">
          <label className="tw-label">ID NUMBER</label>
          <div className={`tw-field ${errors.saId ? 'tw-invalid' : ''}`}>
            <input type="text" inputMode="numeric" maxLength="13" placeholder="13-digit SA ID number" value={values.saId} onChange={(e) => setField('saId', e.target.value)} />
          </div>
          {errors.saId && <span style={{color: 'var(--error)', fontSize: '11px', marginLeft: '5px'}}>{errors.saId}</span>}
        </div>

        <div className="tw-group">
          <label className="tw-label">PHONE NUMBER</label>
          <div className={`tw-field ${errors.phoneNumber ? 'tw-invalid' : ''}`}>
            <input type="tel" inputMode="numeric" maxLength="10" placeholder="0825551234" value={values.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
          </div>
          {errors.phoneNumber && <span style={{color: 'var(--error)', fontSize: '11px', marginLeft: '5px'}}>{errors.phoneNumber}</span>}
        </div>

        <div className="tw-group">
          <label className="tw-label">PIN</label>
          <div className={`tw-field ${errors.pin ? 'tw-invalid' : ''}`}>
            <input type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength="8" placeholder="8-digit PIN" value={values.pin} onChange={(e) => setField('pin', e.target.value)} />
            <button type="button" onClick={() => setShowPin(!showPin)} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'}}>
              {showPin ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.pin && <span style={{color: 'var(--error)', fontSize: '11px', marginLeft: '5px'}}>{errors.pin}</span>}
        </div>

        <div className="tw-group">
          <label className="tw-label">CONFIRM PIN</label>
          <div className={`tw-field ${errors.confirmPin ? 'tw-invalid' : ''}`}>
            <input type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength="8" placeholder="Re-enter PIN" value={values.confirmPin} onChange={(e) => setField('confirmPin', e.target.value)} />
          </div>
          {errors.confirmPin && <span style={{color: 'var(--error)', fontSize: '11px', marginLeft: '5px'}}>{errors.confirmPin}</span>}
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