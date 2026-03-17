'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Globe2 } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import { adminFetcher } from '@/lib/api/admin-client';
import type { Country } from '@/lib/api/admin-types';

export default function CountriesPage() {
  const [search, setSearch] = useState('');
  const { data = [], isLoading, error, mutate } = useSWR<Country[]>('/api/v1/admin/countries', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(c => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total Countries', value: data.length },
    { label: 'Regions', value: new Set(data.map(c => c.region).filter(Boolean)).size, color: 'var(--blue)' },
  ];

  const columns: Column<Country>[] = [
    { key: 'iso2', label: 'ISO2', width: '60px', render: r => <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>{r.iso2}</span> },
    { key: 'iso3', label: 'ISO3', width: '60px', render: r => <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text-3)' }}>{r.iso3}</span> },
    { key: 'name', label: 'Country Name' },
    { key: 'region', label: 'Region', width: '140px', render: r => r.region ? <span className="badge badge-slate">{r.region}</span> : '—' },
  ];

  return (
    <MasterPage title="Countries" subtitle="ISO 3166-1 country reference data — read only"
      icon={<Globe2 size={18} color="#fff" />} columns={columns}
      data={filtered}
      loading={isLoading} error={error?.message} idKey="country_id"
      searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
      onAdd={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
      addLabel=""
      stats={stats}
    />
  );
}
