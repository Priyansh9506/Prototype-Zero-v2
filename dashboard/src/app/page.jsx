"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

// Data configs
import { computeMockRisk } from './data';

// Components
import Login from './components/Login';
import ImageAnalysis from './components/ImageAnalysis';
import Sidebar from './components/Sidebar';
import { api } from './api';
import { removeToken, getToken } from './auth';

// Pages
import Overview from './components/Overview';
import UploadData from './components/UploadData';
import Containers from './components/Containers';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Admin from './components/Admin';

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

// ── LocalStorage helpers for data persistence ──
const STORAGE_KEY = 'smartcontainer_data';

function saveDataToStorage(rows) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
        console.warn('Could not save data to localStorage:', e);
    }
}

function loadDataFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Could not load data from localStorage:', e);
    }
    return null;
}

function clearDataFromStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
}


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const [currentView, setCurrentView] = useState('overview');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [criticalThreshold, setCriticalThreshold] = useState(0.5);

  // Reclassify containers when threshold changes
  const handleThresholdChange = useCallback((newThreshold) => {
    setCriticalThreshold(newThreshold);
    setData(prev => {
      const updated = prev.map(row => {
        const score = row.Risk_Score;
        let level;
        if (score >= newThreshold) level = 'Critical';
        else if (score >= newThreshold * 0.5) level = 'Medium Risk';
        else level = 'Low Risk';
        return { ...row, Risk_Level: level };
      });
      saveDataToStorage(updated);
      return updated;
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadMsg, setLoadMsg] = useState('');

  const [clock, setClock] = useState(new Date());

  // Clock tick for header
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  // Normalize API snake_case keys to PascalCase expected by components
  const normalizeRow = (row) => {
    const getNum = (val) => {
      if (val === null || val === undefined || val === 'nan' || val === 'NaN') return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    return {
      Container_ID: row.container_id ?? row.Container_ID,
      Risk_Score: getNum(row.risk_score ?? row.Risk_Score),
      Risk_Level: row.risk_level ?? row.Risk_Level ?? 'Low Risk',
      Anomaly_Flag: row.anomaly_flag ?? row.Anomaly_Flag ?? 0,
      Declared_Value: getNum(row.declared_value ?? row.Declared_Value),
      Declared_Weight: getNum(row.declared_weight ?? row.Declared_Weight),
      Measured_Weight: getNum(row.measured_weight ?? row.Measured_Weight),
      Dwell_Time_Hours: getNum(row.dwell_time_hours ?? row.Dwell_Time_Hours),
      Origin_Country: row.origin_country ?? row.Origin_Country ?? '',
      Destination_Country: row.destination_country ?? row.Destination_Country ?? '',
      HS_Code: row.hs_code ?? row.HS_Code ?? '',
      Trade_Regime: row.trade_regime ?? row.Trade_Regime ?? '',
      Shipping_Line: row.shipping_line ?? row.Shipping_Line ?? '',
      Declaration_Date: row.declaration_date ?? row.Declaration_Date ?? '',
      Declaration_Time: row.declaration_time ?? row.Declaration_Time ?? '',
      Explanation_Summary: row.explanation_summary ?? row.Explanation_Summary ?? '',
      Image_Analysis: row.image_analysis ?? row.Image_Analysis ?? null,
    };
  };

  const handleAnalysisComplete = useCallback((containerId, analysisData) => {
    setData(prev => {
      const updated = prev.map(row => 
        row.Container_ID === containerId 
          ? { ...row, Image_Analysis: analysisData }
          : row
      );
      saveDataToStorage(updated);
      return updated;
    });
  }, []);

  // ── Authentication & Data Initialization ──
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Verify user session, then load data
    api.getUsersMe()
      .then((userData) => {
        setUser(userData);
        setIsAuthenticated(true);

        // Try to load persisted uploaded data from localStorage first
        const cached = loadDataFromStorage();
        if (cached && cached.length > 0) {
          const normalized = cached.map(normalizeRow);
          setData(normalized);
          return; // We have local data, no need to fetch from backend
        }

        // Otherwise try backend
        setLoading(true);
        setLoadMsg('Fetching Intelligence Data...');
        return Promise.all([
          api.getStats().catch(() => null),
          api.getResults(1, 100).catch(() => null)
        ]).then(([statsRes, resultsRes]) => {
          if (statsRes) setStats(statsRes);
          const apiData = resultsRes?.data || [];
          if (apiData.length > 0) {
            const normalized = apiData.map(normalizeRow);
            setData(normalized);
            saveDataToStorage(normalized);
          }
          // If no backend data and no cached data, data stays [] (empty dashboard)
          setLoading(false);
        });
      })
      .catch(() => {
        removeToken();
        setIsAuthenticated(false);
        setLoading(false);
      });
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    setIsAuthenticated(true);
    setCurrentView('overview');

    // Try to load persisted data from localStorage
    const cached = loadDataFromStorage();
    if (cached && cached.length > 0) {
      const normalized = cached.map(normalizeRow);
      setData(normalized);
      setLoading(false);
      return;
    }

    // Otherwise try backend
    setLoading(true);
    setLoadMsg('Fetching Intelligence Data...');
    Promise.all([
      api.getStats().catch(() => null),
      api.getResults(1, 100).catch(() => null)
    ]).then(([statsRes, resultsRes]) => {
      if (statsRes) setStats(statsRes);
      const apiData = resultsRes?.data || [];
      if (apiData.length > 0) {
        const normalized = apiData.map(normalizeRow);
        setData(normalized);
        saveDataToStorage(normalized);
      }
      setLoading(false);
    });
  };

  const handleLogout = () => {
    removeToken();
    clearDataFromStorage();
    setIsAuthenticated(false);
    setUser(null);
    setData([]);
    setStats(null);
  };

  // Shared generic CSV parser (local processing + localStorage persistence)
  const processCSV = useCallback((file) => {
    setLoading(true); setProgress(0); setLoadMsg('Parsing CSV...');
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data;
        setLoadMsg(`Processing ${rows.length.toLocaleString()} containers...`);
        let idx = 0; const scored = []; const batch = Math.max(1, Math.floor(rows.length / 50));
        const process = () => {
          const end = Math.min(idx + batch, rows.length);
          for (; idx < end; idx++) scored.push(computeMockRisk(rows[idx]));
          setProgress(Math.floor((idx / rows.length) * 100));
          setLoadMsg(`Scoring container ${idx.toLocaleString()} of ${rows.length.toLocaleString()}...`);
          if (idx < rows.length) requestAnimationFrame(process);
          else {
            setTimeout(() => {
              const cleaned = scored.map(normalizeRow);
              setData(cleaned);
              saveDataToStorage(cleaned); // Persist to localStorage!
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
    case 'imageAnalysis': ViewComponent = <ImageAnalysis onAnalysisComplete={handleAnalysisComplete} />; break;
    case 'settings': ViewComponent = <Settings threshold={criticalThreshold} onThresholdChange={handleThresholdChange} />; break;
    case 'admin': ViewComponent = <Admin />; break;
    default: ViewComponent = <Overview data={data} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F0E8' }}>
      {loading && <LoadingOverlay progress={progress} message={loadMsg} />}

      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} userId={user} />

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
