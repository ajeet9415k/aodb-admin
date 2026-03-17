'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { ShieldCheck } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { TenantAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Tenant, TenantCreate } from '@/lib/api/admin-types';
import { toast } from '@/lib/toast';

const EMPTY: TenantCreate = { code: '', name: '', airport_icao: '', is_active: true, settings: {} };

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Tenant[]>('/api/v1/admin/tenants', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || (t.airport_icao || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total Tenants', value: data.length },
    { label: 'Active', value: data.filter(t => t.is_active).length, color: 'var(--green)' },
    { label: 'Inactive', value: data.filter(t => !t.is_active).length, color: 'var(--text-3)' },
  ];

  const columns: Column<Tenant>[] = [
    { key: 'code', label: 'Code', width: '100px', render: r => <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: 'var(--blue)' }}>{r.code}</span> },
    { key: 'name', label: 'Tenant Name' },
    { key: 'airport_icao', label: 'Airport ICAO', width: '120px', render: r => r.airport_icao ? <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.82rem' }}>{r.airport_icao}</span> : '—' },
    {
      key: 'created_at', label: 'Created', width: '130px',
      render: r => <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: Tenant) {
    setEditing(row);
    setForm({ code: row.code, name: row.name, airport_icao: row.airport_icao || '', is_active: row.is_active, settings: row.settings });
    setModalOpen(true);
  }

  async function handleDelete(row: Tenant) {
    try {
      await TenantAPI.delete(row.tenant_id);
      toast.success('Tenant Deleted', `${row.name} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete tenant');
      throw e;
    }
  }

  async function handleToggle(row: Tenant) {
    try {
      await TenantAPI.update(row.tenant_id, { is_active: !row.is_active });
      toast.success('Status Updated', `${row.name} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await TenantAPI.update(editing.tenant_id, form);
        toast.success('Tenant Updated', `${form.name} has been updated`);
      } else {
        await TenantAPI.create(form);
        toast.success('Tenant Created', `${form.name} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof TenantCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Tenants" subtitle="Multi-tenancy root — airport and organisation tenant management"
        icon={<ShieldCheck size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="tenant_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as Tenant)} onDelete={r => handleDelete(r as unknown as Tenant)}
        onToggle={r => handleToggle(r as unknown as Tenant)} hasToggle activeKey="is_active"
        addLabel="Add Tenant" stats={stats}
      />
      <FormModal title={editing ? 'Edit Tenant' : 'New Tenant'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={500}>
        <FormSection title="Tenant Details">
          <FormRow>
            <FormGroup label="Tenant Code" required hint="Unique short code"><FormInput value={form.code} onChange={v => f('code', v.toUpperCase())} placeholder="OJAI" required /></FormGroup>
            <FormGroup label="Airport ICAO" hint="If airport tenant"><FormInput value={form.airport_icao || ''} onChange={v => f('airport_icao', v.toUpperCase())} placeholder="VOBL" /></FormGroup>
          </FormRow>
          <FormRow cols={1}><FormGroup label="Tenant Name" required><FormInput value={form.name} onChange={v => f('name', v)} placeholder="Kempegowda International Airport" required /></FormGroup></FormRow>
          <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
        </FormSection>
      </FormModal>
    </>
  );
}
