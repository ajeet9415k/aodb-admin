'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { AlertOctagon } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { DelayCodeAPI, adminFetcher } from '@/lib/api/admin-client';
import type { DelayCode, DelayCodeCreate } from '@/lib/api/admin-types';import { toast } from '@/lib/toast';
const CATEGORIES = ['PASSENGER', 'BAGGAGE', 'CARGO', 'MAIL', 'FUELING', 'BOARDING', 'CREW', 'AIRCRAFT', 'OPERATIONS', 'ATC', 'WEATHER', 'AIRPORT', 'SECURITY', 'REACTIONARY'];
const RESPONSIBLE = ['AIRLINE', 'HANDLER', 'AIRPORT', 'ATC', 'OTHER'];
const EMPTY: DelayCodeCreate = { tenant_id: '', code: '', description: '', category: '', responsible: '', is_iata: true, is_active: true };

export default function DelayCodesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DelayCode | null>(null);
  const [form, setForm] = useState<DelayCodeCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<DelayCode[]>('/api/v1/admin/delay-codes', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(d => d.code.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total Codes', value: data.length },
    { label: 'Active', value: data.filter(d => d.is_active).length, color: 'var(--green)' },
    { label: 'IATA Standard', value: data.filter(d => d.is_iata).length, color: 'var(--blue)' },
    { label: 'Categories', value: new Set(data.map(d => d.category).filter(Boolean)).size },
  ];

  const columns: Column<DelayCode>[] = [
    { key: 'code', label: 'Code', width: '80px', render: r => <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: 'var(--amber)' }}>{r.code}</span> },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category', width: '130px', render: r => r.category ? <span className="badge badge-slate">{r.category}</span> : '—' },
    { key: 'responsible', label: 'Responsible', width: '110px', render: r => r.responsible ? <span className="badge badge-violet">{r.responsible}</span> : '—' },
    { key: 'is_iata', label: 'IATA', width: '70px', render: r => r.is_iata ? <span className="badge badge-blue">IATA</span> : '—' },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(row: DelayCode) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, code: row.code, description: row.description, category: row.category || '', responsible: row.responsible || '', is_iata: row.is_iata, is_active: row.is_active });
    setModalOpen(true);
  }

  async function handleDelete(row: DelayCode) {
    try {
      await DelayCodeAPI.delete(row.delay_code_id);
      toast.success('Delay Code Deleted', `${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete delay code');
      throw e;
    }
  }

  async function handleToggle(row: DelayCode) {
    try {
      await DelayCodeAPI.update(row.delay_code_id, { is_active: !row.is_active });
      toast.success('Status Updated', `${row.code} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await DelayCodeAPI.update(editing.delay_code_id, form);
        toast.success('Delay Code Updated', `${form.code} has been updated`);
      } else {
        await DelayCodeAPI.create(form);
        toast.success('Delay Code Created', `${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }
  const f = (k: keyof DelayCodeCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Delay Codes" subtitle="IATA and custom delay codes for flight delay attribution and reporting"
        icon={<AlertOctagon size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="delay_code_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as DelayCode)} onDelete={r => handleDelete(r as unknown as DelayCode)}
        onToggle={r => handleToggle(r as unknown as DelayCode)} hasToggle activeKey="is_active"
        addLabel="Add Delay Code" stats={stats}
      />
      <FormModal title={editing ? 'Edit Delay Code' : 'New Delay Code'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={560}>
        <FormSection title="Code Details">
          <FormRow>
            <FormGroup label="Code" required hint="Numeric e.g. 93"><FormInput value={form.code} onChange={v => f('code', v)} placeholder="93" required /></FormGroup>
            <FormGroup label="Responsible Party"><FormSelect value={form.responsible || ''} onChange={v => f('responsible', v)} options={RESPONSIBLE.map(r => ({ value: r, label: r }))} placeholder="Select…" /></FormGroup>
          </FormRow>
          <FormRow cols={1}><FormGroup label="Description" required><FormInput value={form.description} onChange={v => f('description', v)} placeholder="Passenger processing — late check-in acceptance" required /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="Category"><FormSelect value={form.category || ''} onChange={v => f('category', v)} options={CATEGORIES.map(c => ({ value: c, label: c }))} placeholder="Select…" /></FormGroup>
            <FormGroup label="Options">
              <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FormCheckbox label="IATA Standard Code" checked={form.is_iata} onChange={v => f('is_iata', v)} />
                <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
              </div>
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
