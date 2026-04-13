import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Building2 } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormSection } from '@/components/ui/FormModal';
import { TerminalAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const ATTRIBUTE_TYPES = ['DOMESTIC', 'INTERNATIONAL', 'MIXED'];

const EMPTY = { tenantId: '', airportId: '', code: '', name: '', attributes: { type: '' }, validFrom: null, validTo: null };

export default function TerminalsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);

  const { data: rawData, isLoading, error, mutate } = useSWR(`/api/v1/terminals?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = Array.isArray(rawData) ? rawData : (rawData?.content || []);
  const totalPages = rawData?.totalPages ?? 1;
  const { data: airportsData } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = Array.isArray(airportsData) ? airportsData : (airportsData?.content || []);

  // Build airport lookup for status
  const airportMap = useMemo(() => {
    const map = {};
    airports.forEach((a) => { map[a.airportId] = a; });
    return map;
  }, [airports]);

  const getStatus = (t) => airportMap[t.airportId]?.operationalStatus || 'UNKNOWN';

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((t) => (t.code || '').toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q) || (t.airportName || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter((t) => getStatus(t) === 'ACTIVE').length, color: 'var(--green)' },
    { label: 'Airports', value: new Set(data.map((t) => t.airportId).filter(Boolean)).size, color: 'var(--blue)' },
  ];

  const columns = [
    { key: 'code', label: 'Code', width: '80px', render: (r) => <span className="badge badge-blue">{r.code}</span> },
    { key: 'name', label: 'Terminal Name', render: (r) => r.name || '—' },
    { key: 'airportName', label: 'Airport', width: '180px', render: (r) => r.airportName || '—' },
    { key: 'airportIataCode', label: 'IATA', width: '80px', render: (r) => r.airportIataCode || '—' },
    { key: 'operationalStatus', label: 'Status', width: '90px', render: (r) => { const s = getStatus(r); return <span className={`badge ${s === 'ACTIVE' ? 'badge-green' : 'badge-slate'}`}>{s === 'ACTIVE' ? 'Active' : 'Inactive'}</span>; } },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      tenantId: row.tenantId || getTenantId(),
      airportId: row.airportId,
      code: row.code,
      name: row.name || '',
      attributes: row.attributes || { type: '' },
      validFrom: row.validFrom || null,
      validTo: row.validTo || null,
    });
    setModalOpen(true);
  }

  async function handleDelete(row) {
    try {
      await TerminalAPI.delete(row.terminalId);
      toast.success('Terminal Deleted', `${row.code} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete terminal');
      throw e;
    }
  }


  async function handleSubmit() {
    try {
      const payload = {
        name: form.name,
        code: form.code,
        airportId: form.airportId,
        attributes: form.attributes,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        tenantId: form.tenantId || getTenantId(),
      };
      if (editing) {
        await TerminalAPI.update(editing.terminalId, payload);
        toast.success('Terminal Updated', `${form.code} has been updated`);
      } else {
        await TerminalAPI.create(payload);
        toast.success('Terminal Created', `${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage
        readOnly={!hasRole('ADMIN')}
        title="Terminals"
        subtitle="Airport terminal buildings — codes, names and passenger capacity"
        icon={<Building2 size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="terminalId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Terminal"
        stats={stats}
        page={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />
      <FormModal title={editing ? 'Edit Terminal' : 'New Terminal'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={560}>
        <FormSection title="Details">
          <FormRow cols={1}>
            <FormGroup label="Airport" required>
              <FormSelect
                value={form.airportId}
                onChange={(v) => f('airportId', v)}
                options={airports.map((a) => ({
                  value: a.airportId,
                  label: `${a.iataCode ? `[${a.iataCode.trim()}] ` : ''}${a.name}`,
                }))}
                placeholder="Select airport…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Terminal Code" required hint="e.g. T1, T2, A">
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="T1" required />
            </FormGroup>
            <FormGroup label="Terminal Name" required>
              <FormInput value={form.name || ''} onChange={(v) => f('name', v)} placeholder="Terminal 1" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Type" hint="Terminal type attribute">
              <FormSelect
                value={form.attributes?.type || ''}
                onChange={(v) => setForm((p) => ({ ...p, attributes: { ...p.attributes, type: v } }))}
                options={ATTRIBUTE_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Select type…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Validity">
          <FormRow>
            <FormGroup label="Valid From">
              <FormInput type="date" value={form.validFrom || ''} onChange={(v) => f('validFrom', v || null)} />
            </FormGroup>
            <FormGroup label="Valid To">
              <FormInput type="date" value={form.validTo || ''} onChange={(v) => f('validTo', v || null)} />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}

