'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Globe2 } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { AirportAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Airport, AirportCreate, AirportType } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const APT_TYPES: AirportType[] = ['INTERNATIONAL', 'DOMESTIC', 'REGIONAL', 'MILITARY', 'PRIVATE'];

const EMPTY: AirportCreate = {
  iata_code: '', icao_code: '', name: '', country_id: '', tz: 'UTC',
  apt_type: undefined, is_active: true, metadata: {},
};

export default function AirportsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Airport | null>(null);
  const [form, setForm] = useState<AirportCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Airport[]>('/api/v1/admin/airports', adminFetcher);
  const { data: countries = [] } = useSWR<{ country_id: string; name: string }[]>('/api/v1/admin/countries', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.iata_code || '').toLowerCase().includes(q) ||
      (a.icao_code || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter(a => a.is_active).length, color: 'var(--green)' },
    { label: 'International', value: data.filter(a => a.apt_type === 'INTERNATIONAL').length, color: 'var(--blue)' },
    { label: 'Domestic', value: data.filter(a => a.apt_type === 'DOMESTIC').length, color: 'var(--cyan)' },
  ];

  const columns: Column<Airport>[] = [
    {
      key: 'iata_code', label: 'Codes', width: '110px',
      render: r => (
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{(r.iata_code || '—').trim()}</span>
          {r.icao_code && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.icao_code.trim()}</span>}
        </div>
      ),
    },
    { key: 'name', label: 'Airport Name' },
    { key: 'apt_type', label: 'Type', width: '120px', render: r => r.apt_type ? <span className="badge badge-blue">{r.apt_type}</span> : '—' },
    { key: 'tz', label: 'Timezone', width: '160px', render: r => <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: 'var(--text-2)' }}>{r.tz}</span> },
    { key: 'country_name', label: 'Country', width: '130px', render: r => r.country_name || '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Airport) {
    setEditing(row);
    setForm({ iata_code: row.iata_code || '', icao_code: row.icao_code || '', name: row.name, country_id: row.country_id || '', tz: row.tz, latitude: row.latitude, longitude: row.longitude, elevation_ft: row.elevation_ft, apt_type: row.apt_type, is_active: row.is_active, valid_from: row.valid_from || '', valid_to: row.valid_to || '', metadata: row.metadata });
    setModalOpen(true);
  }

  async function handleDelete(row: Airport) {
    try {
      await AirportAPI.delete(row.airport_id);
      toast.success('Airport Deleted', `${row.name} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete airport');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await AirportAPI.update(editing.airport_id, form);
        toast.success('Airport Updated', `${form.name} has been updated`);
      } else {
        await AirportAPI.create(form);
        toast.success('Airport Created', `${form.name} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k: keyof AirportCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Airports" subtitle="Reference airports — IATA/ICAO codes, timezones, coordinates"
        icon={<Globe2 size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="airport_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Airport)} onDelete={r => handleDelete(r as unknown as Airport)}
        addLabel="Add Airport" stats={stats}
      />
      <FormModal title={editing ? 'Edit Airport' : 'New Airport'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={660}>
        <FormSection title="Identity">
          <FormRow><FormGroup label="IATA" hint="3-letter"><FormInput value={form.iata_code || ''} onChange={v => f('iata_code', v)} placeholder="JFK" /></FormGroup>
          <FormGroup label="ICAO" hint="4-letter"><FormInput value={form.icao_code || ''} onChange={v => f('icao_code', v)} placeholder="KJFK" /></FormGroup></FormRow>
          <FormRow cols={1}><FormGroup label="Airport Name" required><FormInput value={form.name} onChange={v => f('name', v)} placeholder="John F. Kennedy International Airport" required /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="Type"><FormSelect value={form.apt_type || ''} onChange={v => f('apt_type', v as AirportType || undefined)} options={APT_TYPES.map(t => ({ value: t, label: t }))} placeholder="Select…" /></FormGroup>
            <FormGroup label="Timezone" required><FormInput value={form.tz} onChange={v => f('tz', v)} placeholder="America/New_York" required /></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Location">
          <FormRow>
            <FormGroup label="Country"><FormSelect value={form.country_id || ''} onChange={v => f('country_id', v)} options={countries.map(c => ({ value: c.country_id, label: c.name }))} placeholder="Select…" /></FormGroup>
            <FormGroup label="Elevation (ft)"><FormInput type="number" value={String(form.elevation_ft || '')} onChange={v => f('elevation_ft', Number(v))} placeholder="13" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Latitude"><FormInput type="number" value={String(form.latitude || '')} onChange={v => f('latitude', Number(v))} placeholder="40.639801" /></FormGroup>
            <FormGroup label="Longitude"><FormInput type="number" value={String(form.longitude || '')} onChange={v => f('longitude', Number(v))} placeholder="-73.7789" /></FormGroup>
          </FormRow>
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
