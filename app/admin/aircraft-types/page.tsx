'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Cpu } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormSection } from '@/components/admin/FormModal';
import { AircraftTypeAPI, adminFetcher } from '@/lib/api/admin-client';
import type { AircraftType, AircraftTypeCreate, BodyType, WakeCategory } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const BODY_TYPES: BodyType[] = ['NARROW', 'WIDE', 'REGIONAL', 'TURBOPROP', 'HELICOPTER', 'CARGO'];
const WAKE_CATS: WakeCategory[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const EMPTY: AircraftTypeCreate = { iata_code: '', icao_code: '', name: '', manufacturer: '', body_type: undefined, wake_category: undefined, metadata: {} };

export default function AircraftTypesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AircraftType | null>(null);
  const [form, setForm] = useState<AircraftTypeCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<AircraftType[]>('/api/v1/admin/aircraft-types', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(a => a.name.toLowerCase().includes(q) || a.iata_code.toLowerCase().includes(q) || (a.manufacturer || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total Types', value: data.length },
    { label: 'Narrow Body', value: data.filter(a => a.body_type === 'NARROW').length, color: 'var(--blue)' },
    { label: 'Wide Body', value: data.filter(a => a.body_type === 'WIDE').length, color: 'var(--violet)' },
    { label: 'Manufacturers', value: new Set(data.map(a => a.manufacturer).filter(Boolean)).size },
  ];

  const columns: Column<AircraftType>[] = [
    { key: 'iata_code', label: 'IATA/ICAO', width: '110px', render: r => <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem' }}><span style={{ fontWeight: 600 }}>{r.iata_code}</span>{r.icao_code && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.icao_code}</span>}</div> },
    { key: 'name', label: 'Type Name' },
    { key: 'manufacturer', label: 'Manufacturer', width: '120px', render: r => r.manufacturer || '—' },
    { key: 'body_type', label: 'Body', width: '100px', render: r => r.body_type ? <span className="badge badge-violet">{r.body_type}</span> : '—' },
    { key: 'wake_category', label: 'Wake', width: '70px', render: r => r.wake_category ? <span className="badge badge-amber">{r.wake_category}</span> : '—' },
    { key: 'max_seats', label: 'Seats', width: '70px', render: r => r.max_seats ? String(r.max_seats) : '—' },
    { key: 'wingspan_m', label: 'Wingspan', width: '90px', render: r => r.wingspan_m ? `${r.wingspan_m}m` : '—' },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: AircraftType) {
    setEditing(row);
    setForm({ iata_code: row.iata_code, icao_code: row.icao_code || '', name: row.name, manufacturer: row.manufacturer || '', body_type: row.body_type, wingspan_m: row.wingspan_m, length_m: row.length_m, height_m: row.height_m, max_seats: row.max_seats, mtow_kg: row.mtow_kg, noise_chapter: row.noise_chapter || '', wake_category: row.wake_category, metadata: row.metadata });
    setModalOpen(true);
  }

  async function handleDelete(row: AircraftType) {
    try {
      await AircraftTypeAPI.delete(row.aircraft_type_id);
      toast.success('Aircraft Type Deleted', `${row.iata_code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete aircraft type');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await AircraftTypeAPI.update(editing.aircraft_type_id, form);
        toast.success('Aircraft Type Updated', `${form.iata_code} has been updated`);
      } else {
        await AircraftTypeAPI.create(form);
        toast.success('Aircraft Type Created', `${form.iata_code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof AircraftTypeCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Aircraft Types" subtitle="IATA/ICAO aircraft type reference data — dimensions, weight, wake turbulence"
        icon={<Cpu size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="aircraft_type_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as AircraftType)} onDelete={r => handleDelete(r as unknown as AircraftType)}
        addLabel="Add Aircraft Type" stats={stats}
      />
      <FormModal title={editing ? 'Edit Aircraft Type' : 'New Aircraft Type'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={640}>
        <FormSection title="Identification">
          <FormRow><FormGroup label="IATA Code" required><FormInput value={form.iata_code} onChange={v => f('iata_code', v)} placeholder="B738" required /></FormGroup>
          <FormGroup label="ICAO Code"><FormInput value={form.icao_code || ''} onChange={v => f('icao_code', v)} placeholder="B738" /></FormGroup></FormRow>
          <FormRow cols={1}><FormGroup label="Full Name" required><FormInput value={form.name} onChange={v => f('name', v)} placeholder="Boeing 737-800" required /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="Manufacturer"><FormInput value={form.manufacturer || ''} onChange={v => f('manufacturer', v)} placeholder="Boeing" /></FormGroup>
            <FormGroup label="Body Type"><FormSelect value={form.body_type || ''} onChange={v => f('body_type', v as BodyType || undefined)} options={BODY_TYPES.map(t => ({ value: t, label: t }))} placeholder="Select…" /></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Performance">
          <FormRow>
            <FormGroup label="Wake Category"><FormSelect value={form.wake_category || ''} onChange={v => f('wake_category', v as WakeCategory || undefined)} options={WAKE_CATS.map(c => ({ value: c, label: `Cat ${c}` }))} placeholder="Select…" /></FormGroup>
            <FormGroup label="Max Seats"><FormInput type="number" value={String(form.max_seats || '')} onChange={v => f('max_seats', Number(v))} placeholder="189" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="MTOW (kg)"><FormInput type="number" value={String(form.mtow_kg || '')} onChange={v => f('mtow_kg', Number(v))} placeholder="79016" /></FormGroup>
            <FormGroup label="Noise Chapter"><FormInput value={form.noise_chapter || ''} onChange={v => f('noise_chapter', v)} placeholder="14" /></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Dimensions (metres)">
          <FormRow cols={3} >
            <FormGroup label="Wingspan"><FormInput type="number" value={String(form.wingspan_m || '')} onChange={v => f('wingspan_m', Number(v))} placeholder="35.8" /></FormGroup>
            <FormGroup label="Length"><FormInput type="number" value={String(form.length_m || '')} onChange={v => f('length_m', Number(v))} placeholder="39.5" /></FormGroup>
            <FormGroup label="Height"><FormInput type="number" value={String(form.height_m || '')} onChange={v => f('height_m', Number(v))} placeholder="12.6" /></FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
