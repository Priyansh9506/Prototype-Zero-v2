'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Container, Upload, BarChart3, Shield, Activity, LogOut, UserCircle } from 'lucide-react';
import { clearToken, isAuthenticated } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't render sidebar on login page
  if (pathname === '/login') return null;

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/containers', label: 'Containers', icon: Container },
    { href: '/upload', label: 'Upload & Predict', icon: Upload },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={22} color="white" />
        </div>
        <div>
          <h1>SmartContainer</h1>
          <span>Risk Engine v3.0</span>
        </div>
      </div>

      <nav>
        <div className="nav-section">
          <p className="nav-section-title">Navigation</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="nav-section" style={{ marginTop: 'auto' }}>
          <p className="nav-section-title">System</p>
          <div className="nav-link" style={{ cursor: 'default' }}>
            <Activity size={18} />
            <span style={{ fontSize: 12 }}>API: <span style={{ color: 'var(--accent-emerald)' }}>● Connected</span></span>
          </div>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 14 }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
