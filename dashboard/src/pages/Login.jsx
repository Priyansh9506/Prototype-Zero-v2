import React, { useState } from 'react';
import { Anchor, Lock, User, Terminal } from 'lucide-react';

export default function Login({ onLogin }) {
    const [userId, setUserId] = useState('');
    const [clearance, setClearance] = useState('');
    const [error, setError] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!userId || !clearance) {
            setError('OFFICER ID AND ACCESS CODE REQUIRED.');
            return;
        }

        setIsAuthenticating(true);

        setTimeout(() => {
            if (clearance.length >= 4) {
                onLogin(userId);
            } else {
                setError('INVALID ACCESS CODE. ENTRY DENIED.');
                setIsAuthenticating(false);
            }
        }, 1500);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'linear-gradient(160deg, #F5F0E8 0%, #E8DFD0 50%, #F0E8DA 100%)',
            position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(192,104,32,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(198,40,40,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />

            <div style={{
                background: 'rgba(255,253,248,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid #D9CDBA',
                borderRadius: 16,
                padding: '48px 40px',
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 8px 32px rgba(44,36,24,0.08)',
                zIndex: 10,
                animation: 'fadeInUp 0.6s ease-out both'
            }}>

                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'rgba(192,104,32,0.08)', border: '1px solid rgba(192,104,32,0.2)', marginBottom: 24 }}>
                        <Anchor size={36} color="#C06820" strokeWidth={2} />
                    </div>
                    <h1 style={{ fontFamily: 'Quicksand', fontSize: 26, fontWeight: 800, color: '#2C2418', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
                        SmartContainer
                    </h1>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#7A6E5D', letterSpacing: 4, fontWeight: 600 }}>
                        CUSTOMS RISK ENGINE
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontFamily: 'Quicksand', fontSize: 12, color: '#C06820', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>
                            OFFICER ID
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} color="#7A6E5D" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="e.g. CUSTOMS_748"
                                style={{
                                    width: '100%', background: '#F5F0E8', border: '1px solid #D9CDBA', borderRadius: 8,
                                    padding: '14px 16px 14px 44px', color: '#2C2418', fontFamily: 'Quicksand', fontSize: 15, fontWeight: 500,
                                    outline: 'none', transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#C06820'}
                                onBlur={(e) => e.target.style.borderColor = '#D9CDBA'}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontFamily: 'Quicksand', fontSize: 12, color: '#C06820', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>
                            SECURITY ACCESS CODE
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} color="#7A6E5D" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                value={clearance}
                                onChange={(e) => setClearance(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%', background: '#F5F0E8', border: '1px solid #D9CDBA', borderRadius: 8,
                                    padding: '14px 16px 14px 44px', color: '#2C2418', fontFamily: 'Quicksand', fontSize: 15, fontWeight: 500,
                                    outline: 'none', transition: 'border-color 0.2s', letterSpacing: 4
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#C06820'}
                                onBlur={(e) => e.target.style.borderColor = '#D9CDBA'}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                            background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)',
                            borderRadius: 8, color: '#C62828', fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600,
                            animation: 'fadeInUp 0.3s ease-out'
                        }}>
                            <Terminal size={14} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isAuthenticating}
                        style={{
                            marginTop: 12, width: '100%', background: isAuthenticating ? '#D9CDBA' : '#C06820',
                            border: 'none', borderRadius: 8, padding: '16px',
                            fontFamily: 'Quicksand', fontSize: 15, color: isAuthenticating ? '#7A6E5D' : '#FFFFFF',
                            fontWeight: 800, cursor: isAuthenticating ? 'not-allowed' : 'pointer', letterSpacing: 2,
                            transition: 'all 0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
                        }}
                    >
                        {isAuthenticating ? (
                            <>
                                <div style={{ width: 14, height: 14, border: '2px solid #7A6E5D', borderTopColor: 'transparent', borderRadius: '50%', animation: 'radarSpin 1s linear infinite' }} />
                                VERIFYING...
                            </>
                        ) : (
                            'BEGIN INSPECTION SESSION'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: 32, textAlign: 'center', fontFamily: 'Quicksand', fontSize: 11, color: '#A69882', fontWeight: 600 }}>
                    AUTHORISED CUSTOMS PERSONNEL ONLY. ALL ACCESS IS MONITORED AND LOGGED.
                </div>
            </div>
        </div>
    );
}
