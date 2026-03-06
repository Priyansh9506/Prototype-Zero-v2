import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getRiskColor } from '../data';
import { Package, AlertTriangle, ShieldCheck, Search, Boxes } from 'lucide-react';

function StatCard({ label, value, sub, icon, color }) {
    return (
        <div style={{
            flex: '1 0 150px', background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12,
            padding: '20px 24px', boxShadow: '0 1px 3px rgba(44,36,24,0.04)',
            transition: 'all 0.3s ease',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#7A6E5D', letterSpacing: 2, fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: 18 }}>{icon}</span>
            </div>
            <div style={{ fontFamily: 'Quicksand', fontSize: 32, fontWeight: 700, color: color || '#2C2418' }}>
                {value.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: '#7A6E5D', marginTop: 4, fontWeight: 500 }}>{sub}</div>
        </div>
    );
}

export default function Overview({ data }) {
    const stats = useMemo(() => {
        const critical = data.filter(d => d.Risk_Level === 'Critical').length;
        const medium = data.filter(d => d.Risk_Level === 'Medium Risk').length;
        const low = data.filter(d => d.Risk_Level === 'Low Risk').length;
        const anomalies = data.filter(d => d.Anomaly_Flag).length;
        return { total: data.length, critical, medium, low, anomalies };
    }, [data]);

    const pieData = [
        { name: 'Critical', value: stats.critical, color: '#C62828' },
        { name: 'Medium Risk', value: stats.medium, color: '#E65100' },
        { name: 'Low Risk', value: stats.low, color: '#2E7D32' },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            <h2 style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#2C2418', marginBottom: 24, fontWeight: 700, letterSpacing: 1 }}>INSPECTION OVERVIEW</h2>

            {/* ── STATS CARDS ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <StatCard label="TOTAL" value={stats.total} sub="containers scanned" icon={<Boxes size={20} color="#C06820" />} />
                <StatCard label="FLAGGED" value={stats.critical} sub={`⚠ ${stats.total ? (100 * stats.critical / stats.total).toFixed(1) : 0}%`} icon={<AlertTriangle size={20} color="#C62828" />} color="#C62828" />
                <StatCard label="CAUTION" value={stats.medium} sub={`⚡ ${stats.total ? (100 * stats.medium / stats.total).toFixed(1) : 0}%`} icon={<Package size={20} color="#E65100" />} color="#E65100" />
                <StatCard label="CLEARED" value={stats.low} sub={`✓ ${stats.total ? (100 * stats.low / stats.total).toFixed(1) : 0}%`} icon={<ShieldCheck size={20} color="#2E7D32" />} color="#2E7D32" />
                <StatCard label="ANOMALIES" value={stats.anomalies} sub={`🔍 ${stats.total ? (100 * stats.anomalies / stats.total).toFixed(1) : 0}%`} icon={<Search size={20} color="#7A6E5D" />} />
            </div>

            {/* ── CHARTS AREA ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Donut Chart */}
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#C06820', letterSpacing: 2, marginBottom: 16, fontWeight: 700 }}>RISK DISTRIBUTION</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <ResponsiveContainer width="50%" height={280}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" innerRadius={75} outerRadius={110} paddingAngle={3} strokeWidth={0} isAnimationActive={false}>
                                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 8, fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            {pieData.map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
                                    <span style={{ fontSize: 14, color: '#7A6E5D', flex: 1, fontWeight: 500 }}>{d.name}</span>
                                    <span style={{ fontFamily: 'Quicksand', fontSize: 17, color: '#2C2418', fontWeight: 700 }}>{d.value.toLocaleString()}</span>
                                    <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#7A6E5D', width: 40, textAlign: 'right' }}>
                                        {stats.total ? (100 * d.value / stats.total).toFixed(1) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Critical Alerts */}
                <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#C62828', letterSpacing: 2, marginBottom: 16, fontWeight: 700 }}>⚠ FLAGGED SHIPMENTS</div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {data.filter(d => d.Risk_Level === 'Critical').slice(0, 4).map((d, i) => (
                            <div key={i} style={{ padding: 12, background: 'rgba(198,40,40,0.04)', border: '1px solid rgba(198,40,40,0.15)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontFamily: 'Quicksand', fontSize: 14, fontWeight: 700, color: '#C62828' }}>{d.Container_ID}</div>
                                    <div style={{ fontSize: 13, color: '#7A6E5D', marginTop: 4, fontWeight: 500 }}>Weight Discrepancy Flag</div>
                                </div>
                                <div style={{ fontFamily: 'Quicksand', fontSize: 18, color: '#C62828', fontWeight: 700 }}>{d.Risk_Score.toFixed(3)}</div>
                            </div>
                        ))}
                        {data.filter(d => d.Risk_Level === 'Critical').length === 0 && (
                            <div style={{ color: '#7A6E5D', fontSize: 14, textAlign: 'center', marginTop: 40, fontFamily: 'Quicksand', fontWeight: 500 }}>
                                No flagged shipments in the current dataset.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
