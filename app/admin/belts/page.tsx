'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Luggage } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { BeltAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Belt, BeltCreate, BeltType } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const BELT_TYPES: BeltType[] = ['ARRIVALS', 'OVERSIZED', 'DEPARTURES', 'TRANSFER'];
const EMPTY: BeltCreate = { tenant_id: '', airport_id: '', terminal_id: '', code: '', belt_type: 'ARRIVALS', is_active: true, attributes: {} };

export default function BeltsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Belt | null>(null);
  const [form, setForm] = useState<BeltCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Belt[]>('/api/v1/admin/belts', adminFetcher);
  const { data: airports = [] } = useSWR<{ airport_id: string; name: string; iata_code?: string }[]>('/api/v1/admin/airports', adminFetcher);
  const { data: terminals = [] } = useSWR<{ terminal_id: string; code: string; airport_id: string }[]>('/api/v1/admin/terminals', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(b => b.code.toLowerCase().includes(q) || (b.terminal_code || '').toLowerCase().includes(q));
  }, [data, search]);

  const filteredTerminals = terminals.filter(t => !form.airport_id || t.airport_id === form.airport_id);

  const TYPE_COLOR: Record<BeltType, string> = { ARRIVALS: 'badge-green', OVERSIZED: 'badge-amber', DEPARTURES: 'badge-blue', TRANSFER: 'badge-violet' };

  const stats = [
    { label: 'Total Belts', value: data.length },
    { label: 'Active', value: data.filter(b => b.is_active).length, color: 'var(--green)' },
    { label: 'Arrivals', value: data.filter(b => b.belt_type === 'ARRIVALS').length, color: 'var(--green)' },
    { label: 'Departures', value: data.filter(b => b.belt_type === 'DEPARTURES').length, color: 'var(--blue)' },
  ];

  const columns: Column<Belt>[] = [
    { key: 'code', label: 'Belt', width: '80px', render: r => <span className="badge badge-blue">{r.code}</span> },
    { key: 'belt_type', label: 'Type', width: '110px', render: r => r.belt_type ? <span className={`badge ${TYPE_COLOR[r.belt_type]}`}>{r.belt_type}</span> : '—' },
    { key: 'terminal_code', label: 'Terminal', width: '90px', render: r => r.terminal_code ? <span className="badge badge-slate">{r.terminal_code}</span> : '—' },
    { key: 'max_weight_kg', label: 'Max Weight', width: '110px', render: r => r.max_weight_kg ? `${r.max_weight_kg}kg` : '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Belt) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, airport_id: row.airport_id, terminal_id: row.terminal_id || '', code: row.code, belt_type: row.belt_type, max_weight_kg: row.max_weight_kg, is_active: row.is_active, valid_from: row.valid_from || '', valid_to: row.valid_to || '', attributes: row.attributes });
    setModalOpen(true);
  }

  async function handleDelete(row: Belt) {
    try {
      await BeltAPI.delete(row.belt_id);
      toast.success('Belt Deleted', `Belt ${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete belt');
      throw e;
    }
  }

  async function handleToggle(row: Belt) {
    try {
      await BeltAPI.update(row.belt_id, { is_active: !row.is_active });
      toast.success('Status Updated', `Belt ${row.code} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await BeltAPI.update(editing.belt_id, form);
        toast.success('Belt Updated', `Belt ${form.code} has been updated`);
      } else {
        await BeltAPI.create(form);
        toast.success('Belt Created', `Belt ${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof BeltCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Baggage Belts" subtitle="Baggage reclaim and sortation belts — type and max weight capacity"
        icon={<Luggage size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="belt_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Belt)} onDelete={r => handleDelete(r as unknown as Belt)}
        onToggle={r => handleToggle(r as unknown as Belt)} hasToggle activeKey="is_active"
        addLabel="Add Belt" stats={stats}
      />
      <FormModal title={editing ? 'Edit Belt' : 'New Belt'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={520}>
        <FormSection title="Location">
          <FormRow cols={1}><FormGroup label="Airport" required><FormSelect value={form.airport_id} onChange={v => { f('airport_id', v); f('terminal_id', ''); }} options={airports.map(a => ({ value: a.airport_id, label: `${a.iata_code ? `[${a.iata_code.trim()}] ` : ''}${a.name}` }))} placeholder="Select airport…" /></FormGroup></FormRow>
          <FormRow cols={1}><FormGroup label="Terminal"><FormSelect value={form.terminal_id || ''} onChange={v => f('terminal_id', v)} options={filteredTerminals.map(t => ({ value: t.terminal_id, label: t.code }))} placeholder="Select terminal…" /></FormGroup></FormRow>
        </FormSection>
        <FormSection title="Belt Details">
          <FormRow>
            <FormGroup label="Belt Code" required><FormInput value={form.code} onChange={v => f('code', v)} placeholder="B1" required /></FormGroup>
            <FormGroup label="Belt Type"><FormSelect value={form.belt_type || ''} onChange={v => f('belt_type', v as BeltType)} options={BELT_TYPES.map(t => ({ value: t, label: t }))} placeholder="Select…" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Max Weight (kg)"><FormInput type="number" value={String(form.max_weight_kg || '')} onChange={v => f('max_weight_kg', Number(v))} placeholder="32" /></FormGroup>
            <FormGroup label="Status"><div style={{ paddingTop: 6 }}><FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} /></div></FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
