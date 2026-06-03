import { useState } from 'react';

export default function Login({ onSwitch, onAuth, onSecretClick }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('http://localhost:5221/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, pin }),
      });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && onAuth) {
        onAuth(data);
      }
    } catch {
      console.error("API offline, check local ports.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tw-login">
      <form className="tw-card" onSubmit={handleSubmit}>
        <div className="tw-logo">
          {/* Minimalist Wallet Icon */}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="3" /><path d="M16 12h.01M2 9h14M5 6V5h9" /></svg>
        </div>
        <h1 className="tw-title">SmartCash<span>Omni</span></h1>
        <p className="tw-subtitle">Sign in to manage your portfolio</p>

        <div className="tw-group">
          <label className="tw-label">PHONE NUMBER</label>
          <div className="tw-field">
            <input type="tel" placeholder="0825551234" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="tw-group">
          <label className="tw-label">PIN</label>
          <div className="tw-field">
            <input type="password" placeholder="8-digit PIN" value={pin} onChange={e => setPin(e.target.value)} />
          </div>
        </div>

        <div className="tw-row">
          <label className="tw-check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="tw-box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>
            Enable DigiMe FaceAuth
          </label>
        </div>

        <button className="tw-btn" type="submit" disabled={submitting}>
          {submitting ? 'Authenticating…' : 'Sign In'}
        </button>

        
        <button 
          type="button" 
          className="tw-btn tw-btn-secondary" 
          style={{ marginTop: '12px' }}
          onClick={onSwitch}
        >
          Create New Account
        </button>

        <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'center' }}>
          <button type="button" onClick={onSecretClick} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>
            (Judges: Access Backend Risk Dashboard)
          </button>
        </div>
      </form>
    </div>
  );
}