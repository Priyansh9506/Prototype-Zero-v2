'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { clearCache } from '@/lib/data';
import { apiFetch } from '@/lib/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) {
      setFile(f);
      setError(null);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/predict', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      setResults(data);
      clearCache();
    } catch (err) {
      setError(`Upload failed: ${err.message}. Make sure the API server is running (python api/main.py)`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Upload & Predict</h1>
        <p>Upload a CSV file with container data to get AI-powered risk predictions</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`glass-card upload-zone ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        <Upload size={48} />
        <h3>Drop your CSV file here</h3>
        <p>or click to browse • Accepts .csv files with container shipment data</p>
        {file && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <FileText size={16} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{file.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({(file.size / 1024).toFixed(0)} KB)</span>
          </div>
        )}
        {file && !uploading && (
          <button className="upload-btn" onClick={(e) => { e.stopPropagation(); handleUpload(); }}>
            🚀 Analyze Containers
          </button>
        )}
      </div>

      {/* Loading */}
      {uploading && (
        <div className="glass-card" style={{ marginTop: 24, padding: 40, textAlign: 'center' }}>
          <div className="spinner" />
          <h3>Processing Containers...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Running feature engineering, ensemble prediction, and SHAP explainability</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ marginTop: 24, padding: 24, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-red)' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ marginTop: 24 }}>
          <div className="glass-card" style={{ padding: 24, borderColor: 'rgba(16,185,129,0.3)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <CheckCircle size={20} color="var(--accent-emerald)" />
              <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>Analysis Complete!</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>{results.message}</p>
          </div>

          <div className="stats-grid">
            <div className="glass-card stat-card cyan">
              <div className="stat-value">{results.summary?.total_containers}</div>
              <div className="stat-label">Total Containers</div>
            </div>
            <div className="glass-card stat-card red">
              <div className="stat-value">{results.summary?.critical_count}</div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="glass-card stat-card emerald">
              <div className="stat-value">{results.summary?.low_risk_count}</div>
              <div className="stat-label">Low Risk</div>
            </div>
            <div className="glass-card stat-card purple">
              <div className="stat-value">{results.summary?.avg_risk_score}</div>
              <div className="stat-label">Avg Score</div>
            </div>
          </div>

          {/* Sample predictions table */}
          <div className="glass-card table-card">
            <h3>Sample Predictions</h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Container ID</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {results.predictions?.slice(0, 20).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{p.Container_ID}</td>
                      <td style={{ fontWeight: 600, color: p.Risk_Score >= 55 ? '#ef4444' : '#10b981' }}>{p.Risk_Score}</td>
                      <td><span className={`badge ${p.Risk_Level === 'Critical' ? 'critical' : 'low-risk'}`}>{p.Risk_Level}</span></td>
                      <td style={{ fontSize: 12, maxWidth: 400, color: 'var(--text-muted)' }}>{p.Explanation_Summary?.substring(0, 120)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Required Format */}
      <div className="glass-card detail-section" style={{ marginTop: 24 }}>
        <h3>📋 Required CSV Format</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>Your CSV file should contain these columns:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Container_ID', 'Declaration_Date', 'Declaration_Time', 'Trade_Regime', 'Origin_Country', 'Destination_Port', 'Destination_Country', 'HS_Code', 'Importer_ID', 'Exporter_ID', 'Declared_Value', 'Declared_Weight', 'Measured_Weight', 'Shipping_Line', 'Dwell_Time_Hours', 'Clearance_Status'].map(col => (
            <code key={col} style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>{col}</code>
          ))}
        </div>
      </div>
    </div>
  );
}
