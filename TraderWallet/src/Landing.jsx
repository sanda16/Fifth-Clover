import './Login.css';

export default function Landing({ session, onSelect, onSignOut, onProfileUpdate }) {
  const businessName = session.businessName || 'Trader';
  const balance = session.balance ?? '0.00';

  const refresh = async () => {
    if (!session?.userId || !onProfileUpdate) return;
    try {
      const res = await fetch(`/api/auth/profile/${encodeURIComponent(session.userId)}`);
      if (!res.ok) return;
      const data = await res.json();
      onProfileUpdate({ balance: data.omnibusBalance, rewardPoints: data.rewardPoints });
    } catch {
      // ignore
    }
  };

  return (
    <div className="tw-login">
      <div className="tw-card tw-home-card">
        <div className="tw-home-head">
          <div>
            <p className="tw-home-label">Welcome back,</p>
            <h1 className="tw-home-title">{businessName}</h1>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <small style={{ color: 'var(--text-muted)' }}>Trader ID:</small>
              <code id="trader-id" style={{ background: 'transparent', padding: 0 }}>{session.userId}</code>
              <button
                className="tw-btn-ghost"
                type="button"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(session.userId); } catch { }
                }}
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                Copy
              </button>
            </div>
          </div>
          <button className="tw-btn-ghost" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>

        <div className="tw-balance-card">
          <p className="tw-balance-label">R Balance</p>
          <p className="tw-balance-value">R {balance}</p>
        </div>

        <div className="tw-actions">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button className="tw-btn-ghost" type="button" onClick={refresh}>Refresh balance</button>
          </div>
          <button className="tw-action-card" type="button" onClick={() => onSelect('receive')}>
            <span className="tw-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="12" rx="2" />
                <path d="M3 11h18" />
              </svg>
            </span>
            <span className="tw-action-label">Receive Payment</span>
          </button>
          <button className="tw-action-card" type="button" onClick={() => onSelect('withdraw')}>
            <span className="tw-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            </span>
            <span className="tw-action-label">Withdraw</span>
          </button>
          <button className="tw-action-card" type="button" onClick={() => onSelect('rewards')}>
            <span className="tw-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
              </svg>
            </span>
            <span className="tw-action-label">Rewards</span>
          </button>
          <button className="tw-action-card" type="button" onClick={() => onSelect('offers')}>
            <span className="tw-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h18" />
                <path d="M16 8v13H8V8" />
                <path d="M8 8l2-5h4l2 5" />
              </svg>
            </span>
            <span className="tw-action-label">Offers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
