import React, { useState } from 'react';
import { Shield, Zap, Sliders, Database, Server, RefreshCw } from 'lucide-react';

export default function Settings({ threshold, onThresholdChange }) {
    const [modelType, setModelType] = useState('EnsV4');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease-out', maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#2C2418', marginBottom: 24, fontWeight: 700, letterSpacing: 1 }}>ENGINE CONFIGURATION</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Risk Threshold Slider */}
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Sliders size={20} color="#C06820" />
                        <h3 style={{ fontFamily: 'Quicksand', fontSize: 15, color: '#2C2418', letterSpacing: 1, fontWeight: 700 }}>RISK THRESHOLDS</h3>
                    </div>

                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#7A6E5D', fontWeight: 600 }}>Critical Risk Boundary</span>
                        <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#C62828', fontWeight: 700 }}>≥ {threshold.toFixed(2)}</span>
                    </div>
                    <input
                        type="range" min="0.1" max="0.9" step="0.01" value={threshold} onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#C06820', cursor: 'grab' }}
                    />
                    <p style={{ fontSize: 12, color: '#A69882', marginTop: 12, fontWeight: 500 }}>Containers with a risk score at or above this threshold will be classified as Critical. Medium risk starts at half this value.</p>
                </div>

                {/* Model Configuration */}
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Database size={20} color="#C06820" />
                        <h3 style={{ fontFamily: 'Quicksand', fontSize: 15, color: '#2C2418', letterSpacing: 1, fontWeight: 700 }}>ACTIVE MODEL</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        {[
                            { id: 'EnsV3', name: 'v3 (XGB Baseline)', perf: 'F1: 94.2%', desc: 'The original model. Uses a decision-tree approach (XGBoost) to flag risky containers based on past smuggling patterns. Reliable but may miss rare edge cases.' },
                            { id: 'EnsV4', name: 'v4 (XGB+IF SMOTE)', perf: 'F1: 97.4%', desc: 'Our best model. Combines decision trees with anomaly detection (Isolation Forest) and balances the training data so it catches rare smuggling patterns other models miss.' },
                            { id: 'DLV1', name: 'DL v1 (Exp)', perf: 'F1: 95.1%', desc: 'Experimental deep learning model. Uses neural networks to detect complex hidden patterns. Still in testing — may produce unexpected results on unusual shipments.' }
                        ].map(m => (
                            <div
                                key={m.id}
                                onClick={() => setModelType(m.id)}
                                style={{
                                    border: `1px solid ${modelType === m.id ? '#C06820' : '#D9CDBA'}`,
                                    background: modelType === m.id ? 'rgba(192,104,32,0.04)' : '#F5F0E8',
                                    borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                                    position: 'relative', overflow: 'visible'
                                }}
                                onMouseEnter={(e) => {
                                    const tooltip = e.currentTarget.querySelector('.model-tooltip');
                                    if (tooltip) tooltip.style.opacity = '1';
                                    if (tooltip) tooltip.style.transform = 'translateY(0)';
                                }}
                                onMouseLeave={(e) => {
                                    const tooltip = e.currentTarget.querySelector('.model-tooltip');
                                    if (tooltip) tooltip.style.opacity = '0';
                                    if (tooltip) tooltip.style.transform = 'translateY(4px)';
                                }}
                            >
                                {modelType === m.id && <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', background: '#C06820', color: '#FFFFFF', fontFamily: 'Quicksand', fontSize: 9, fontWeight: 800 }}>ACTIVE</div>}
                                <div style={{ fontFamily: 'Quicksand', fontSize: 14, color: '#2C2418', marginBottom: 4, fontWeight: 600 }}>{m.name}</div>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#7A6E5D', fontWeight: 500 }}>{m.perf}</div>
                                <div className="model-tooltip" style={{
                                    position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 8, zIndex: 20,
                                    background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 8, padding: '12px 14px',
                                    boxShadow: '0 4px 16px rgba(44,36,24,0.1)',
                                    fontSize: 13, lineHeight: 1.5, color: '#2C2418', fontWeight: 500,
                                    opacity: 0, transform: 'translateY(4px)', transition: 'all 0.2s ease-out',
                                    pointerEvents: 'none'
                                }}>
                                    {m.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Node Status */}
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Server size={20} color="#C06820" />
                        <h3 style={{ fontFamily: 'Quicksand', fontSize: 15, color: '#2C2418', letterSpacing: 1, fontWeight: 700 }}>NODE STATUS</h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F0E8', border: '1px solid #EDE7DB', borderRadius: 8, marginBottom: 8 }}>
                        <span style={{ color: '#7A6E5D', fontSize: 14, fontWeight: 500 }}>Primary HQ Database (US-EAST)</span>
                        <span style={{ color: '#2E7D32', fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600 }}>● CONNECTED (14ms)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F0E8', border: '1px solid #EDE7DB', borderRadius: 8 }}>
                        <span style={{ color: '#7A6E5D', fontSize: 14, fontWeight: 500 }}>Global Threat Intelligence Feed</span>
                        <span style={{ color: '#2E7D32', fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600 }}>● SYNCED (2m ago)</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 16 }}>
                    {saved && <span style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#2E7D32', letterSpacing: 1, animation: 'fadeInUp 0.3s', fontWeight: 700 }}>SETTINGS APPLIED.</span>}
                    <button
                        onClick={handleSave}
                        style={{
                            background: '#C06820', border: 'none', borderRadius: 8,
                            padding: '12px 32px', fontFamily: 'Quicksand', fontSize: 13, color: '#FFFFFF', fontWeight: 800,
                            cursor: 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8
                        }}
                    >
                        <RefreshCw size={14} /> APPLY CONFIGURATION
                    </button>
                </div>
            </div>
        </div>
    );
}
