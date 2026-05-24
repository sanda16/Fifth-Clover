import { useState } from 'react';
import './Login.css';

export default function Withdraw({ session, onBack, onSignOut, onWithdrawSuccess }) {
  const [tab, setTab] = useState('withdraw'); // 'withdraw' or 'b2b'
  
  // Withdrawal state
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // B2B state
  const [b2bSupplierId, setB2bSupplierId] = useState('');
  const [b2bAmount, setB2bAmount] = useState('');
  const [b2bError, setB2bError] = useState('');
  const [b2bStatus, setB2bStatus] = useState(null);
  const [b2bSubmitting, setB2bSubmitting] = useState(false);

  const balance = Number(session.balance ?? 0).toFixed(2);

  const handleAmountChange = (e) => {
    const next = e.target.value.replace(/[^0-9.]/g, '');
    const parts = next.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) {
      setAmount(`${parts[0]}.${parts[1].slice(0, 2)}`);
    } else {
      setAmount(next);
    }
    setError('');
  };

  const handleB2bAmountChange = (e) => {
    const next = e.target.value.replace(/[^0-9.]/g, '');
    const parts = next.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) {
      setB2bAmount(`${parts[0]}.${parts[1].slice(0, 2)}`);
    } else {
      setB2bAmount(next);
    }
    setB2bError('');
  };

  const handleB2bSupplierChange = (e) => {
    setB2bSupplierId(e.target.value);
    setB2bError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (parsedAmount > Number(balance)) {
      setError('Insufficient funds in your digital wallet.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traderId: session.userId, amount: parsedAmount }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Withdrawal failed (${res.status})`);
        return;
      }

      setStatus({ type: 'success', msg: data.message || 'Withdrawal completed.' });
      setAmount('');
      if (onWithdrawSuccess) onWithdrawSuccess(data.remainingBalance ?? 0);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleB2bSubmit = async (e) => {
    e.preventDefault();
    setB2bStatus(null);

    if (!b2bSupplierId.trim()) {
      setB2bError('Enter supplier ID');
      return;
    }

    const parsedAmount = Number(b2bAmount);
    if (!b2bAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setB2bError('Enter a valid amount');
      return;
    }

    if (parsedAmount > Number(balance)) {
      setB2bError('Insufficient funds in your digital wallet.');
      return;
    }

    setB2bSubmitting(true);
    try {
      const res = await fetch('/api/transactions/b2b-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderTraderId: session.userId,
          receiverSupplierId: b2bSupplierId.trim(),
          amount: parsedAmount,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setB2bError(data.error || `Transfer failed (${res.status})`);
        return;
      }

      setB2bStatus({ type: 'success', msg: data.message || 'Transfer completed successfully!' });
      setB2bSupplierId('');
      setB2bAmount('');
      if (onWithdrawSuccess) onWithdrawSuccess(data.senderRemainingBalance ?? 0);
      
      // Clear success message after 5 seconds
      setTimeout(() => setB2bStatus(null), 5000);
    } catch {
      setB2bError('Could not reach the server. Check your connection and try again.');
    } finally {
      setB2bSubmitting(false);
    }
  };

  return (
    <div className="tw-login">
      <div className="tw-card tw-home-card">
        <div className="tw-home-head">
          <div>
            <p className="tw-home-label">Manage Funds</p>
            <h1 className="tw-home-title">Withdraw & Transfer</h1>
          </div>
          <button className="tw-btn-ghost" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--bg-secondary)',
          paddingBottom: '12px'
        }}>
          <button
            onClick={() => {
              setTab('withdraw');
              setError('');
              setStatus(null);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: tab === 'withdraw' ? 'var(--primary)' : 'transparent',
              color: tab === 'withdraw' ? '#fff' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === 'withdraw' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            Cash-Out
          </button>
          <button
            onClick={() => {
              setTab('b2b');
              setB2bError('');
              setB2bStatus(null);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: tab === 'b2b' ? 'var(--primary)' : 'transparent',
              color: tab === 'b2b' ? '#fff' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === 'b2b' ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            B2B Transfer
          </button>
        </div>

        <div className="tw-balance-card">
          <p className="tw-balance-label">Available balance</p>
          <p className="tw-balance-value">R {balance}</p>
        </div>

        {/* Withdrawal Tab */}
        {tab === 'withdraw' && (
          <>
            <p className="tw-withdraw-note">
              Pull money out of your virtual allocation to get an Instant Money voucher.
            </p>

            {status && (
              <div className={`tw-status tw-status-success`}>
                {status.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="tw-group">
                <label className="tw-label" htmlFor="withdraw-amount">Withdrawal amount</label>
                <div className={`tw-amount-wrap${error ? ' tw-invalid' : ''}`}>
                  <span className="tw-cur">R</span>
                  <input
                    id="withdraw-amount"
                    className="tw-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    aria-invalid={!!error}
                  />
                </div>
                {error && <div className="tw-msg tw-show">{error}</div>}
              </div>

              <button className="tw-btn" type="submit" disabled={submitting}>
                {submitting ? 'Processing withdrawal…' : 'Generate voucher'}
              </button>
            </form>
          </>
        )}

        {/* B2B Transfer Tab */}
        {tab === 'b2b' && (
          <>
            <p className="tw-withdraw-note">
              Transfer funds directly to a supplier with zero fees. The transfer is instant and internal.
            </p>

            {b2bStatus && (
              <div className={`tw-status tw-status-success`}>
                {b2bStatus.msg}
              </div>
            )}

            <form onSubmit={handleB2bSubmit} noValidate>
              <div className="tw-group">
                <label className="tw-label" htmlFor="b2b-supplier">Supplier ID</label>
                <input
                  id="b2b-supplier"
                  className="tw-amount"
                  placeholder="Enter supplier ID"
                  value={b2bSupplierId}
                  onChange={handleB2bSupplierChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--bg-secondary)',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                  aria-invalid={!!b2bError}
                />
              </div>

              <div className="tw-group">
                <label className="tw-label" htmlFor="b2b-amount">Transfer amount</label>
                <div className={`tw-amount-wrap${b2bError ? ' tw-invalid' : ''}`}>
                  <span className="tw-cur">R</span>
                  <input
                    id="b2b-amount"
                    className="tw-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={b2bAmount}
                    onChange={handleB2bAmountChange}
                    aria-invalid={!!b2bError}
                  />
                </div>
                {b2bError && <div className="tw-msg tw-show">{b2bError}</div>}
              </div>

              <button className="tw-btn" type="submit" disabled={b2bSubmitting}>
                {b2bSubmitting ? 'Processing transfer…' : 'Send Transfer'}
              </button>
            </form>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <strong>Zero fees:</strong> All B2B transfers are processed with no transaction fees and are completed instantly.
            </div>
          </>
        )}

        <button className="tw-btn-ghost" type="button" onClick={onBack} style={{ marginTop: 16 }}>
          ← Back to home
        </button>
      </div>
    </div>
  );
}

