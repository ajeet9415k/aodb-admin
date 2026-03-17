'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Plane } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { AirlineAPI, CountryAPI, adminFetcher } from '@/lib/api/admin-client';
import type { Airline, AirlineCreate, AirlineType } from '@/lib/api/admin-types';
import { toast } from '@/lib/toast';

const AIRLINE_TYPES: AirlineType[] = ['FULL_SERVICE', 'LOW_COST', 'CHARTER', 'CARGO', 'REGIONAL', 'PRIVATE'];
const ALLIANCES = ['Star Alliance', 'Oneworld', 'SkyTeam', 'None'];

const EMPTY: AirlineCreate = {
  tenant_id: '', iata_code: '', icao_code: '', name: '', callsign: '',
  country_id: '', airline_type: undefined, alliance: '', terminal_pref: '',
  is_active: true, valid_from: '', valid_to: '', metadata: {},
};

export default function AirlinesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Airline | null>(null);
  const [form, setForm] = useState<AirlineCreate>(EMPTY);

  const { data = [], isLoading, error, mutate } = useSWR<Airline[]>('/api/v1/admin/airlines', adminFetcher);
  const { data: countries = [] } = useSWR('/api/v1/admin/countries', adminFetcher);

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
    { label: 'Inactive', value: data.filter(a => !a.is_active).length, color: 'var(--text-3)' },
    { label: 'Types', value: new Set(data.map(a => a.airline_type).filter(Boolean)).size },
  ];

  const columns: Column<Airline>[] = [
    {
      key: 'iata_code', label: 'IATA/ICAO', width: '100px',
      render: r => (
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{(r.iata_code || '—').trim()}</span>
          {r.icao_code && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.icao_code.trim()}</span>}
        </div>
      ),
    },
    { key: 'name', label: 'Airline Name' },
    {
      key: 'airline_type', label: 'Type', width: '120px',
      render: r => r.airline_type ? (
        <span className="badge badge-blue">{r.airline_type.replace('_', ' ')}</span>
      ) : '—',
    },
    { key: 'alliance', label: 'Alliance', width: '120px', render: r => r.alliance || '—' },
    { key: 'country_name', label: 'Country', width: '120px', render: r => r.country_name || '—' },
    {
      key: 'is_active', label: 'Status', width: '80px',
      render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row: Airline) {
    setEditing(row);
    setForm({
      tenant_id: row.tenant_id,
      iata_code: row.iata_code || '',
      icao_code: row.icao_code || '',
      name: row.name,
      callsign: row.callsign || '',
      country_id: row.country_id || '',
      airline_type: row.airline_type,
      alliance: row.alliance || '',
      terminal_pref: row.terminal_pref || '',
      is_active: row.is_active,
      valid_from: row.valid_from || '',
      valid_to: row.valid_to || '',
      metadata: row.metadata,
    });
    setModalOpen(true);
  }

  async function handleDelete(row: Airline) {
    try {
      await AirlineAPI.delete(row.airline_id);
      toast.success('Airline Deleted', `${row.name} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete airline');
      throw e;
    }
  }

  async function handleToggle(row: Airline) {
    try {
      await AirlineAPI.toggle(row.airline_id, !row.is_active);
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
        await AirlineAPI.update(editing.airline_id, form);
        toast.success('Airline Updated', `${form.name} has been updated`);
      } else {
        await AirlineAPI.create(form);
        toast.success('Airline Created', `${form.name} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k: keyof AirlineCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage
        title="Airlines"
        subtitle="Manage airline reference data — IATA/ICAO codes, types, alliances"
        icon={<Plane size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="airline_id"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={r => openEdit(r as unknown as Airline)}
        onDelete={r => handleDelete(r as unknown as Airline)}
        onToggle={r => handleToggle(r as unknown as Airline)}
        hasToggle
        activeKey="is_active"
        addLabel="Add Airline"
        stats={stats}
      />

      <FormModal
        title={editing ? 'Edit Airline' : 'New Airline'}
        subtitle={editing ? `Editing ${editing.name}` : 'Create a new airline record'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={640}
      >
        <FormSection title="Identity">
          <FormRow cols={2}>
            <FormGroup label="IATA Code" hint="2-letter code e.g. AA">
              <FormInput value={form.iata_code || ''} onChange={v => f('iata_code', v)} placeholder="AA" />
            </FormGroup>
            <FormGroup label="ICAO Code" hint="3-letter code e.g. AAL">
              <FormInput value={form.icao_code || ''} onChange={v => f('icao_code', v)} placeholder="AAL" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Airline Name" required>
              <FormInput value={form.name} onChange={v => f('name', v)} placeholder="American Airlines" required />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Callsign">
              <FormInput value={form.callsign || ''} onChange={v => f('callsign', v)} placeholder="AMERICAN" />
            </FormGroup>
            <FormGroup label="Airline Type">
              <FormSelect
                value={form.airline_type || ''}
                onChange={v => f('airline_type', v as AirlineType || undefined)}
                options={AIRLINE_TYPES.map(t => ({ value: t, label: t.replace('_', ' ') }))}
                placeholder="Select type…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Classification">
          <FormRow cols={2}>
            <FormGroup label="Alliance">
              <FormSelect
                value={form.alliance || ''}
                onChange={v => f('alliance', v)}
                options={ALLIANCES.map(a => ({ value: a, label: a }))}
                placeholder="None"
              />
            </FormGroup>
            <FormGroup label="Country">
              <FormSelect
                value={form.country_id || ''}
                onChange={v => f('country_id', v)}
                options={(countries as { country_id: string; name: string }[]).map((c) => ({ value: c.country_id, label: c.name }))}
                placeholder="Select country…"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Terminal Preference" hint="Default terminal assignment">
              <FormInput value={form.terminal_pref || ''} onChange={v => f('terminal_pref', v)} placeholder="T1" />
            </FormGroup>
            <FormGroup label="Status">
              <div style={{ paddingTop: 6 }}>
                <FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} />
              </div>
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Validity">
          <FormRow cols={2}>
            <FormGroup label="Valid From">
              <FormInput type="date" value={form.valid_from || ''} onChange={v => f('valid_from', v)} />
            </FormGroup>
            <FormGroup label="Valid To">
              <FormInput type="date" value={form.valid_to || ''} onChange={v => f('valid_to', v)} />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
