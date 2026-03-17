'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { ParkingSquare } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { StandAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Stand, StandCreate, StandType, WakeCategory } from '@/lib/api/admin-types';
import { toast } from '@/lib/toast';

const STAND_TYPES: StandType[] = ['CONTACT', 'REMOTE', 'CARGO', 'DEICING', 'MAINTENANCE'];
const WAKE_CATS: WakeCategory[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const EMPTY: StandCreate = { tenant_id: '', airport_id: '', terminal_id: '', code: '', stand_type: 'CONTACT', tow_required: false, has_jetway: false, has_gpu: false, has_pca: false, is_active: true, attributes: {} };

export default function StandsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Stand | null>(null);
  const [form, setForm] = useState<StandCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Stand[]>('/api/v1/admin/stands', adminFetcher);
  const { data: airports = [] } = useSWR<{ airport_id: string; name: string; iata_code?: string }[]>('/api/v1/admin/airports', adminFetcher);
  const { data: terminals = [] } = useSWR<{ terminal_id: string; code: string; airport_id: string }[]>('/api/v1/admin/terminals', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(s => s.code.toLowerCase().includes(q) || (s.terminal_code || '').toLowerCase().includes(q));
  }, [data, search]);

  const filteredTerminals = terminals.filter(t => !form.airport_id || t.airport_id === form.airport_id);

  const stats = [
    { label: 'Total Stands', value: data.length },
    { label: 'Active', value: data.filter(s => s.is_active).length, color: 'var(--green)' },
    { label: 'Contact', value: data.filter(s => s.stand_type === 'CONTACT').length, color: 'var(--blue)' },
    { label: 'With Jetway', value: data.filter(s => s.has_jetway).length, color: 'var(--cyan)' },
  ];

  const columns: Column<Stand>[] = [
    { key: 'code', label: 'Stand', width: '80px', render: r => <span className="badge badge-blue">{r.code}</span> },
    { key: 'terminal_code', label: 'Terminal', width: '90px', render: r => r.terminal_code ? <span className="badge badge-slate">{r.terminal_code}</span> : '—' },
    { key: 'stand_type', label: 'Type', width: '110px', render: r => r.stand_type ? <span className="badge badge-violet">{r.stand_type}</span> : '—' },
    { key: 'max_acft_cat', label: 'Max Cat', width: '80px', render: r => r.max_acft_cat ? <span className="badge badge-amber">Cat {r.max_acft_cat}</span> : '—' },
    { key: 'max_wingspan_m', label: 'Max WS', width: '90px', render: r => r.max_wingspan_m ? `${r.max_wingspan_m}m` : '—' },
    {
      key: 'has_jetway', label: 'Features', width: '130px',
      render: r => (
        <div style={{ display: 'flex', gap: 3 }}>
          {r.has_jetway && <span className="badge badge-green">JW</span>}
          {r.has_gpu && <span className="badge badge-cyan">GPU</span>}
          {r.has_pca && <span className="badge badge-blue">PCA</span>}
          {r.tow_required && <span className="badge badge-amber">TOW</span>}
        </div>
      ),
    },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Stand) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, airport_id: row.airport_id, terminal_id: row.terminal_id || '', code: row.code, stand_type: row.stand_type, max_wingspan_m: row.max_wingspan_m, max_length_m: row.max_length_m, max_acft_cat: row.max_acft_cat, tow_required: row.tow_required, has_jetway: row.has_jetway, has_gpu: row.has_gpu, has_pca: row.has_pca, pax_capacity: row.pax_capacity, latitude: row.latitude, longitude: row.longitude, is_active: row.is_active, attributes: row.attributes });
    setModalOpen(true);
  }

  async function handleDelete(row: Stand) {
    try {
      await StandAPI.delete(row.stand_id);
      toast.success('Stand Deleted', `Stand ${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete stand');
      throw e;
    }
  }

  async function handleToggle(row: Stand) {
    try {
      await StandAPI.update(row.stand_id, { is_active: !row.is_active });
      toast.success('Status Updated', `Stand ${row.code} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await StandAPI.update(editing.stand_id, form);
        toast.success('Stand Updated', `Stand ${form.code} has been updated`);
      } else {
        await StandAPI.create(form);
        toast.success('Stand Created', `Stand ${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof StandCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Stands / Apron" subtitle="Aircraft parking stands — type, dimensions, ground service equipment"
        icon={<ParkingSquare size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="stand_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Stand)} onDelete={r => handleDelete(r as unknown as Stand)}
        onToggle={r => handleToggle(r as unknown as Stand)} hasToggle activeKey="is_active"
        addLabel="Add Stand" stats={stats}
      />
      <FormModal title={editing ? 'Edit Stand' : 'New Stand'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={620}>
        <FormSection title="Location">
          <FormRow cols={1}><FormGroup label="Airport" required><FormSelect value={form.airport_id} onChange={v => { f('airport_id', v); f('terminal_id', ''); }} options={airports.map(a => ({ value: a.airport_id, label: `${a.iata_code ? `[${a.iata_code.trim()}] ` : ''}${a.name}` }))} placeholder="Select airport…" /></FormGroup></FormRow>
          <FormRow><FormGroup label="Terminal"><FormSelect value={form.terminal_id || ''} onChange={v => f('terminal_id', v)} options={filteredTerminals.map(t => ({ value: t.terminal_id, label: t.code }))} placeholder="Select terminal…" /></FormGroup>
          <FormGroup label="Stand Code" required><FormInput value={form.code} onChange={v => f('code', v)} placeholder="S01" required /></FormGroup></FormRow>
        </FormSection>
        <FormSection title="Aircraft Constraints">
          <FormRow>
            <FormGroup label="Stand Type"><FormSelect value={form.stand_type || ''} onChange={v => f('stand_type', v as StandType)} options={STAND_TYPES.map(t => ({ value: t, label: t }))} placeholder="Select…" /></FormGroup>
            <FormGroup label="Max Aircraft Cat"><FormSelect value={form.max_acft_cat || ''} onChange={v => f('max_acft_cat', v as WakeCategory || undefined)} options={WAKE_CATS.map(c => ({ value: c, label: `Category ${c}` }))} placeholder="Select…" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Max Wingspan (m)"><FormInput type="number" value={String(form.max_wingspan_m || '')} onChange={v => f('max_wingspan_m', Number(v))} placeholder="65" /></FormGroup>
            <FormGroup label="Max Length (m)"><FormInput type="number" value={String(form.max_length_m || '')} onChange={v => f('max_length_m', Number(v))} placeholder="73" /></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Ground Equipment">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormCheckbox label="Jetway / Airbridge" checked={form.has_jetway} onChange={v => f('has_jetway', v)} />
            <FormCheckbox label="GPU (Ground Power Unit)" checked={form.has_gpu} onChange={v => f('has_gpu', v)} />
            <FormCheckbox label="PCA (Pre-Conditioned Air)" checked={form.has_pca} onChange={v => f('has_pca', v)} />
            <FormCheckbox label="Tow Required" checked={form.tow_required} onChange={v => f('tow_required', v)} />
            <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
          </div>
        </FormSection>
      </FormModal>
    </>
  );
}
