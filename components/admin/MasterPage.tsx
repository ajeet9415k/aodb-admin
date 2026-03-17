'use client';

import { useState, useCallback, ReactNode } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => ReactNode;
}

export interface MasterPageProps<T extends object> {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  error?: string | null;
  idKey: keyof T;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onToggle?: (row: T) => void;
  hasToggle?: boolean;
  activeKey?: keyof T;
  addLabel?: string;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
  // pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function MasterPage<T extends object>({
  title, subtitle, icon, columns, data, loading, error,
  idKey, searchValue, onSearchChange, onRefresh, onAdd, onEdit, onDelete, onToggle,
  hasToggle, activeKey, addLabel = 'Add New',
  stats, page = 1, totalPages = 1, onPageChange,
}: MasterPageProps<T>) {

  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  function confirmDelete(row: T) { setDeleteTarget(row); }
  function cancelDelete() { setDeleteTarget(null); }
  function doDelete() {
    if (deleteTarget) { onDelete(deleteTarget); setDeleteTarget(null); }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon && (
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--text-1)', margin: 0 }}>{title}</h1>
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
        </div>
        <button className="btn-primary" onClick={onAdd} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />
          {addLabel}
        </button>
      </div>

      {/* Stats Row */}
      {stats && stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-mini">
              <div className="stat-mini-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-mini-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="field-input"
            style={{ paddingLeft: 30, width: '100%' }}
            placeholder="Search…"
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <button className="btn-ghost" onClick={onRefresh} title="Refresh" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span style={{ fontSize: '0.78rem' }}>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} style={{ width: col.width }}>{col.label}</th>
              ))}
              <th style={{ width: hasToggle ? 110 : 80, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} className="spin" /> Loading…
                </div>
              </td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                No records found
              </td></tr>
            )}
            {!loading && data.map((row, i) => (
              <tr key={String(row[idKey])} style={{ animationDelay: `${i * 20}ms` }}>
                {columns.map(col => (
                  <td key={String(col.key)}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—')}
                  </td>
                ))}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {hasToggle && activeKey && onToggle && (
                      <button
                        className="action-btn"
                        title={row[activeKey] ? 'Deactivate' : 'Activate'}
                        onClick={() => onToggle(row)}
                        style={{ color: row[activeKey] ? 'var(--green)' : 'var(--text-3)' }}
                      >
                        {row[activeKey] ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                    )}
                    <button className="action-btn" title="Edit" onClick={() => onEdit(row)}>
                      <Pencil size={13} />
                    </button>
                    <button className="action-btn action-btn-danger" title="Delete" onClick={() => confirmDelete(row)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn-ghost" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} style={{ padding: '6px 10px' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>Page {page} of {totalPages}</span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)} style={{ padding: '6px 10px' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={20} color="var(--red)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Delete Record</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 24 }}>
                This action cannot be undone. Are you sure you want to delete this record?
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-ghost" onClick={cancelDelete}>Cancel</button>
                <button className="btn-danger" onClick={doDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
