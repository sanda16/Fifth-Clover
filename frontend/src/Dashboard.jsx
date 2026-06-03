import { useState } from 'react';

export default function Dashboard({ session, onSignOut }) {
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [mlResult, setMlResult] = useState(null);

  const [omnibus, setOmnibus] = useState(450.00);
  const [cashFlow, setCashFlow] = useState(3200.00);
  const [message, setMessage] = useState('');
  
  const [chatLogs, setChatLogs] = useState([
    { sender: 'bot', text: `Hi! Reply with your daily cash sales or expenses to build your credit profile.` }
  ]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!message) return;

    setChatLogs(prev => [...prev, { sender: 'user', text: message }]);
    const amount = message.match(/\d+/) ? parseFloat(message.match(/\d+/)[0]) : 0;
    
    let reply = "Data logged. Zero data charges applied.";
    
    // Front-end parsing matching the "Money Out" logic required by the ML model
    if (message.toLowerCase().includes('made') || message.toLowerCase().includes('sold')) {
      setCashFlow(prev => prev + amount);
      reply = `Logged cash income of R${amount}.`;
    } else if (message.toLowerCase().includes('paid') || message.toLowerCase().includes('bought')) {
      // Money Out logic tracked here
      setCashFlow(prev => Math.max(0, prev - amount));
      reply = `Logged verified outflow of R${amount}. Expense ratio updated.`;
    }

    setTimeout(() => setChatLogs(prev => [...prev, { sender: 'bot', text: reply }]), 800);
    setMessage('');
  };

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5221/api/credit/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session.idNumber || "8805125023081")
      });
      const data = await res.json();
      setMlResult(data);
    } catch (err) {
      alert("C# Bridge Offline. Ensure API runs on port 5221.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw-login">
      <div className="tw-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="tw-title" style={{ margin: 0 }}>Smart<span>Cash</span></h2>
          <button onClick={onSignOut} style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontWeight: 'bold', cursor: 'pointer' }}>Exit</button>
        </div>

        {view === 'home' && (
          <div style={{ animation: 'tw-fade 0.4s ease' }}>
            <div className="tw-dash-grid">
              <div className="tw-metric-card" style={{ background: 'var(--sb-blue)', color: 'white' }}>
                <small style={{ color: 'rgba(255,255,255,0.7)' }}>Omnibus (Digital)</small>
                <h3 style={{ color: 'white' }}>R {omnibus.toFixed(2)}</h3>
              </div>
              <div className="tw-metric-card" style={{ border: '2px solid var(--sb-blue)' }}>
                <small>Physical Cash</small>
                <h3>R {cashFlow.toFixed(2)}</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button className="tw-btn tw-btn-secondary" onClick={() => setView('qr')}>📷 Receive QR Payment</button>
              <button className="tw-btn tw-btn-secondary" onClick={() => setView('chat')}>💬 Micro-Ledger (Zero Data)</button>
              <button className="tw-btn" onClick={checkEligibility} disabled={loading}>
                {loading ? 'Evaluating AI Model...' : '🚀 Check Loan Eligibility'}
              </button>
            </div>

            {mlResult && (
              <div className="tw-metric-card" style={{ marginTop: '20px', textAlign: 'left', borderLeft: mlResult.is_fraudulent ? '5px solid var(--error)' : '5px solid var(--success)' }}>
                <strong>{mlResult.is_fraudulent ? 'Security Flag' : 'Loan Approved'}</strong>
                <p style={{ fontSize: '12px', marginTop: '5px' }}>Score: {mlResult.stability_score}/100 | Cap: R{mlResult.approved_amount}</p>
                <p style={{ fontSize: '11px', marginTop: '5px', fontStyle: 'italic' }}>"{mlResult.bank_message}"</p>
              </div>
            )}
          </div>
        )}

        {view === 'chat' && (
          <div style={{ animation: 'tw-fade 0.4s ease' }}>
            <h3 style={{ color: 'var(--sb-blue)', marginBottom: '15px' }}>Cash Logger</h3>
            <div className="tw-chat-area">
              {chatLogs.map((log, i) => (
                <div key={i} className={`tw-bubble tw-bubble-${log.sender}`}>{log.text}</div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
              <div className="tw-field" style={{ flex: 1, height: '45px' }}><input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Made R200..." /></div>
              <button type="submit" className="tw-btn" style={{ width: '80px', height: '45px' }}>Send</button>
            </form>
            <button onClick={() => setView('home')} className="tw-btn tw-btn-secondary" style={{ marginTop: '15px' }}>Back</button>
          </div>
        )}

        {view === 'qr' && (
          <div style={{ animation: 'tw-fade 0.4s ease', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--sb-blue)' }}>Standard Bank QR</h3>
            <div className="tw-metric-card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', background: '#fff' }}>
              [ STATIC QR IMAGE ]
            </div>
            <button className="tw-btn" onClick={() => { setOmnibus(prev => prev + 50); setView('home'); }}>Simulate Payment (+R50)</button>
            <button onClick={() => setView('home')} className="tw-btn tw-btn-secondary" style={{ marginTop: '15px' }}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
}