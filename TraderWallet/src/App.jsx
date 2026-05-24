import { useState, useEffect } from 'react';
import './Login.css';
import Login from './Login';
import Register from './Register';
import PayQR from './PayQR';
import Dashboard from './Dashboard';
import Landing from './Landing';
import Withdraw from './Withdraw';
import Rewards from './Rewards';
import Offers from './Offers';

function ViewPlaceholder({ title, onBack, onSignOut }) {
  return (
    <div className="tw-login">
      <div className="tw-card tw-home-card">
        <div className="tw-home-head">
          <div>
            <p className="tw-home-label">Coming soon</p>
            <h1 className="tw-home-title">{title}</h1>
          </div>
          <button className="tw-btn-ghost" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>

        <p style={{ marginBottom: 28, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          This section is not implemented yet. Use the back button to return to your landing page.
        </p>

        <button className="tw-btn-ghost" type="button" onClick={onBack}>
          ← Back to home
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('login');
  const [session, setSession] = useState(null);
  const [dashboardView, setDashboardView] = useState('landing');

  const params = new URLSearchParams(window.location.search);
  const isPayPage =
    window.location.pathname.replace(/\/+$/, '').endsWith('/pay') ||
    params.has('traderId');
  if (isPayPage) return <PayQR />;

  const handleSignOut = () => {
    setSession(null);
    try { localStorage.removeItem('tw_session'); } catch {}
    setPage('login');
    setDashboardView('landing');
  };

  // Restore persisted session (if any) on app load
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tw_session');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.userId) setSession(obj);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist session when it changes and has `remember` flag
  useEffect(() => {
    try {
      if (session && session.remember) {
        localStorage.setItem('tw_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('tw_session');
      }
    } catch {
      // ignore
    }
  }, [session]);

  // Poll the server for the latest profile while signed in so the balance
  // shown on the landing page updates shortly after payments arrive.
  useEffect(() => {
    let mounted = true;
    let timer = null;
    const fetchProfile = async () => {
      if (!session?.userId) return;
      try {
        const res = await fetch(`/api/auth/profile/${encodeURIComponent(session.userId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setSession((prev) => prev ? { ...prev, balance: data.omnibusBalance ?? prev.balance, rewardPoints: data.rewardPoints ?? prev.rewardPoints } : prev);
      } catch {
        // ignore errors silently
      }
    };

    if (session) {
      // immediate fetch then periodic
      fetchProfile();
      timer = setInterval(fetchProfile, 8000);
    }

    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [session]);

  if (session) {
    if (dashboardView === 'receive') {
      return (
        <Dashboard
          session={session}
          onBack={() => setDashboardView('landing')}
          onSignOut={handleSignOut}
          onProfileUpdate={({ balance, rewardPoints }) => setSession((prev) => prev ? { ...prev, balance, rewardPoints } : prev)}
        />
      );
    }

    if (dashboardView === 'withdraw') {
      return (
        <Withdraw
          session={session}
          onBack={() => setDashboardView('landing')}
          onSignOut={handleSignOut}
          onWithdrawSuccess={(newBalance) => setSession((prev) => prev ? { ...prev, balance: newBalance } : prev)}
        />
      );
    }

    if (dashboardView === 'rewards') {
      return (
        <Rewards
          session={session}
          onBack={() => setDashboardView('landing')}
          onSignOut={handleSignOut}
          onProfileUpdate={({ rewardPoints }) => setSession((prev) => prev ? { ...prev, rewardPoints } : prev)}
        />
      );
    }

    if (dashboardView === 'offers') {
      return <Offers session={session} onBack={() => setDashboardView('landing')} onSignOut={handleSignOut} />;
    }

    return (
      <Landing
        session={session}
        onSelect={(view) => setDashboardView(view)}
        onSignOut={handleSignOut}
        onProfileUpdate={({ balance, rewardPoints }) => setSession((prev) => prev ? { ...prev, balance, rewardPoints } : prev)}
      />
    );
  }

  const handleAuth = (sess) => {
    setSession(sess);
  };

  return page === 'login'
    ? <Login onSwitch={() => setPage('register')} onAuth={handleAuth} />
    : <Register onSwitch={() => setPage('login')} />;
}
