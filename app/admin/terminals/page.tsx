'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Building2 } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { TerminalAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Terminal, TerminalCreate } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const EMPTY: TerminalCreate = { tenant_id: '', airport_id: '', code: '', name: '', pax_capacity: undefined, is_active: true, attributes: {} };

export default function TerminalsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Terminal | null>(null);
  const [form, setForm] = useState<TerminalCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Terminal[]>('/api/v1/admin/terminals', adminFetcher);
  const { data: airports = [] } = useSWR<{ airport_id: string; name: string; iata_code?: string }[]>('/api/v1/admin/airports', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(t => t.code.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q) || (t.airport_name || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter(t => t.is_active).length, color: 'var(--green)' },
    { label: 'Total Capacity', value: data.reduce((s, t) => s + (t.pax_capacity || 0), 0).toLocaleString(), color: 'var(--blue)' },
  ];

  const columns: Column<Terminal>[] = [
    { key: 'code', label: 'Code', width: '80px', render: r => <span className="badge badge-blue">{r.code}</span> },
    { key: 'name', label: 'Terminal Name', render: r => r.name || '—' },
    { key: 'airport_name', label: 'Airport', width: '180px', render: r => r.airport_name || '—' },
    { key: 'pax_capacity', label: 'Pax Capacity', width: '120px', render: r => r.pax_capacity ? r.pax_capacity.toLocaleString() : '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Terminal) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, airport_id: row.airport_id, code: row.code, name: row.name || '', pax_capacity: row.pax_capacity, is_active: row.is_active, valid_from: row.valid_from || '', valid_to: row.valid_to || '', attributes: row.attributes });
    setModalOpen(true);
  }

  async function handleDelete(row: Terminal) {
    try {
      await TerminalAPI.delete(row.terminal_id);
      toast.success('Terminal Deleted', `${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete terminal');
      throw e;
    }
  }

  async function handleToggle(row: Terminal) {
    try {
      await TerminalAPI.update(row.terminal_id, { is_active: !row.is_active });
      toast.success('Status Updated', `Terminal ${row.code} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await TerminalAPI.update(editing.terminal_id, form);
        toast.success('Terminal Updated', `${form.code} has been updated`);
      } else {
        await TerminalAPI.create(form);
        toast.success('Terminal Created', `${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof TerminalCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Terminals" subtitle="Airport terminal buildings — codes, names and passenger capacity"
        icon={<Building2 size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="terminal_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Terminal)} onDelete={r => handleDelete(r as unknown as Terminal)}
        onToggle={r => handleToggle(r as unknown as Terminal)} hasToggle activeKey="is_active"
        addLabel="Add Terminal" stats={stats}
      />
      <FormModal title={editing ? 'Edit Terminal' : 'New Terminal'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={560}>
        <FormSection title="Details">
          <FormRow cols={1}><FormGroup label="Airport" required><FormSelect value={form.airport_id} onChange={v => f('airport_id', v)} options={airports.map(a => ({ value: a.airport_id, label: `${a.iata_code ? `[${a.iata_code.trim()}] ` : ''}${a.name}` }))} placeholder="Select airport…" /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="Terminal Code" required hint="e.g. T1, T2, A"><FormInput value={form.code} onChange={v => f('code', v)} placeholder="T1" required /></FormGroup>
            <FormGroup label="Terminal Name"><FormInput value={form.name || ''} onChange={v => f('name', v)} placeholder="Terminal 1" /></FormGroup>
          </FormRow>
          <FormRow cols={1}><FormGroup label="Passenger Capacity"><FormInput type="number" value={String(form.pax_capacity || '')} onChange={v => f('pax_capacity', Number(v))} placeholder="15000" /></FormGroup></FormRow>
        </FormSection>
        <FormSection title="Validity">
          <FormRow>
            <FormGroup label="Valid From"><FormInput type="date" value={form.valid_from || ''} onChange={v => f('valid_from', v)} /></FormGroup>
            <FormGroup label="Valid To"><FormInput type="date" value={form.valid_to || ''} onChange={v => f('valid_to', v)} /></FormGroup>
          </FormRow>
          <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
        </FormSection>
      </FormModal>
    </>
  );
}
