import { useState, useEffect } from 'react';
import './Login.css';

export default function Rewards({ session, onBack, onSignOut, onProfileUpdate }) {
  const [rewardPoints, setRewardPoints] = useState(session.rewardPoints || 0);
  const [network, setNetwork] = useState('');
  const [airtimeAmount, setAirtimeAmount] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  const traderId = session.userId;

  // Fetch current rewards balance on component mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch(`/api/rewards/balance/${encodeURIComponent(traderId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setRewardPoints(data.rewardPoints);
      } catch {
        // ignore errors
      }
    };

    fetchBalance();
  }, [traderId]);

  const handleNetworkChange = (e) => {
    setNetwork(e.target.value);
    setError('');
  };

  const handleAirtimeChange = (e) => {
    const next = e.target.value.replace(/[^0-9]/g, '');
    setAirtimeAmount(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setVoucherCode('');

    if (!network) {
      setError('Please select a network');
      return;
    }

    const parsedAmount = Number(airtimeAmount);
    if (!airtimeAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid airtime amount');
      return;
    }

    if (parsedAmount > rewardPoints) {
      setError('Insufficient reward points. You need more points to claim this reward.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traderId,
          network,
          airtimeAmount: parsedAmount,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Claim failed (${res.status})`);
        return;
      }

      setStatus('success');
      setVoucherCode(data.voucherCode);
      setRewardPoints(data.remainingPoints);
      if (onProfileUpdate) {
        onProfileUpdate({ rewardPoints: data.remainingPoints });
      }

      // Reset form
      setNetwork('');
      setAirtimeAmount('');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus(null);
        setVoucherCode('');
      }, 5000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tw-login">
      <div className="tw-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button className="tw-btn-ghost" type="button" onClick={onBack}>
            ← Back
          </button>
          <button className="tw-btn-ghost" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>

        <h1 className="tw-title">Reward <span>Points</span></h1>
        
        {/* Balance Display */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
            Current Balance
          </p>
          <h2 style={{ color: 'var(--primary)', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {rewardPoints.toLocaleString()}
            <span style={{ fontSize: '18px' }}> points</span>
          </h2>
        </div>

        {/* Success Message */}
        {status === 'success' && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#155724'
          }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              ✓ Airtime voucher issued successfully!
            </p>
            {voucherCode && (
              <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                Voucher Code: <strong>{voucherCode}</strong>
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#721c24'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              ✗ {error}
            </p>
          </div>
        )}

        {/* Claim Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Network
            </label>
            <select
              value={network}
              onChange={handleNetworkChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--bg-secondary)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a network...</option>
              <option value="Vodacom">Vodacom</option>
              <option value="MTN">MTN</option>
              <option value="CellC">CellC</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Airtime Amount
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g., 10, 20, 50"
              value={airtimeAmount}
              onChange={handleAirtimeChange}
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
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="tw-btn"
            style={{
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
              width: '100%',
              marginBottom: '12px'
            }}
          >
            {submitting ? 'Processing...' : 'Claim Airtime Reward'}
          </button>
        </form>

        {/* Info Section */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          <p style={{ marginTop: 0 }}>
            <strong>How it works:</strong>
          </p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Earn reward points through transactions</li>
            <li>Exchange points for airtime vouchers</li>
            <li>Each point equals 1 in airtime value</li>
            <li>Use your voucher code with your selected network</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
