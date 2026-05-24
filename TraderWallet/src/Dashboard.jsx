import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './Login.css';

export default function Dashboard({ session, onSignOut, onBack, onProfileUpdate }) {
  const [copied, setCopied] = useState(false);
  const [liveProfile, setLiveProfile] = useState(null);

  const traderId = session.userId;
  const businessName = session.businessName || 'Trader';

  // Poll the server for the latest profile (balance, points)
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/auth/profile/${encodeURIComponent(traderId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setLiveProfile(data);
          if (onProfileUpdate && data?.omnibusBalance != null) {
            onProfileUpdate({ balance: data.omnibusBalance, rewardPoints: data.rewardPoints });
          }
        }
      } catch {
        // ignore network errors
      }
    };

    // initial fetch
    fetchProfile();
    // poll every 10 seconds
    const id = setInterval(fetchProfile, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, [traderId]);

  // This is exactly the URL the PayQR page expects to read from.
  const payUrl =
    `${window.location.origin}/pay` +
    `?traderId=${encodeURIComponent(traderId)}` +
    `&businessName=${encodeURIComponent(businessName)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (e.g. insecure context) — fall back to a prompt
      window.prompt('Copy this payment link:', payUrl);
    }
  };

  return (
    <div className="tw-login">
      <div className="tw-card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <button className="tw-btn-ghost" type="button" onClick={onBack}>
            ← Back
          </button>
          <div className="tw-logo">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h.01M21 17v4" />
            </svg>
          </div>

        </div>

        <h1 className="tw-title">Receive <span>Payment</span></h1>
        <p className="tw-qr-cap">
          Show this code to your customer. Scanning it pays <strong>{businessName}</strong>.
        </p>

        <div className="tw-qr-frame">
          <QRCodeSVG
            value={payUrl}
            size={208}
            level="M"
            fgColor="#0a3d91"
            bgColor="#ffffff"
            marginSize={2}
          />
        </div>

        <button className="tw-btn-ghost" type="button" onClick={copyLink}>
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Link copied
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy payment link
            </>
          )}
        </button>

        <div className="tw-receipt" style={{ textAlign: 'left' }}>
          <div className="tw-receipt-row">
            <span>Business</span>
            <strong>{businessName}</strong>
          </div>
          <div className="tw-receipt-row">
            <span>Trader ID</span>
            <strong>{traderId}</strong>
          </div>
          <div className="tw-receipt-row">
            <span>Balance</span>
            <strong>R{(liveProfile?.omnibusBalance ?? session.balance ?? 0).toFixed(2)}</strong>
          </div>
          {session.idNumber && (
            <div className="tw-receipt-row">
              <span>ID number</span>
              <strong>{session.idNumber}</strong>
            </div>
          )}
          {session.phoneNumber && (
            <div className="tw-receipt-row">
              <span>Phone</span>
              <strong>{session.phoneNumber}</strong>
            </div>
          )}
        </div>

        <button className="tw-btn" type="button" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}


