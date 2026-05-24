import { useState } from 'react';
import './Login.css';

/* ---- helpers ------------------------------------------------------- */

// keep digits + a single dot, max 2 decimal places
function sanitizeAmount(raw) {
  let v = raw.replace(/[^\d.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    // remove any extra dots after the first
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  const [whole, dec] = v.split('.');
  if (dec !== undefined) v = whole + '.' + dec.slice(0, 2);
  return v;
}

function validateAmount(value) {
  if (!value || value === '.') return 'Enter an amount';
  const num = Number(value);
  if (Number.isNaN(num)) return 'Enter a valid amount';
  if (num <= 0) return 'Amount must be greater than zero';
  return '';
}

const fmt = (n) =>
  Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---- component ----------------------------------------------------- */

export default function PayQR() {
  // QR encodes these as URL query params:
  //   /pay?traderId=lh9876543210abc&businessName=Spaza%20Corner%20Market
  const params = new URLSearchParams(window.location.search);
  const traderId = params.get('traderId') || '';
  const businessName = params.get('businessName') || '';

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'error', msg }
  const [result, setResult] = useState(null);  // success payload from API

  // ---- invalid / missing QR ----
  if (!traderId) {
    return (
      <div className="tw-login">
        <div className="tw-card" style={{ textAlign: 'center' }}>
          <div className="tw-logo">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="tw-title">Invalid <span>QR</span></h1>
          <p className="tw-subtitle">
            This payment link is missing its trader details. Please scan the
            trader's QR code again.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const v = sanitizeAmount(e.target.value);
    setAmount(v);
    if (touched) setError(validateAmount(v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const err = validateAmount(amount);
    setError(err);
    setTouched(true);
    if (err) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traderId, amount: Number(amount) }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || `Payment failed (${res.status})` });
        return;
      }

      // success: { message, newBalance, pointsEarned, totalPoints }
      setResult({ paid: Number(amount), ...data });
    } catch {
      setStatus({
        type: 'error',
        msg: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- success receipt ----
  if (result) {
    return (
      <div className="tw-login">
        <div className="tw-card" style={{ textAlign: 'center' }}>
          <div className="tw-pay-check">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 className="tw-title">Paid<span>.</span></h1>
          <p className="tw-subtitle">
            {result.message || 'Payment settled successfully!'}
          </p>

          <div className="tw-receipt">
            <div className="tw-receipt-row">
              <span>Paid to</span>
              <strong>{businessName || traderId}</strong>
            </div>
            <div className="tw-receipt-row">
              <span>Amount</span>
              <strong className="tw-big">R{fmt(result.paid)}</strong>
            </div>
            {result.pointsEarned != null && (
              <div className="tw-receipt-row">
                <span>Points earned</span>
                <strong className="tw-points">+{result.pointsEarned}</strong>
              </div>
            )}
          </div>

          <button
            className="tw-btn"
            type="button"
            onClick={() => {
              setResult(null);
              setAmount('');
              setTouched(false);
              setStatus(null);
            }}
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  // ---- payment entry ----
  return (
    <div className="tw-login">
      <form className="tw-card" onSubmit={handleSubmit} noValidate>
        <div className="tw-logo">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h.01M21 17v4" />
          </svg>
        </div>

        <p className="tw-pay-to">YOU'RE PAYING</p>
        <p className="tw-pay-name">{businessName || 'Trader'}</p>

        {status && (
          <div className={`tw-status tw-status-${status.type}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {status.msg}
          </div>
        )}

        <label className="tw-label" htmlFor="amount" style={{ textAlign: 'center' }}>
          ENTER AMOUNT
        </label>
        <div className={`tw-amount-wrap${error ? ' tw-invalid' : ''}`}>
          <span className="tw-cur">R</span>
          <input
            id="amount"
            className="tw-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={handleChange}
            onBlur={() => { setTouched(true); setError(validateAmount(amount)); }}
            autoComplete="off"
            autoFocus
            aria-invalid={!!error}
          />
        </div>
        <span className={`tw-msg${error ? ' tw-show' : ''}`} style={{ justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </span>

        <button
          className="tw-btn"
          type="submit"
          disabled={submitting}
          style={{ marginTop: 24 }}
        >
          {submitting
            ? 'Processing…'
            : amount && !validateAmount(amount)
              ? `Pay R${fmt(amount)}`
              : 'Pay'}
        </button>
      </form>
    </div>
  );
}
