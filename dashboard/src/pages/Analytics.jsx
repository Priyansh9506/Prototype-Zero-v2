import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    ScatterChart, Scatter, Cell, PieChart, Pie, Legend,
    AreaChart, Area
} from 'recharts';
import { getRiskColor } from '../data';
import { TrendingUp, Globe, Weight, Clock, BarChart3, Target, Moon, DollarSign, Package, Sun, X, AlertTriangle, MapPin, Ship } from 'lucide-react';

const CARD = {
    background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12,
    padding: 24, boxShadow: '0 1px 3px rgba(44,36,24,0.04)'
};
const LABEL = {
    fontFamily: 'Quicksand', fontSize: 12, color: '#C06820',
    letterSpacing: 2, marginBottom: 16, fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: 8
};
const TT = {
    background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 8,
    fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418'
};

export default function Analytics({ data }) {
    const [selectedHour, setSelectedHour] = useState(null);

    // containers for the selected hour
    const selectedContainers = useMemo(() => {
        if (selectedHour === null) return [];
        return data.filter(d => {
            const h = parseInt((d.Declaration_Time || '12:00').split(':')[0]);
            return h === selectedHour;
        });
    }, [data, selectedHour]);

    // ── Risk score histogram (buckets of 0.1) ──
    const histogram = useMemo(() => {
        const buckets = Array.from({ length: 10 }, (_, i) => ({
            range: `${(i * 0.1).toFixed(1)}–${((i + 1) * 0.1).toFixed(1)}`,
            count: 0, low: i * 0.1
        }));
        data.forEach(d => {
            const idx = Math.min(Math.floor(d.Risk_Score * 10), 9);
            buckets[idx].count++;
        });
        return buckets;
    }, [data]);

    // ── Top origin countries ──
    const origins = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const c = d.Origin_Country || 'Unknown';
            map[c] = (map[c] || 0) + 1;
        });
        return Object.entries(map)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [data]);

    // ── Weight discrepancy scatter ──
    const weightData = useMemo(() => {
        return data.map(d => {
            const decl = Number(d.Declared_Weight) || 1;
            const meas = Number(d.Measured_Weight) || 0;
            const discrepancy = ((meas - decl) / decl * 100);
            return {
                id: d.Container_ID,
                riskScore: d.Risk_Score,
                discrepancy: parseFloat(discrepancy.toFixed(1)),
                level: d.Risk_Level
            };
        });
    }, [data]);

    // ── Dwell time distribution ──
    const dwellData = useMemo(() => {
        const buckets = [
            { range: '0–24h', count: 0 },
            { range: '24–48h', count: 0 },
            { range: '48–72h', count: 0 },
            { range: '72–120h', count: 0 },
            { range: '120h+', count: 0 },
        ];
        data.forEach(d => {
            const h = d.Dwell_Time_Hours || 0;
            if (h <= 24) buckets[0].count++;
            else if (h <= 48) buckets[1].count++;
            else if (h <= 72) buckets[2].count++;
            else if (h <= 120) buckets[3].count++;
            else buckets[4].count++;
        });
        return buckets;
    }, [data]);

    // ── Risk by trade regime ──
    const regimeData = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const r = d.Trade_Regime || 'Unknown';
            if (!map[r]) map[r] = { regime: r, total: 0, critical: 0, medium: 0, low: 0 };
            map[r].total++;
            if (d.Risk_Level === 'Critical') map[r].critical++;
            else if (d.Risk_Level === 'Medium Risk') map[r].medium++;
            else map[r].low++;
        });
        return Object.values(map);
    }, [data]);

    // ── NEW: Off-Hours Declaration Analysis (#1) ──
    const offHoursData = useMemo(() => {
        let offHours = 0, businessHours = 0;
        let offCritical = 0, busCritical = 0;
        data.forEach(d => {
            const h = parseInt((d.Declaration_Time || '12:00').split(':')[0]);
            if (h < 6 || h > 20) {
                offHours++;
                if (d.Risk_Level === 'Critical') offCritical++;
            } else {
                businessHours++;
                if (d.Risk_Level === 'Critical') busCritical++;
            }
        });
        return {
            pie: [
                { name: 'Off-Hours (10PM–6AM)', value: offHours, color: '#C62828' },
                { name: 'Business Hours (6AM–10PM)', value: businessHours, color: '#2E7D32' },
            ],
            offHours, businessHours, offCritical, busCritical,
            offCritPct: offHours ? (offCritical / offHours * 100).toFixed(1) : 0,
            busCritPct: businessHours ? (busCritical / businessHours * 100).toFixed(1) : 0,
        };
    }, [data]);

    // ── NEW: Value per Kg Analysis (#4) ──
    const vpkData = useMemo(() => {
        const buckets = [
            { range: '$0/kg', count: 0, avgRisk: 0, total: 0, label: 'Zero Value' },
            { range: '<$10', count: 0, avgRisk: 0, total: 0, label: 'Very Low' },
            { range: '$10–100', count: 0, avgRisk: 0, total: 0, label: 'Low' },
            { range: '$100–500', count: 0, avgRisk: 0, total: 0, label: 'Medium' },
            { range: '$500–2K', count: 0, avgRisk: 0, total: 0, label: 'High' },
            { range: '>$2K', count: 0, avgRisk: 0, total: 0, label: 'Very High' },
        ];
        data.forEach(d => {
            const wt = Number(d.Declared_Weight) || 1;
            const vpk = (Number(d.Declared_Value) || 0) / wt;
            const risk = d.Risk_Score;
            let idx;
            if (vpk === 0) idx = 0;
            else if (vpk < 10) idx = 1;
            else if (vpk < 100) idx = 2;
            else if (vpk < 500) idx = 3;
            else if (vpk < 2000) idx = 4;
            else idx = 5;
            buckets[idx].count++;
            buckets[idx].total += risk;
        });
        buckets.forEach(b => { b.avgRisk = b.count ? parseFloat((b.total / b.count).toFixed(3)) : 0; });
        return buckets;
    }, [data]);

    // ── NEW: HS Code Hotspots (#5) ──
    const hsData = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const hs = String(d.HS_Code || 'Unknown');
            const prefix = hs.length >= 4 ? hs.slice(0, 4) : hs;
            if (!map[prefix]) map[prefix] = { hsCode: prefix, total: 0, sumRisk: 0, critical: 0 };
            map[prefix].total++;
            map[prefix].sumRisk += d.Risk_Score;
            if (d.Risk_Level === 'Critical') map[prefix].critical++;
        });
        return Object.values(map)
            .map(h => ({ ...h, avgRisk: parseFloat((h.sumRisk / h.total).toFixed(3)) }))
            .sort((a, b) => b.avgRisk - a.avgRisk)
            .slice(0, 10);
    }, [data]);

    // ── NEW: Declaration Time Heatmap (#9) ──
    const timeHeatmap = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${String(i).padStart(2, '0')}:00`,
            total: 0,
            critical: 0,
            avgRisk: 0,
            sumRisk: 0,
            isOffHours: i < 6 || i > 20,
        }));
        data.forEach(d => {
            const h = parseInt((d.Declaration_Time || '12:00').split(':')[0]);
            if (h >= 0 && h < 24) {
                hours[h].total++;
                hours[h].sumRisk += d.Risk_Score;
                if (d.Risk_Level === 'Critical') hours[h].critical++;
            }
        });
        hours.forEach(h => { h.avgRisk = h.total ? parseFloat((h.sumRisk / h.total).toFixed(3)) : 0; });
        return hours;
    }, [data]);

    // ── KPI stats ──
    const kpis = useMemo(() => {
        const avgScore = data.length ? (data.reduce((s, d) => s + d.Risk_Score, 0) / data.length) : 0;
        const avgDwell = data.length ? (data.reduce((s, d) => s + (d.Dwell_Time_Hours || 0), 0) / data.length) : 0;
        const anomalyRate = data.length ? (data.filter(d => d.Anomaly_Flag).length / data.length * 100) : 0;
        const avgDisc = data.length ? (data.reduce((s, d) => {
            const decl = Number(d.Declared_Weight) || 1;
            const meas = Number(d.Measured_Weight) || 0;
            return s + Math.abs((meas - decl) / decl * 100);
        }, 0) / data.length) : 0;
        const uniqueOrigins = new Set(data.map(d => d.Origin_Country)).size;
        const criticalPct = data.length ? (data.filter(d => d.Risk_Level === 'Critical').length / data.length * 100) : 0;
        return { avgScore, avgDwell, anomalyRate, avgDisc, uniqueOrigins, criticalPct };
    }, [data]);

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            <h2 style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#2C2418', marginBottom: 24, fontWeight: 700, letterSpacing: 1 }}>
                RISK ANALYTICS
            </h2>

            {/* ══ KPI CARDS ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'AVG RISK', value: kpis.avgScore.toFixed(3), color: kpis.avgScore >= 0.5 ? '#C62828' : '#C06820', icon: <Target size={16} /> },
                    { label: 'CRITICAL %', value: `${kpis.criticalPct.toFixed(1)}%`, color: '#C62828', icon: <TrendingUp size={16} /> },
                    { label: 'ANOMALY RATE', value: `${kpis.anomalyRate.toFixed(1)}%`, color: '#E65100', icon: <BarChart3 size={16} /> },
                    { label: 'AVG WT DELTA', value: `${kpis.avgDisc.toFixed(1)}%`, color: '#C06820', icon: <Weight size={16} /> },
                    { label: 'AVG DWELL', value: `${kpis.avgDwell.toFixed(0)}h`, color: '#7A6E5D', icon: <Clock size={16} /> },
                    { label: 'ORIGINS', value: kpis.uniqueOrigins, color: '#2E7D32', icon: <Globe size={16} /> },
                ].map((k, i) => (
                    <div key={i} style={{ ...CARD, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7A6E5D', marginBottom: 4 }}>
                            {React.cloneElement(k.icon, { color: k.color })}
                            <span style={{ fontFamily: 'Quicksand', fontSize: 10, letterSpacing: 1.5, fontWeight: 700 }}>{k.label}</span>
                        </div>
                        <div style={{ fontFamily: 'Quicksand', fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* ══ ROW 1: Histogram + Origins ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={CARD}>
                    <div style={LABEL}><BarChart3 size={16} color="#C06820" /> RISK SCORE DISTRIBUTION</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={histogram} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} allowDecimals={false} />
                            <Tooltip contentStyle={TT} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {histogram.map((b, i) => (
                                    <Cell key={i} fill={b.low >= 0.5 ? '#C62828' : b.low >= 0.25 ? '#E65100' : '#2E7D32'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={CARD}>
                    <div style={LABEL}><Globe size={16} color="#C06820" /> TOP ORIGIN COUNTRIES</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={origins} layout="vertical" barSize={18}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} allowDecimals={false} />
                            <YAxis dataKey="country" type="category" tick={{ fontSize: 12, fill: '#2C2418', fontFamily: 'Quicksand', fontWeight: 600 }} width={50} />
                            <Tooltip contentStyle={TT} />
                            <Bar dataKey="count" fill="#C06820" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ══ ROW 2: Weight Scatter + Dwell Time ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={CARD}>
                    <div style={LABEL}><Weight size={16} color="#C06820" /> WEIGHT DISCREPANCY vs RISK SCORE</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" />
                            <XAxis dataKey="discrepancy" name="Wt Δ%" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }}
                                label={{ value: 'Weight Δ%', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' } }} />
                            <YAxis dataKey="riskScore" name="Risk" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }}
                                label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' } }} />
                            <Tooltip contentStyle={TT} formatter={(v, name) => [typeof v === 'number' ? v.toFixed(3) : v, name]} />
                            <Scatter data={weightData}>
                                {weightData.map((d, i) => (
                                    <Cell key={i} fill={getRiskColor(d.level)} opacity={0.7} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                <div style={CARD}>
                    <div style={LABEL}><Clock size={16} color="#C06820" /> DWELL TIME DISTRIBUTION</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={dwellData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} allowDecimals={false} />
                            <Tooltip contentStyle={TT} />
                            <defs>
                                <linearGradient id="dwellGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#C06820" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#C06820" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="count" stroke="#C06820" strokeWidth={2} fill="url(#dwellGrad)" dot={{ fill: '#C06820', r: 4 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ══ ROW 3: Off-Hours Analysis + Value/Kg ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* #1 — Off-Hours Declarations */}
                <div style={CARD}>
                    <div style={LABEL}><Moon size={16} color="#C06820" /> OFF-HOURS DECLARATION ANALYSIS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <ResponsiveContainer width="45%" height={220}>
                            <PieChart>
                                <Pie data={offHoursData.pie} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0} isAnimationActive={false}>
                                    {offHoursData.pie.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip contentStyle={TT} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <Moon size={14} color="#C62828" />
                                    <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#7A6E5D', fontWeight: 600 }}>Off-Hours (10PM–6AM)</span>
                                </div>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 22, fontWeight: 700, color: '#C62828' }}>{offHoursData.offHours} containers</div>
                                <div style={{ fontSize: 12, color: '#7A6E5D', marginTop: 2, fontWeight: 500 }}>
                                    {offHoursData.offCritPct}% flagged critical
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <Sun size={14} color="#2E7D32" />
                                    <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#7A6E5D', fontWeight: 600 }}>Business Hours</span>
                                </div>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 22, fontWeight: 700, color: '#2E7D32' }}>{offHoursData.businessHours} containers</div>
                                <div style={{ fontSize: 12, color: '#7A6E5D', marginTop: 2, fontWeight: 500 }}>
                                    {offHoursData.busCritPct}% flagged critical
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(198,40,40,0.04)', border: '1px solid rgba(198,40,40,0.12)', borderRadius: 8, fontSize: 12, color: '#7A6E5D', fontWeight: 500, lineHeight: 1.5 }}>
                        ⚠ Off-hours declarations are a key risk signal. The AI model assigns +0.08 risk weight to containers declared between 10PM and 6AM.
                    </div>
                </div>

                {/* #4 — Value per Kg Analysis */}
                <div style={CARD}>
                    <div style={LABEL}><DollarSign size={16} color="#C06820" /> VALUE PER KG — RISK CORRELATION</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={vpkData} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} allowDecimals={false}
                                label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#7A6E5D' } }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#C62828', fontFamily: 'Quicksand' }}
                                domain={[0, 1]}
                                label={{ value: 'Avg Risk', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#C62828' } }} />
                            <Tooltip contentStyle={TT} />
                            <Bar yAxisId="left" dataKey="count" fill="#C06820" radius={[4, 4, 0, 0]} opacity={0.6} name="Containers" />
                            <Bar yAxisId="right" dataKey="avgRisk" fill="#C62828" radius={[4, 4, 0, 0]} name="Avg Risk Score" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(192,104,32,0.04)', border: '1px solid rgba(192,104,32,0.12)', borderRadius: 8, fontSize: 12, color: '#7A6E5D', fontWeight: 500, lineHeight: 1.5 }}>
                        💰 Zero-value declarations (+0.20 risk) and ultra-high value/kg (&gt;$5000, +0.15 risk) are strong smuggling indicators used by the AI model.
                    </div>
                </div>
            </div>

            {/* ══ ROW 4: HS Code Hotspots + Declaration Time Heatmap ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* #5 — HS Code Hotspots */}
                <div style={CARD}>
                    <div style={LABEL}><Package size={16} color="#C06820" /> HS CODE RISK HOTSPOTS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {hsData.map((h, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                                background: i === 0 ? 'rgba(198,40,40,0.04)' : 'transparent',
                                borderRadius: 6, border: i === 0 ? '1px solid rgba(198,40,40,0.12)' : '1px solid transparent',
                            }}>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 13, fontWeight: 700, color: '#2C2418', minWidth: 50 }}>
                                    {h.hsCode}
                                </div>
                                <div style={{ flex: 1, height: 8, background: '#EDE7DB', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${Math.min(h.avgRisk * 100, 100)}%`,
                                        background: h.avgRisk >= 0.5 ? '#C62828' : h.avgRisk >= 0.25 ? '#E65100' : '#2E7D32',
                                        borderRadius: 4, transition: 'width 0.6s'
                                    }} />
                                </div>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, minWidth: 45, textAlign: 'right', color: h.avgRisk >= 0.5 ? '#C62828' : h.avgRisk >= 0.25 ? '#E65100' : '#2E7D32' }}>
                                    {h.avgRisk.toFixed(3)}
                                </div>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#7A6E5D', minWidth: 20, textAlign: 'right', fontWeight: 500 }}>
                                    ×{h.total}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(192,104,32,0.04)', border: '1px solid rgba(192,104,32,0.12)', borderRadius: 8, fontSize: 12, color: '#7A6E5D', fontWeight: 500, lineHeight: 1.5 }}>
                        📦 HS codes are standardised commodity classifications. Codes like 7113 (jewelry) and 8471 (electronics) historically carry higher smuggling risk.
                    </div>
                </div>

                {/* #9 — Declaration Time Heatmap (interactive) */}
                <div style={CARD}>
                    <div style={LABEL}><Clock size={16} color="#C06820" /> DECLARATION TIME — 24-HOUR RISK MAP <span style={{ fontSize: 10, color: '#7A6E5D', fontWeight: 500, letterSpacing: 0.5 }}>(click any hour)</span></div>
                    {/* Hours 0–11 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, marginBottom: 4 }}>
                        {timeHeatmap.slice(0, 12).map((h, i) => {
                            const intensity = h.total === 0 ? 0 : h.avgRisk;
                            const bg = h.total === 0
                                ? '#F5F0E8'
                                : intensity >= 0.5
                                    ? `rgba(198,40,40,${0.15 + intensity * 0.5})`
                                    : intensity >= 0.25
                                        ? `rgba(230,81,0,${0.1 + intensity * 0.4})`
                                        : `rgba(46,125,50,${0.08 + intensity * 0.3})`;
                            const isSelected = selectedHour === h.hour;
                            return (
                                <div key={i} onClick={() => h.total > 0 ? setSelectedHour(isSelected ? null : h.hour) : null} style={{
                                    position: 'relative', borderRadius: 6,
                                    background: bg,
                                    border: isSelected ? '2px solid #C06820' : h.isOffHours ? '1px solid rgba(198,40,40,0.25)' : '1px solid #EDE7DB',
                                    padding: '8px 4px', textAlign: 'center',
                                    cursor: h.total > 0 ? 'pointer' : 'default',
                                    minHeight: 72,
                                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 2px 8px rgba(192,104,32,0.25)' : 'none',
                                }}>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 10, fontWeight: 700, color: h.isOffHours ? '#C62828' : '#7A6E5D', marginBottom: 4 }}>
                                        {h.label}
                                    </div>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 16, fontWeight: 700, color: '#2C2418' }}>
                                        {h.total}
                                    </div>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 9, color: '#7A6E5D', marginTop: 2, fontWeight: 600 }}>
                                        {h.total > 0 ? `r:${h.avgRisk.toFixed(2)}` : '—'}
                                    </div>
                                    {h.isOffHours && h.total > 0 && (
                                        <div style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, borderRadius: '50%', background: '#C62828' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Hours 12–23 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, marginBottom: 12 }}>
                        {timeHeatmap.slice(12).map((h, i) => {
                            const intensity = h.total === 0 ? 0 : h.avgRisk;
                            const bg = h.total === 0
                                ? '#F5F0E8'
                                : intensity >= 0.5
                                    ? `rgba(198,40,40,${0.15 + intensity * 0.5})`
                                    : intensity >= 0.25
                                        ? `rgba(230,81,0,${0.1 + intensity * 0.4})`
                                        : `rgba(46,125,50,${0.08 + intensity * 0.3})`;
                            const isSelected = selectedHour === h.hour;
                            return (
                                <div key={i} onClick={() => h.total > 0 ? setSelectedHour(isSelected ? null : h.hour) : null} style={{
                                    position: 'relative', borderRadius: 6,
                                    background: bg,
                                    border: isSelected ? '2px solid #C06820' : h.isOffHours ? '1px solid rgba(198,40,40,0.25)' : '1px solid #EDE7DB',
                                    padding: '8px 4px', textAlign: 'center',
                                    cursor: h.total > 0 ? 'pointer' : 'default',
                                    minHeight: 72,
                                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 2px 8px rgba(192,104,32,0.25)' : 'none',
                                }}>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 10, fontWeight: 700, color: h.isOffHours ? '#C62828' : '#7A6E5D', marginBottom: 4 }}>
                                        {h.label}
                                    </div>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 16, fontWeight: 700, color: '#2C2418' }}>
                                        {h.total}
                                    </div>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 9, color: '#7A6E5D', marginTop: 2, fontWeight: 600 }}>
                                        {h.total > 0 ? `r:${h.avgRisk.toFixed(2)}` : '—'}
                                    </div>
                                    {h.isOffHours && h.total > 0 && (
                                        <div style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, borderRadius: '50%', background: '#C62828' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#7A6E5D', fontWeight: 500, marginBottom: selectedHour !== null ? 16 : 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(46,125,50,0.25)' }} /> Low Risk</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(230,81,0,0.3)' }} /> Medium Risk</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(198,40,40,0.5)' }} /> Critical Risk</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C62828' }} /> Off-Hours</span>
                    </div>

                    {/* ── Container detail panel (appears on click) ── */}
                    {selectedHour !== null && selectedContainers.length > 0 && (
                        <div style={{ animation: 'fadeInUp 0.25s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 13, fontWeight: 700, color: '#C06820' }}>
                                    <Ship size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                                    {selectedContainers.length} CONTAINER{selectedContainers.length > 1 ? 'S' : ''} DECLARED AT {String(selectedHour).padStart(2, '0')}:00
                                </div>
                                <div onClick={() => setSelectedHour(null)} style={{ cursor: 'pointer', padding: 4, borderRadius: 4, background: '#EDE7DB', display: 'flex' }}>
                                    <X size={14} color="#7A6E5D" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedContainers.map((c, ci) => {
                                    const decl = Number(c.Declared_Weight) || 1;
                                    const meas = Number(c.Measured_Weight) || 0;
                                    const wtDelta = ((meas - decl) / decl * 100).toFixed(1);
                                    const vpk = decl > 0 ? ((Number(c.Declared_Value) || 0) / decl).toFixed(2) : '0';
                                    const riskColor = getRiskColor(c.Risk_Level);
                                    return (
                                        <div key={ci} style={{
                                            background: '#FFFDF8', border: `1px solid ${riskColor}22`,
                                            borderLeft: `4px solid ${riskColor}`,
                                            borderRadius: 8, padding: '12px 16px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontFamily: 'Quicksand', fontSize: 14, fontWeight: 700, color: '#2C2418' }}>{c.Container_ID}</span>
                                                    <span style={{
                                                        fontFamily: 'Quicksand', fontSize: 10, fontWeight: 700,
                                                        padding: '2px 8px', borderRadius: 4,
                                                        background: `${riskColor}15`, color: riskColor,
                                                        letterSpacing: 1
                                                    }}>
                                                        {c.Risk_Level === 'Critical' && <AlertTriangle size={10} style={{ marginRight: 3, verticalAlign: -1 }} />}
                                                        {c.Risk_Level.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span style={{ fontFamily: 'Quicksand', fontSize: 18, fontWeight: 700, color: riskColor }}>{c.Risk_Score.toFixed(3)}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                                {[
                                                    { label: 'ROUTE', value: `${c.Origin_Country} → ${c.Destination_Country}`, icon: <MapPin size={11} /> },
                                                    { label: 'WT DELTA', value: `${wtDelta}%`, icon: <Weight size={11} /> },
                                                    { label: 'VALUE/KG', value: `$${vpk}`, icon: <DollarSign size={11} /> },
                                                    { label: 'DWELL', value: `${c.Dwell_Time_Hours}h`, icon: <Clock size={11} /> },
                                                    { label: 'HS CODE', value: c.HS_Code, icon: <Package size={11} /> },
                                                ].map((f, fi) => (
                                                    <div key={fi}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                                                            {React.cloneElement(f.icon, { color: '#7A6E5D' })}
                                                            <span style={{ fontFamily: 'Quicksand', fontSize: 9, color: '#7A6E5D', letterSpacing: 1, fontWeight: 700 }}>{f.label}</span>
                                                        </div>
                                                        <div style={{ fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: '#2C2418' }}>{f.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ ROW 5: Trade Regime ══ */}
            <div style={CARD}>
                <div style={LABEL}><TrendingUp size={16} color="#C06820" /> RISK BREAKDOWN BY TRADE REGIME</div>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={regimeData} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" />
                        <XAxis dataKey="regime" tick={{ fontSize: 12, fill: '#2C2418', fontFamily: 'Quicksand', fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11, fill: '#7A6E5D', fontFamily: 'Quicksand' }} allowDecimals={false} />
                        <Tooltip contentStyle={TT} />
                        <Legend wrapperStyle={{ fontFamily: 'Quicksand', fontSize: 12, fontWeight: 600 }} />
                        <Bar dataKey="critical" name="Critical" stackId="a" fill="#C62828" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#E65100" />
                        <Bar dataKey="low" name="Low Risk" stackId="a" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
