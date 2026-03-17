'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Truck } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { GroundHandlerAPI, adminFetcher } from '@/lib/api/admin-client';
import type { GroundHandler, GroundHandlerCreate } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const EMPTY: GroundHandlerCreate = { tenant_id: '', name: '', iata_code: '', contact_json: {}, is_active: true };

export default function GroundHandlersPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GroundHandler | null>(null);
  const [form, setForm] = useState<GroundHandlerCreate>(EMPTY);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const { data = [], isLoading, error, mutate } = useSWR<GroundHandler[]>('/api/v1/admin/ground-handlers', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(h => h.name.toLowerCase().includes(q) || (h.iata_code || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter(h => h.is_active).length, color: 'var(--green)' },
    { label: 'Inactive', value: data.filter(h => !h.is_active).length, color: 'var(--text-3)' },
  ];

  const columns: Column<GroundHandler>[] = [
    { key: 'iata_code', label: 'IATA', width: '80px', render: r => r.iata_code ? <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{r.iata_code}</span> : '—' },
    { key: 'name', label: 'Handler Name' },
    {
      key: 'contact_json', label: 'Contact', width: '200px',
      render: r => {
        const c = r.contact_json as Record<string, string>;
        return <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{c?.email || c?.phone || '—'}</span>;
      },
    },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setContactEmail(''); setContactPhone(''); setModalOpen(true); }
  function openEdit(row: GroundHandler) {
    setEditing(row);
    const c = row.contact_json as Record<string, string>;
    setContactEmail(c?.email || '');
    setContactPhone(c?.phone || '');
    setForm({ tenant_id: row.tenant_id, name: row.name, iata_code: row.iata_code || '', contact_json: row.contact_json, is_active: row.is_active });
    setModalOpen(true);
  }

  async function handleDelete(row: GroundHandler) { await GroundHandlerAPI.delete(row.handler_id); mutate(); }
  async function handleToggle(row: GroundHandler) { await GroundHandlerAPI.update(row.handler_id, { is_active: !row.is_active }); mutate(); }
  async function handleSubmit() {
    const payload = { ...form, contact_json: { email: contactEmail, phone: contactPhone } };
    if (editing) await GroundHandlerAPI.update(editing.handler_id, payload);
    else await GroundHandlerAPI.create(payload);
    mutate();
  }
  const f = (k: keyof GroundHandlerCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Ground Handlers" subtitle="GHA companies providing ground services at the airport"
        icon={<Truck size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="handler_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as GroundHandler)} onDelete={r => handleDelete(r as unknown as GroundHandler)}
        onToggle={r => handleToggle(r as unknown as GroundHandler)} hasToggle activeKey="is_active"
        addLabel="Add Handler" stats={stats}
      />
      <FormModal title={editing ? 'Edit Ground Handler' : 'New Ground Handler'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={520}>
        <FormSection title="Identity">
          <FormRow cols={1}><FormGroup label="Handler Name" required><FormInput value={form.name} onChange={v => f('name', v)} placeholder="Swissport International" required /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="IATA Code" hint="3-letter GHA code"><FormInput value={form.iata_code || ''} onChange={v => f('iata_code', v)} placeholder="SW" /></FormGroup>
            <FormGroup label="Status"><div style={{ paddingTop: 6 }}><FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} /></div></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Contact Information">
          <FormRow>
            <FormGroup label="Email"><FormInput type="email" value={contactEmail} onChange={setContactEmail} placeholder="ops@handler.com" /></FormGroup>
            <FormGroup label="Phone"><FormInput type="tel" value={contactPhone} onChange={setContactPhone} placeholder="+1-555-0100" /></FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
