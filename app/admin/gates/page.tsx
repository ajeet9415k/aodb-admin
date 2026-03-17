'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { DoorOpen } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { GateAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Gate, GateCreate, GateType } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const GATE_TYPES: GateType[] = ['PASSENGER', 'CARGO', 'VIP', 'CIP'];
const EMPTY: GateCreate = { tenant_id: '', airport_id: '', terminal_id: '', code: '', gate_type: 'PASSENGER', is_common_use: false, is_active: true, attributes: {} };

export default function GatesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [form, setForm] = useState<GateCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Gate[]>('/api/v1/admin/gates', adminFetcher);
  const { data: airports = [] } = useSWR<{ airport_id: string; name: string; iata_code?: string }[]>('/api/v1/admin/airports', adminFetcher);
  const { data: terminals = [] } = useSWR<{ terminal_id: string; code: string; airport_id: string }[]>('/api/v1/admin/terminals', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(g => g.code.toLowerCase().includes(q) || (g.terminal_code || '').toLowerCase().includes(q));
  }, [data, search]);

  const filteredTerminals = terminals.filter(t => !form.airport_id || t.airport_id === form.airport_id);

  const stats = [
    { label: 'Total Gates', value: data.length },
    { label: 'Active', value: data.filter(g => g.is_active).length, color: 'var(--green)' },
    { label: 'Common Use', value: data.filter(g => g.is_common_use).length, color: 'var(--cyan)' },
    { label: 'Passenger', value: data.filter(g => g.gate_type === 'PASSENGER').length, color: 'var(--blue)' },
  ];

  const columns: Column<Gate>[] = [
    { key: 'code', label: 'Gate', width: '80px', render: r => <span className="badge badge-blue">{r.code}</span> },
    { key: 'terminal_code', label: 'Terminal', width: '90px', render: r => r.terminal_code ? <span className="badge badge-slate">{r.terminal_code}</span> : '—' },
    { key: 'gate_type', label: 'Type', width: '110px', render: r => r.gate_type ? <span className="badge badge-violet">{r.gate_type}</span> : '—' },
    { key: 'is_common_use', label: 'Common Use', width: '100px', render: r => r.is_common_use ? <span className="badge badge-cyan">CUTE</span> : '—' },
    { key: 'pax_capacity', label: 'Capacity', width: '90px', render: r => r.pax_capacity ? String(r.pax_capacity) : '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Gate) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, airport_id: row.airport_id, terminal_id: row.terminal_id || '', code: row.code, gate_type: row.gate_type, is_common_use: row.is_common_use, pax_capacity: row.pax_capacity, is_active: row.is_active, valid_from: row.valid_from || '', valid_to: row.valid_to || '', attributes: row.attributes });
    setModalOpen(true);
  }

  async function handleDelete(row: Gate) {
    try {
      await GateAPI.delete(row.gate_id);
      toast.success('Gate Deleted', `Gate ${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete gate');
      throw e;
    }
  }

  async function handleToggle(row: Gate) {
    try {
      await GateAPI.update(row.gate_id, { is_active: !row.is_active });
      toast.success('Status Updated', `Gate ${row.code} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await GateAPI.update(editing.gate_id, form);
        toast.success('Gate Updated', `Gate ${form.code} has been updated`);
      } else {
        await GateAPI.create(form);
        toast.success('Gate Created', `Gate ${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof GateCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Gates" subtitle="Boarding gates — type, common-use and passenger capacity"
        icon={<DoorOpen size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="gate_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Gate)} onDelete={r => handleDelete(r as unknown as Gate)}
        onToggle={r => handleToggle(r as unknown as Gate)} hasToggle activeKey="is_active"
        addLabel="Add Gate" stats={stats}
      />
      <FormModal title={editing ? 'Edit Gate' : 'New Gate'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={560}>
        <FormSection title="Location">
          <FormRow cols={1}><FormGroup label="Airport" required><FormSelect value={form.airport_id} onChange={v => { f('airport_id', v); f('terminal_id', ''); }} options={airports.map(a => ({ value: a.airport_id, label: `${a.iata_code ? `[${a.iata_code.trim()}] ` : ''}${a.name}` }))} placeholder="Select airport…" /></FormGroup></FormRow>
          <FormRow cols={1}><FormGroup label="Terminal"><FormSelect value={form.terminal_id || ''} onChange={v => f('terminal_id', v)} options={filteredTerminals.map(t => ({ value: t.terminal_id, label: t.code }))} placeholder="Select terminal…" /></FormGroup></FormRow>
        </FormSection>
        <FormSection title="Gate Details">
          <FormRow>
            <FormGroup label="Gate Code" required><FormInput value={form.code} onChange={v => f('code', v)} placeholder="A12" required /></FormGroup>
            <FormGroup label="Gate Type"><FormSelect value={form.gate_type || ''} onChange={v => f('gate_type', v as GateType)} options={GATE_TYPES.map(t => ({ value: t, label: t }))} placeholder="Select…" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Pax Capacity"><FormInput type="number" value={String(form.pax_capacity || '')} onChange={v => f('pax_capacity', Number(v))} placeholder="300" /></FormGroup>
            <FormGroup label="Options">
              <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FormCheckbox label="Common Use (CUTE)" checked={form.is_common_use} onChange={v => f('is_common_use', v)} />
                <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
              </div>
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
