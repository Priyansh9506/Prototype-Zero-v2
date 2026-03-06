import React, { useMemo } from 'react';
import { X, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { getRiskColor, getRiskGlow } from './data';

export default function DetailPanel({ container, onClose }) {
    if (!container) return null;

    const color = getRiskColor(container.Risk_Level);
    const icon = container.Risk_Level === 'Critical' ? <AlertTriangle size={20} /> : container.Risk_Level === 'Medium Risk' ? <Zap size={20} /> : <ShieldCheck size={20} />;

    const shapFeatures = useMemo(() => {
        const features = [];
        const wt_d = container.Declared_Weight || 0;
        const wt_m = container.Measured_Weight || 0;
        const disc = wt_d > 0 ? Math.abs(wt_m - wt_d) / wt_d : 0;
        features.push({ name: 'Weight Discrepancy', value: disc, direction: disc > 0.10 ? 'risk' : 'safe' });
        const vpk = (container.Declared_Value || 0) / Math.max(1, wt_d);
        features.push({ name: 'Value per Kg', value: Math.min(vpk / 5000, 1), direction: vpk > 500 ? 'risk' : 'safe' });
        const dwell = container.Dwell_Time_Hours || 0;
        features.push({ name: 'Dwell Time', value: Math.min(dwell / 200, 1), direction: dwell > 72 ? 'risk' : 'safe' });
        const offHour = (() => { const h = parseInt((container.Declaration_Time || '12:00').split(':')[0]); return h < 6 || h > 21; })();
        features.push({ name: 'Declaration Timing', value: offHour ? 0.8 : 0.2, direction: offHour ? 'risk' : 'safe' });
        features.push({ name: 'Origin Risk Profile', value: container.Risk_Score * 0.6, direction: container.Risk_Score > 0.4 ? 'risk' : 'safe' });
        return features;
    }, [container]);

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, width: 480, height: '100vh', zIndex: 500,
            background: '#FFFDF8', borderLeft: '1px solid #D9CDBA', boxShadow: '-8px 0 32px rgba(44,36,24,0.08)',
            overflowY: 'auto', animation: 'slideInRight 0.3s ease-out both'
        }}>
            <div style={{ position: 'relative' }}>
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #EDE7DB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontFamily: 'Quicksand', fontSize: '12px', color: '#7A6E5D', marginBottom: 4, fontWeight: 700 }}>CONTAINER DETAIL</div>
                        <div style={{ fontFamily: 'Quicksand', fontSize: '20px', fontWeight: 700, color: '#2C2418' }}>{container.Container_ID}</div>
                    </div>
                    <button onClick={onClose} style={{ background: '#F5F0E8', border: '1px solid #D9CDBA', borderRadius: 6, padding: 8, cursor: 'pointer', color: '#7A6E5D' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Risk Summary */}
                <div style={{
                    padding: '20px 24px',
                    background: getRiskGlow(container.Risk_Level),
                    borderBottom: '1px solid #EDE7DB',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, fontFamily: 'Quicksand', fontWeight: 700, fontSize: 17 }}>
                            {icon} {container.Risk_Level.toUpperCase()}
                        </div>
                        <div style={{ color: '#7A6E5D', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
                            {container.Anomaly_Flag ? 'Isolation Forest anomaly detected' : 'Within normal parameters'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Quicksand', fontSize: 34, fontWeight: 700, color }}>{container.Risk_Score.toFixed(3)}</div>
                        <div style={{ fontSize: 12, color: '#7A6E5D', fontWeight: 600 }}>RISK SCORE</div>
                    </div>
                </div>

                {/* SHAP Breakdown */}
                <div style={{ padding: '20px 24px' }}>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#C06820', marginBottom: 16, letterSpacing: 2, fontWeight: 700 }}>RISK BREAKDOWN</div>
                    {shapFeatures.map((f, i) => (
                        <div key={i} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: '#2C2418', fontWeight: 500 }}>{f.name}</span>
                                <span style={{ fontSize: 12, fontFamily: 'Quicksand', color: f.direction === 'risk' ? '#C62828' : '#C06820', fontWeight: 700 }}>
                                    {f.direction === 'risk' ? '▲ HIGH' : '▼ LOW'}
                                </span>
                            </div>
                            <div style={{ height: 6, background: '#EDE7DB', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${Math.min(f.value, 1) * 100}%`,
                                    background: f.direction === 'risk'
                                        ? 'linear-gradient(90deg, #E65100, #C62828)'
                                        : 'linear-gradient(90deg, #C06820, #D4924A)',
                                    borderRadius: 3, transition: 'width 0.6s ease-out'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Explanation */}
                <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#C06820', marginBottom: 12, letterSpacing: 2, fontWeight: 700 }}>AI EXPLANATION</div>
                    <div style={{
                        background: '#F5F0E8', border: '1px solid #EDE7DB', borderRadius: 8, padding: 16,
                        fontFamily: 'Quicksand', fontSize: 13, lineHeight: 1.6, color: '#2C2418', fontWeight: 500,
                    }}>
                        {container.Explanation_Summary}
                    </div>
                </div>

                {/* Raw Data */}
                <div style={{ padding: '0 24px 32px' }}>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#C06820', marginBottom: 12, letterSpacing: 2, fontWeight: 700 }}>SHIPMENT DATA</div>
                    <div style={{ background: '#F5F0E8', border: '1px solid #EDE7DB', borderRadius: 8, overflow: 'hidden' }}>
                        {[
                            ['Declared Weight', `${Number(container.Declared_Weight).toLocaleString()} kg`],
                            ['Measured Weight', `${Number(container.Measured_Weight).toLocaleString()} kg`],
                            ['Declared Value', `$${Number(container.Declared_Value).toLocaleString()}`],
                            ['Dwell Time', `${container.Dwell_Time_Hours} hours`],
                            ['Origin', container.Origin_Country],
                            ['Destination', container.Destination_Country],
                            ['HS Code', container.HS_Code],
                            ['Trade Regime', container.Trade_Regime],
                            ['Shipping Line', container.Shipping_Line],
                            ['Declaration', `${container.Declaration_Date} ${container.Declaration_Time}`],
                        ].map(([label, value], i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', padding: '10px 16px',
                                borderBottom: i < 9 ? '1px solid #EDE7DB' : 'none',
                                background: i % 2 === 0 ? 'transparent' : 'rgba(44,36,24,0.01)',
                            }}>
                                <span style={{ color: '#7A6E5D', fontSize: 13, fontWeight: 500 }}>{label}</span>
                                <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', fontWeight: 600 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
