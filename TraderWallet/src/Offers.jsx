import { useEffect, useState } from 'react';
import './Login.css';

export default function Offers({ session, onBack, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerData, setOfferData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchOffers = async () => {
      if (!session?.userId) {
        setError('No trader selected. Please sign in again.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/CreditPassport/evaluate/${encodeURIComponent(session.userId)}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || `Unable to load offers (${res.status})`);
        }

        const data = await res.json();
        if (!mounted) return;
        setOfferData(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load offers.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchOffers();
    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  const saScoreFromTrust = (trust) => Math.round(300 + (trust / 100) * (740 - 300));

  const offerCards = (() => {
    if (!offerData) return [];
    const trustScore = offerData.trustScore ?? 0;
    const creditLimit = Number(offerData.creditLimit ?? 0);

    // Map internal 0-100 trustScore to South African ClearScore range 300-740
    const saScore = saScoreFromTrust(trustScore);

    if ((saScore ?? 0) < 300 + Math.round((740 - 300) * 0.25)) {
      return [
        {
          title: 'No loan available yet',
          description: 'You need more transaction history to unlock loan offers. Keep trading regularly to increase your score.',
          amount: 'R 0.00',
        },
      ];
    }

    return [
      {
        title: 'Pre-Approved Loan',
        description: 'A short-term unsecured loan based on your trading history and trust score.',
        amount: `R ${Math.max(0, Math.floor(creditLimit)).toLocaleString()}`,
        saScore,
      },
    ];
  })();

  return (
    <div className="tw-login">
      <div className="tw-card tw-home-card">
        <div className="tw-home-head">
          <div>
            <p className="tw-home-label">Loan Offers</p>
            <h1 className="tw-home-title">Available Credit</h1>
          </div>
          <button className="tw-btn-ghost" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>

        <button className="tw-btn-ghost" type="button" onClick={onBack} style={{ marginBottom: 20 }}>
          ← Back to home
        </button>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading your credit passport and offer details…</p>}

        {error && (
          <div className="tw-status tw-status-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {!loading && !error && offerData && (
          <>
            <div className="tw-balance-card" style={{ marginBottom: 20 }}>
              <p className="tw-balance-label">Pre-Approved Loan</p>
              <p className="tw-balance-value">R {Number(offerData.creditLimit).toFixed(2)}</p>
            </div>

            <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
              <div className="tw-action-card" style={{ padding: '18px 20px', cursor: 'default' }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>ClearScore (SA)</p>
                <h2 style={{ margin: '8px 0 0', fontSize: 32, color: 'var(--primary)' }}>{offerCards[0]?.saScore ?? saScoreFromTrust(offerData.trustScore ?? 0)}</h2>
                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Range: 300–740</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {offerCards.map((offer) => (
                <div key={offer.title} className="tw-action-card" style={{ padding: '18px 20px' }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{offer.title}</p>
                  <h2 style={{ margin: '8px 0 0', fontSize: 26 }}>{offer.amount}</h2>
                  <p style={{ marginTop: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>{offer.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
