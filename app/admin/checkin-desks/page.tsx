'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { ClipboardList } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { CheckinDeskAPI, adminFetcher } from '@/lib/api/admin-client';
import type { CheckinDesk, CheckinDeskCreate, DeskType } from '@/lib/api/admin-types';
import { toast } from '@/lib/toast';

const DESK_TYPES: DeskType[] = ['STANDARD', 'SELF_SERVICE', 'PREMIUM', 'OVERSIZED'];
const EMPTY: CheckinDeskCreate = { tenant_id: '', airport_id: '', terminal_id: '', code: '', desk_type: 'STANDARD', is_common_use: false, is_active: true, attributes: {} };

export default function CheckinDesksPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CheckinDesk | null>(null);
  const [form, setForm] = useState<CheckinDeskCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<CheckinDesk[]>('/api/v1/admin/checkin-desks', adminFetcher);
  const { data: airports = [] } = useSWR<{ airport_id: string; name: string; iata_code?: string }[]>('/api/v1/admin/airports', adminFetcher);
  const { data: terminals = [] } = useSWR<{ terminal_id: string; code: string; airport_id: string }[]>('/api/v1/admin/terminals', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(d => d.code.toLowerCase().includes(q) || (d.terminal_code || '').toLowerCase().includes(q));
  }, [data, search]);

  const filteredTerminals = terminals.filter(t => !form.airport_id || t.airport_id === form.airport_id);
  const TYPE_COLOR: Record<DeskType, string> = { STANDARD: 'badge-slate', SELF_SERVICE: 'badge-cyan', PREMIUM: 'badge-amber', OVERSIZED: 'badge-violet' };

  const stats = [
    { label: 'Total Desks', value: data.length },
    { label: 'Active', value: data.filter(d => d.is_active).length, color: 'var(--green)' },
    { label: 'Common Use', value: data.filter(d => d.is_common_use).length, color: 'var(--cyan)' },
    { label: 'Self Service', value: data.filter(d => d.desk_type === 'SELF_SERVICE').length, color: 'var(--blue)' },
  ];

  const columns: Column<CheckinDesk>[] = [
    { key: 'code', label: 'Desk', width: '80px', render: r => <span className="badge badge-blue">{r.code}</span> },
    { key: 'desk_type', label: 'Type', width: '120px', render: r => r.desk_type ? <span className={`badge ${TYPE_COLOR[r.desk_type]}`}>{r.desk_type.replace('_', ' ')}</span> : '—' },
    { key: 'terminal_code', label: 'Terminal', width: '90px', render: r => r.terminal_code ? <span className="badge badge-slate">{r.terminal_code}</span> : '—' },
    { key: 'is_common_use', label: 'Common Use', width: '100px', render: r => r.is_common_use ? <span className="badge badge-cyan">CUTE</span> : '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: CheckinDesk) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, airport_id: row.airport_id, terminal_id: row.terminal_id || '', code: row.code, desk_type: row.desk_type, is_common_use: row.is_common_use, is_active: row.is_active, attributes: row.attributes });
    setModalOpen(true);
  }

  async function handleDelete(row: CheckinDesk) {
    try {
      await CheckinDeskAPI.delete(row.desk_id);
      toast.success('Desk Deleted', `Desk ${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete desk');
      throw e;
    }
  }

  async function handleToggle(row: CheckinDesk) {
    try {
      await CheckinDeskAPI.update(row.desk_id, { is_active: !row.is_active });
      toast.success('Status Updated', `Desk ${row.code} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await CheckinDeskAPI.update(editing.desk_id, form);
        toast.success('Desk Updated', `Desk ${form.code} has been updated`);
      } else {
        await CheckinDeskAPI.create(form);
        toast.success('Desk Created', `Desk ${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof CheckinDeskCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Check-in Desks" subtitle="Passenger check-in counters — type and common-use configuration"
        icon={<ClipboardList size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="desk_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as CheckinDesk)} onDelete={r => handleDelete(r as unknown as CheckinDesk)}
        onToggle={r => handleToggle(r as unknown as CheckinDesk)} hasToggle activeKey="is_active"
        addLabel="Add Desk" stats={stats}
      />
      <FormModal title={editing ? 'Edit Check-in Desk' : 'New Check-in Desk'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={520}>
        <FormSection title="Location">
          <FormRow cols={1}><FormGroup label="Airport" required><FormSelect value={form.airport_id} onChange={v => { f('airport_id', v); f('terminal_id', ''); }} options={airports.map(a => ({ value: a.airport_id, label: `${a.iata_code ? `[${a.iata_code.trim()}] ` : ''}${a.name}` }))} placeholder="Select airport…" /></FormGroup></FormRow>
          <FormRow cols={1}><FormGroup label="Terminal"><FormSelect value={form.terminal_id || ''} onChange={v => f('terminal_id', v)} options={filteredTerminals.map(t => ({ value: t.terminal_id, label: t.code }))} placeholder="Select terminal…" /></FormGroup></FormRow>
        </FormSection>
        <FormSection title="Desk Details">
          <FormRow>
            <FormGroup label="Desk Code" required><FormInput value={form.code} onChange={v => f('code', v)} placeholder="D01" required /></FormGroup>
            <FormGroup label="Desk Type"><FormSelect value={form.desk_type || ''} onChange={v => f('desk_type', v as DeskType)} options={DESK_TYPES.map(t => ({ value: t, label: t.replace('_', ' ') }))} placeholder="Select…" /></FormGroup>
          </FormRow>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <FormCheckbox label="Common Use (CUTE/CUSS)" checked={form.is_common_use} onChange={v => f('is_common_use', v)} />
            <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
          </div>
        </FormSection>
      </FormModal>
    </>
  );
}
