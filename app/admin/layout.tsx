'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { ToastProvider } from '@/lib/toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const session = getSession();

  // Derive breadcrumb from path
  const parts = (pathname || '/admin').split('/').filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    label: p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    href: '/' + parts.slice(0, i + 1).join('/'),
  }));

  return (
    <ToastProvider>
      <div className="admin-shell">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <div className={`admin-content ${collapsed ? 'collapsed' : ''}`}>
          {/* Topbar */}
          <div className="admin-topbar">
            <nav style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {crumbs.map((crumb, i) => (
                <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>/</span>}
                  <span style={{
                    fontSize: '0.78rem',
                    color: i === crumbs.length - 1 ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: i === crumbs.length - 1 ? 600 : 400,
                    fontFamily: 'IBM Plex Mono, monospace',
                    letterSpacing: '0.02em',
                  }}>
                    {crumb.label}
                  </span>
                </span>
              ))}
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                <HelpCircle size={15} />
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                <Bell size={15} />
              </button>
              {session && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                    {(session.name || session.email || 'A')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>{session.name || session.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main */}
          <main className="admin-main">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
