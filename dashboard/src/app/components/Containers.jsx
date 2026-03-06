import React, { useState, useMemo } from 'react';
import { getRiskColor, getRiskGlow } from '../data';
import DetailPanel from './DetailPanel';
import { Download, Search, AlertTriangle, Zap, ShieldCheck } from 'lucide-react';

function RiskBadge({ level }) {
    const c = getRiskColor(level);
    const icons = { 'Critical': '⚠', 'Medium Risk': '⚡', 'Low Risk': '✓' };
    return (
        <span style={{
            background: getRiskGlow(level), color: c, border: `1px solid ${c}30`,
            borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700,
            fontFamily: 'Quicksand', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
            {icons[level]} {level.toUpperCase()}
        </span>
    );
}

function RiskBar({ score }) {
    const c = getRiskColor(score >= 0.5 ? 'Critical' : score >= 0.25 ? 'Medium Risk' : 'Low Risk');
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 6, background: '#EDE7DB', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score * 100}%`, background: c, borderRadius: 3, transition: 'width 0.6s ease-out' }} />
            </div>
            <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: c, fontWeight: 700, minWidth: 40 }}>{score.toFixed(3)}</span>
        </div>
    );
}

export default function Containers({ data }) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('Risk_Score');
    const [sortDir, setSortDir] = useState('desc');
    const [filter, setFilter] = useState('All');
    const [selected, setSelected] = useState(null);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const handleExport = () => {
        const header = Object.keys(data[0] || {}).join(',');
        const rows = data.map(r => Object.values(r).join(','));
        const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Risk_Predictions_Export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    const filtered = useMemo(() => {
        let result = [...data];
        if (filter === 'Imaged') {
            result = result.filter(r => r.Image_Analysis != null);
        } else if (filter !== 'All') {
            result = result.filter(r => r.Risk_Level === filter);
        }
        if (search) result = result.filter(r => r.Container_ID?.toLowerCase().includes(search.toLowerCase()));
        result.sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            const dir = sortDir === 'asc' ? 1 : -1;
            return av > bv ? dir : av < bv ? -dir : 0;
        });
        return result;
    }, [data, filter, search, sortKey, sortDir]);

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease-out', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            {selected && <DetailPanel container={selected} onClose={() => setSelected(null)} />}

            <h2 style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#2C2418', marginBottom: 24, fontWeight: 700, letterSpacing: 1 }}>CONTAINER REGISTRY</h2>

            {/* ── TABLE HEADER CONTROLS ── */}
            <div style={{
                background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, overflow: 'hidden', flex: 1,
                display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(44,36,24,0.04)'
            }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #EDE7DB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#C06820', letterSpacing: 2, fontWeight: 700 }}>
                            FILTER & SEARCH
                        </span>
                        <span style={{ color: '#7A6E5D', fontFamily: 'Quicksand', fontSize: 12, background: '#F5F0E8', padding: '4px 8px', borderRadius: 4, border: '1px solid #EDE7DB', fontWeight: 600 }}>
                            {filtered.length.toLocaleString()} records matched
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} color="#7A6E5D" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID..."
                                style={{
                                    background: '#F5F0E8', border: '1px solid #D9CDBA', borderRadius: 6, padding: '8px 12px 8px 32px',
                                    color: '#2C2418', fontFamily: 'Quicksand', fontSize: 13, width: 220, outline: 'none', fontWeight: 500,
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#C06820'} onBlur={(e) => e.target.style.borderColor = '#D9CDBA'}
                            />
                        </div>
                        {['All', 'Critical', 'Medium Risk', 'Low Risk', 'Imaged'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                background: filter === f ? (f === 'Critical' ? '#C6282815' : f === 'Medium Risk' ? '#E6510015' : f === 'Low Risk' ? '#2E7D3215' : '#C0682010') : 'transparent',
                                border: `1px solid ${filter === f ? (f === 'Critical' ? '#C6282840' : f === 'Medium Risk' ? '#E6510040' : f === 'Low Risk' ? '#2E7D3240' : '#C0682030') : '#D9CDBA'}`,
                                borderRadius: 6, padding: '6px 12px', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 600,
                                color: filter === f ? (getRiskColor(f) || '#C06820') : '#7A6E5D', cursor: 'pointer',
                            }}>
                                {f}
                            </button>
                        ))}
                        <button onClick={handleExport} style={{
                            background: 'rgba(44,36,24,0.03)', border: '1px solid #D9CDBA', borderRadius: 6,
                            padding: '6px 12px', fontFamily: 'Quicksand', fontSize: 12, color: '#2C2418', fontWeight: 600,
                            cursor: 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8
                        }}>
                            <Download size={12} /> EXPORT
                        </button>
                    </div>
                </div>

                {/* ── TABLE ── */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #EDE7DB', background: '#F5F0E8' }}>
                                {[
                                    { key: 'Container_ID', label: 'CONTAINER ID' },
                                    { key: 'Risk_Score', label: 'RISK SCORE' },
                                    { key: 'Risk_Level', label: 'RISK LEVEL' },
                                    { key: 'Anomaly_Flag', label: 'ANOMALY' },
                                    { key: 'Declared_Weight', label: 'DECL. WT (KG)' },
                                    { key: 'Origin_Country', label: 'ORIGIN' },
                                    { key: null, label: 'ACTION' },
                                ].map((col, i) => (
                                    <th key={i} onClick={() => col.key && handleSort(col.key)} style={{
                                        padding: '16px', textAlign: 'left', fontFamily: 'Quicksand', fontSize: 11,
                                        color: '#7A6E5D', letterSpacing: 1.5, cursor: col.key ? 'pointer' : 'default',
                                        background: sortKey === col.key ? 'rgba(192,104,32,0.04)' : 'transparent',
                                        whiteSpace: 'nowrap', userSelect: 'none', fontWeight: 700,
                                    }}>
                                        {col.label} {sortKey === col.key && (sortDir === 'asc' ? '▲' : '▼')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, 300).map((row, idx) => (
                                <tr
                                    key={idx}
                                    style={{
                                        borderBottom: '1px solid #EDE7DB', cursor: 'pointer',
                                        background: row.Risk_Level === 'Critical' ? 'rgba(198,40,40,0.02)' : 'transparent',
                                        transition: 'all 0.15s',
                                    }}
                                    onClick={() => setSelected(row)}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.boxShadow = 'inset 4px 0 0 #C06820'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = row.Risk_Level === 'Critical' ? 'rgba(198,40,40,0.02)' : 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <td style={{ padding: '16px', fontFamily: 'Quicksand', fontSize: 14, fontWeight: 600, color: '#2C2418' }}>
                                        {row.Container_ID}
                                    </td>
                                    <td style={{ padding: '16px' }}><RiskBar score={row.Risk_Score} /></td>
                                    <td style={{ padding: '16px' }}><RiskBadge level={row.Risk_Level} /></td>
                                    <td style={{ padding: '16px' }}>
                                        {row.Anomaly_Flag ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C62828', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 600 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C62828', animation: 'pulse-dot 1.5s infinite', display: 'inline-block' }} /> MATCH
                                            </span>
                                        ) : <span style={{ color: '#7A6E5D', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 500 }}>— CLEAR</span>}
                                    </td>
                                    <td style={{ padding: '16px', fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', fontWeight: 500 }}>
                                        {Number(row.Declared_Weight).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px', fontFamily: 'Quicksand', fontSize: 13, color: '#7A6E5D', fontWeight: 500 }}>
                                        {row.Origin_Country || '—'}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <button style={{
                                            background: 'transparent', border: '1px solid #C0682040', borderRadius: 4,
                                            padding: '4px 12px', fontFamily: 'Quicksand', fontSize: 11, color: '#C06820',
                                            cursor: 'pointer', letterSpacing: 1, fontWeight: 700,
                                        }}>
                                            INSPECT
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div style={{ padding: 64, textAlign: 'center', color: '#7A6E5D', fontFamily: 'Quicksand', fontSize: 14, fontWeight: 500 }}>
                            NO CONTAINERS FOUND MATCHING YOUR CRITERIA
                        </div>
                    )}
                    {filtered.length > 300 && (
                        <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#A69882', fontFamily: 'Quicksand', borderTop: '1px solid #EDE7DB', fontWeight: 500 }}>
                            Showing top 300 of {filtered.length.toLocaleString()} matching records. Use narrower search.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
