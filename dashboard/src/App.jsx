import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import './index.css';

// Data configs
import { SAMPLE_DATA, computeMockRisk } from './data';

// Components
import Login from './pages/Login';
import Sidebar from './pages/Sidebar';

// Pages
import Overview from './pages/Overview';
import UploadData from './pages/UploadData';
import Containers from './pages/Containers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

/* ─── Loading Overlay ─── */
function LoadingOverlay({ progress, message }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #D9CDBA', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTop: '2px solid #C06820', borderRadius: '50%', animation: 'radarSpin 1.5s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 15, border: '1px solid #D9CDBA', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 15, border: '2px solid transparent', borderTop: '2px solid #C62828', borderRadius: '50%', animation: 'radarSpin 2s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Quicksand', fontSize: 18, fontWeight: 700, color: '#C06820' }}>
          {progress}%
        </div>
      </div>
      <div style={{ fontFamily: 'Quicksand', fontSize: 14, color: '#C06820', letterSpacing: 3, marginBottom: 8, fontWeight: 700 }}>SCANNING MANIFEST</div>
      <div style={{ fontSize: 13, color: '#7A6E5D', fontWeight: 500 }}>{message}</div>
      <div style={{ width: 280, height: 4, background: '#EDE7DB', borderRadius: 2, marginTop: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #A85818, #C06820)', transition: 'width 0.3s', borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');

  const [currentView, setCurrentView] = useState('overview');
  const [data, setData] = useState(SAMPLE_DATA);
  const [criticalThreshold, setCriticalThreshold] = useState(0.5);

  // Reclassify containers when threshold changes
  const handleThresholdChange = useCallback((newThreshold) => {
    setCriticalThreshold(newThreshold);
    setData(prev => prev.map(row => {
      const score = row.Risk_Score;
      let level;
      if (score >= newThreshold) level = 'Critical';
      else if (score >= newThreshold * 0.5) level = 'Medium Risk';
      else level = 'Low Risk';
      return { ...row, Risk_Level: level };
    }));
  }, []);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadMsg, setLoadMsg] = useState('');

  const [clock, setClock] = useState(new Date());

  // Clock tick for header
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const handleLogin = (uid) => {
    setUserId(uid);
    setIsAuthenticated(true);
    setCurrentView('overview');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserId('');
  };

  // Shared generic CSV parser
  const processCSV = useCallback((file) => {
    setLoading(true); setProgress(0); setLoadMsg('Parsing CSV…');
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data;
        setLoadMsg(`Processing ${rows.length.toLocaleString()} containers…`);
        let idx = 0; const scored = []; const batch = Math.max(1, Math.floor(rows.length / 50));
        const process = () => {
          const end = Math.min(idx + batch, rows.length);
          for (; idx < end; idx++) scored.push(computeMockRisk(rows[idx]));
          setProgress(Math.floor((idx / rows.length) * 100));
          setLoadMsg(`Scoring container ${idx.toLocaleString()} of ${rows.length.toLocaleString()}…`);
          if (idx < rows.length) requestAnimationFrame(process);
          else {
            setTimeout(() => {
              setData(scored);
              setLoading(false);
              setCurrentView('overview'); // redirect to overview on success
            }, 600);
          }
        };
        setTimeout(process, 400);
      },
    });
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Determine current page component
  let ViewComponent;
  switch (currentView) {
    case 'overview': ViewComponent = <Overview data={data} />; break;
    case 'containers': ViewComponent = <Containers data={data} />; break;
    case 'analytics': ViewComponent = <Analytics data={data} />; break;
    case 'upload': ViewComponent = <UploadData onFileLoaded={processCSV} />; break;
    case 'settings': ViewComponent = <Settings threshold={criticalThreshold} onThresholdChange={handleThresholdChange} />; break;
    default: ViewComponent = <Overview data={data} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F0E8' }}>
      {loading && <LoadingOverlay progress={progress} message={loadMsg} />}

      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} userId={userId} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          padding: '16px 32px', borderBottom: '1px solid #D9CDBA',
          background: 'rgba(255,253,248,0.9)', backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 100, height: 60
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7D32', animation: 'glow-green 2s infinite' }} />
              <span style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#2E7D32', letterSpacing: 2, fontWeight: 700 }}>SYSTEM ACTIVE</span>
            </div>
            <span style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#7A6E5D', fontWeight: 500 }}>
              {clock.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {clock.toLocaleTimeString('en-GB')}
            </span>
            <span style={{ fontFamily: 'Quicksand', fontSize: 10, color: '#FFFFFF', background: '#C06820', borderRadius: 4, padding: '3px 8px', letterSpacing: 1, fontWeight: 800 }}>CUSTOMS</span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', position: 'relative' }}>
          {ViewComponent}
        </main>
      </div>
    </div>
  );
}
