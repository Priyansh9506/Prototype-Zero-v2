import React, { useState, useRef } from 'react';
import { Upload, Database, FileText, ShieldCheck } from 'lucide-react';

export default function UploadData({ onFileLoaded }) {
    const fileRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) onFileLoaded(file);
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileLoaded(file);
    };

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease-out', maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#2C2418', marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>UPLOAD DATA</h2>
            <p style={{ color: '#7A6E5D', fontSize: 15, marginBottom: 32, fontWeight: 500 }}>Upload container shipment data (CSV format) for real-time risk scoring and anomaly detection.</p>

            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? '#C06820' : '#D9CDBA'}`,
                    borderRadius: 16, padding: '60px 32px',
                    background: dragging ? 'rgba(192,104,32,0.04)' : '#FFFDF8',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.3s',
                    animation: dragging ? 'dropzonePulse 1.2s infinite' : 'none'
                }}
            >
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(192,104,32,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Upload size={40} color="#C06820" />
                </div>
                <h3 style={{ fontFamily: 'Quicksand', fontSize: 20, color: '#2C2418', marginBottom: 12, fontWeight: 700 }}>Drag & Drop CSV</h3>
                <p style={{ color: '#7A6E5D', fontSize: 15, marginBottom: 24, fontWeight: 500 }}>or click to browse your local file system</p>
                <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleChange} />

                <div style={{
                    background: '#C06820', border: 'none', borderRadius: 8,
                    padding: '12px 24px', fontFamily: 'Quicksand', fontSize: 13, color: '#FFFFFF', fontWeight: 800,
                    cursor: 'pointer', letterSpacing: 1, pointerEvents: 'none', display: 'inline-block'
                }}>
                    SELECT DATASET
                </div>
            </div>

            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <Database size={24} color="#C06820" style={{ marginBottom: 12 }} />
                    <h4 style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>REQUIRED COLUMNS</h4>
                    <p style={{ fontSize: 13, color: '#7A6E5D', lineHeight: 1.6 }}>Container_ID, Declared_Weight, Measured_Weight, Declared_Value, Dwell_Time_Hours, Origin_Country, ...</p>
                </div>
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <FileText size={24} color="#C06820" style={{ marginBottom: 12 }} />
                    <h4 style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>FORMAT</h4>
                    <p style={{ fontSize: 13, color: '#7A6E5D', lineHeight: 1.6 }}>Comma-separated values (.csv) with headers in top row. Maximum file size 50MB.</p>
                </div>
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <ShieldCheck size={24} color="#C06820" style={{ marginBottom: 12 }} />
                    <h4 style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>LOCAL PROCESSING</h4>
                    <p style={{ fontSize: 13, color: '#7A6E5D', lineHeight: 1.6 }}>Data is parsed securely in-browser. No sensitive operational data leaves this machine.</p>
                </div>
            </div>
        </div>
    );
}
