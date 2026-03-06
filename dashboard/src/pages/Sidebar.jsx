import React from 'react';
import { Anchor, LayoutDashboard, Database, List, Settings, LogOut, BarChart3 } from 'lucide-react';

export default function Sidebar({ currentView, setView, onLogout, userId }) {
    const menuItems = [
        { id: 'overview', label: 'OVERVIEW', icon: <LayoutDashboard size={18} /> },
        { id: 'containers', label: 'CONTAINERS', icon: <List size={18} /> },
        { id: 'analytics', label: 'ANALYTICS', icon: <BarChart3 size={18} /> },
        { id: 'upload', label: 'DATA UPLOAD', icon: <Database size={18} /> },
        { id: 'settings', label: 'SETTINGS', icon: <Settings size={18} /> },
    ];

    return (
        <div style={{
            width: 260,
            background: '#FFFDF8',
            borderRight: '1px solid #D9CDBA',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            {/* Brand */}
            <div style={{ padding: '24px 24px 32px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #EDE7DB' }}>
                <Anchor size={28} color="#C06820" strokeWidth={2.5} />
                <div>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 15, fontWeight: 700, color: '#2C2418', letterSpacing: 0.5 }}>Risk Engine</div>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#C06820', fontWeight: 600 }}>v4.0 — CUSTOMS</div>
                </div>
            </div>

            {/* User Info */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#7A6E5D', letterSpacing: 2, fontWeight: 700 }}>ACTIVE OFFICER</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F5F0E8', padding: '12px', borderRadius: 8, border: '1px solid #EDE7DB' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7D32', animation: 'glow-green 2s infinite' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Quicksand', fontSize: 13, fontWeight: 700, color: '#2C2418' }}>{userId || 'OFFICER_XYZ'}</div>
                        <div style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#7A6E5D', fontWeight: 500 }}>Clearance: LEVEL 4</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '0 16px', marginTop: 16 }}>
                <div style={{ fontFamily: 'Quicksand', fontSize: 11, color: '#7A6E5D', letterSpacing: 2, marginBottom: 16, paddingLeft: 8, fontWeight: 700 }}>NAVIGATION</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {menuItems.map(item => {
                        const isActive = currentView === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => setView(item.id)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                                        background: isActive ? 'rgba(192,104,32,0.08)' : 'transparent',
                                        border: `1px solid ${isActive ? 'rgba(192,104,32,0.2)' : 'transparent'}`,
                                        color: isActive ? '#C06820' : '#7A6E5D',
                                        fontFamily: 'Quicksand', fontSize: 13, letterSpacing: 1, fontWeight: isActive ? 700 : 500,
                                        textAlign: 'left', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = '#2C2418';
                                            e.currentTarget.style.background = 'rgba(44,36,24,0.03)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = '#7A6E5D';
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#C06820' }} />}
                                    {item.icon}
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div style={{ padding: '24px' }}>
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px', borderRadius: 8, cursor: 'pointer',
                        background: 'transparent', border: '1px solid #D9CDBA',
                        color: '#7A6E5D', fontFamily: 'Quicksand', fontSize: 12, letterSpacing: 1, fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#C62828';
                        e.currentTarget.style.borderColor = 'rgba(198,40,40,0.35)';
                        e.currentTarget.style.background = 'rgba(198,40,40,0.04)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#7A6E5D';
                        e.currentTarget.style.borderColor = '#D9CDBA';
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <LogOut size={16} /> END SESSION
                </button>
            </div>
        </div>
    );
}
