'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Waypoints } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { RunwayAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Runway, RunwayCreate } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const SURFACES = ['ASPHALT', 'CONCRETE', 'GRAVEL', 'GRASS', 'DIRT'];
const ILS_CATS = ['CAT I', 'CAT II', 'CAT III', 'CAT IIIA', 'CAT IIIB', 'CAT IIIC', 'None'];
const EMPTY: RunwayCreate = { airport_id: '', designator: '', is_active: true, attributes: {} };

export default function RunwaysPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Runway | null>(null);
  const [form, setForm] = useState<RunwayCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Runway[]>('/api/v1/admin/runways', adminFetcher);
  const { data: airports = [] } = useSWR<{ airport_id: string; name: string; iata_code?: string }[]>('/api/v1/admin/airports', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(r => r.designator.toLowerCase().includes(q) || (r.reciprocal || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter(r => r.is_active).length, color: 'var(--green)' },
    { label: 'ILS Equipped', value: data.filter(r => r.ils_category && r.ils_category !== 'None').length, color: 'var(--blue)' },
  ];

  const columns: Column<Runway>[] = [
    { key: 'designator', label: 'Designator', width: '100px', render: r => <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{r.designator}{r.reciprocal ? ` / ${r.reciprocal}` : ''}</span> },
    { key: 'length_m', label: 'Length', width: '100px', render: r => r.length_m ? `${r.length_m.toLocaleString()}m` : '—' },
    { key: 'width_m', label: 'Width', width: '80px', render: r => r.width_m ? `${r.width_m}m` : '—' },
    { key: 'surface', label: 'Surface', width: '100px', render: r => r.surface ? <span className="badge badge-slate">{r.surface}</span> : '—' },
    { key: 'ils_category', label: 'ILS', width: '100px', render: r => r.ils_category && r.ils_category !== 'None' ? <span className="badge badge-cyan">{r.ils_category}</span> : '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Runway) {
    setEditing(row);
    setForm({ airport_id: row.airport_id, designator: row.designator, reciprocal: row.reciprocal || '', length_m: row.length_m, width_m: row.width_m, surface: row.surface || '', pcn: row.pcn || '', ils_category: row.ils_category || '', true_bearing: row.true_bearing, elevation_ft: row.elevation_ft, is_active: row.is_active, attributes: row.attributes });
    setModalOpen(true);
  }

  async function handleDelete(row: Runway) {
    try {
      await RunwayAPI.delete(row.runway_id);
      toast.success('Runway Deleted', `Runway ${row.designator} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete runway');
      throw e;
    }
  }

  async function handleToggle(row: Runway) {
    try {
      await RunwayAPI.update(row.runway_id, { is_active: !row.is_active });
      toast.success('Status Updated', `Runway ${row.designator} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await RunwayAPI.update(editing.runway_id, form);
        toast.success('Runway Updated', `Runway ${form.designator} has been updated`);
      } else {
        await RunwayAPI.create(form);
        toast.success('Runway Created', `Runway ${form.designator} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof RunwayCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Runways" subtitle="Airport runways — designator, dimensions, surface and ILS category"
        icon={<Waypoints size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="runway_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Runway)} onDelete={r => handleDelete(r as unknown as Runway)}
        onToggle={r => handleToggle(r as unknown as Runway)} hasToggle activeKey="is_active"
        addLabel="Add Runway" stats={stats}
      />
      <FormModal title={editing ? 'Edit Runway' : 'New Runway'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={600}>
        <FormSection title="Identification">
          <FormRow cols={1}><FormGroup label="Airport" required><FormSelect value={form.airport_id} onChange={v => f('airport_id', v)} options={airports.map(a => ({ value: a.airport_id, label: `${a.iata_code ? `[${a.iata_code.trim()}] ` : ''}${a.name}` }))} placeholder="Select airport…" /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="Designator" required hint="e.g. 09L, 27R"><FormInput value={form.designator} onChange={v => f('designator', v)} placeholder="09L" required /></FormGroup>
            <FormGroup label="Reciprocal" hint="Opposite heading"><FormInput value={form.reciprocal || ''} onChange={v => f('reciprocal', v)} placeholder="27R" /></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Physical Characteristics">
          <FormRow>
            <FormGroup label="Length (m)"><FormInput type="number" value={String(form.length_m || '')} onChange={v => f('length_m', Number(v))} placeholder="3000" /></FormGroup>
            <FormGroup label="Width (m)"><FormInput type="number" value={String(form.width_m || '')} onChange={v => f('width_m', Number(v))} placeholder="45" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Surface"><FormSelect value={form.surface || ''} onChange={v => f('surface', v)} options={SURFACES.map(s => ({ value: s, label: s }))} placeholder="Select…" /></FormGroup>
            <FormGroup label="PCN" hint="Pavement Classification Number"><FormInput value={form.pcn || ''} onChange={v => f('pcn', v)} placeholder="80/R/B/W/T" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="ILS Category"><FormSelect value={form.ils_category || ''} onChange={v => f('ils_category', v)} options={ILS_CATS.map(c => ({ value: c, label: c }))} placeholder="None" /></FormGroup>
            <FormGroup label="True Bearing (°)"><FormInput type="number" value={String(form.true_bearing || '')} onChange={v => f('true_bearing', Number(v))} placeholder="090" /></FormGroup>
          </FormRow>
        </FormSection>
        <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
      </FormModal>
    </>
  );
}
