'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { CSSProperties, ComponentType } from 'react';
import { clearSession, getSession } from '@/lib/auth/session';
import {
  LayoutDashboard, Plane, Globe2, Building2, DoorOpen,
  ParkingSquare, Waypoints, Luggage, ClipboardList,
  Users, Truck, AlertOctagon, Settings, ChevronLeft,
  ChevronRight, LogOut, ShieldCheck, Database, Cpu
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number | string; style?: CSSProperties }>;
  exact?: boolean;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const NAV: NavSection[] = [
  {
    section: 'OVERVIEW',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: 'REFERENCE DATA',
    items: [
      { href: '/admin/airlines',      label: 'Airlines',       icon: Plane },
      { href: '/admin/airports',      label: 'Airports',       icon: Globe2 },
      { href: '/admin/aircraft-types',label: 'Aircraft Types', icon: Cpu },
      { href: '/admin/countries',     label: 'Countries',      icon: Globe2 },
    ],
  },
  {
    section: 'INFRASTRUCTURE',
    items: [
      { href: '/admin/terminals',     label: 'Terminals',      icon: Building2 },
      { href: '/admin/gates',         label: 'Gates',          icon: DoorOpen },
      { href: '/admin/stands',        label: 'Stands',         icon: ParkingSquare },
      { href: '/admin/runways',       label: 'Runways',        icon: Waypoints },
      { href: '/admin/belts',         label: 'Baggage Belts',  icon: Luggage },
      { href: '/admin/checkin-desks', label: 'Check-in Desks', icon: ClipboardList },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { href: '/admin/ground-handlers', label: 'Ground Handlers', icon: Truck },
      { href: '/admin/delay-codes',     label: 'Delay Codes',     icon: AlertOctagon },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { href: '/admin/users',   label: 'Users',   icon: Users },
      { href: '/admin/tenants', label: 'Tenants', icon: ShieldCheck },
    ],
  },
];

export default function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = getSession();

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <nav className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '0 14px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--blue), var(--violet))', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em', color: 'var(--text-1)' }}>AODB Admin</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace' }}>Master Data</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--blue), var(--violet))', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
            <Database size={14} color="#fff" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <div className="nav-section-label">{section}</div>
            )}
            {collapsed && <div style={{ height: 8 }} />}
            {items.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`nav-item ${active ? 'active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : undefined }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 8px', flexShrink: 0 }}>
        {!collapsed && session && (
          <div style={{ padding: '6px 10px 8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.name || session.email}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'IBM Plex Mono, monospace' }}>
              {session.role || 'admin'}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className="nav-item"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', cursor: 'pointer', background: 'none' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
          }}
        >
          <LogOut size={14} />
          {!collapsed && 'Logout'}
        </button>
        {collapsed && (
          <button onClick={onToggle} className="nav-item" style={{ width: '100%', justifyContent: 'center', border: 'none', cursor: 'pointer', background: 'none', marginTop: 4 }}>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </nav>
  );
}
