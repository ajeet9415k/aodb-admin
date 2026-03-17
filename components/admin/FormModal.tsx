'use client';

import { ReactNode, useState } from 'react';
import { X, Save, Loader } from 'lucide-react';

export interface FormModalProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  children: ReactNode;
  submitLabel?: string;
  width?: number;
}

export default function FormModal({
  title, subtitle, open, onClose, onSubmit, children,
  submitLabel = 'Save', width = 600,
}: FormModalProps) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    setSaving(true);
    setErr(null);
    try {
      await onSubmit();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: width, width: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)', margin: 0, fontFamily: 'Syne, sans-serif' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {err && (
          <div style={{ background: 'rgba(244,63,94,0.08)', borderBottom: '1px solid rgba(244,63,94,0.2)', padding: '10px 20px', fontSize: '0.78rem', color: '#f87171', flexShrink: 0 }}>
            {err}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Loader size={13} className="spin" /> : <Save size={13} />}
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Field helpers for form layouts
// --------------------------------------------------------------------------

export function FormRow({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 16px', marginBottom: 14 }}>
      {children}
    </div>
  );
}

export function FormGroup({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function FormInput({
  value, onChange, placeholder, type = 'text', required, disabled,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
  required?: boolean; disabled?: boolean;
}) {
  return (
    <input
      className="field-input"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      style={{ width: '100%' }}
    />
  );
}

export function FormSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select className="field-input" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ width: '100%' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function FormCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-2)' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--blue)', cursor: 'pointer' }} />
      {label}
    </label>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
