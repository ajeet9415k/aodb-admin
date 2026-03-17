/**
 * AODB Admin API Client — Master Data CRUD
 * All endpoints: /api/v1/admin/*
 */

import type {
  Tenant, TenantCreate,
  Airline, AirlineCreate,
  Airport, AirportCreate,
  AircraftType, AircraftTypeCreate,
  Terminal, TerminalCreate,
  Gate, GateCreate,
  Stand, StandCreate,
  Runway, RunwayCreate,
  Belt, BeltCreate,
  CheckinDesk, CheckinDeskCreate,
  GroundHandler, GroundHandlerCreate,
  DelayCode, DelayCodeCreate,
  AppUser, AppUserCreate,
  Country, ListParams,
} from './admin-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('rms_token') || '';
}

function getTenantId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const u = localStorage.getItem('rms_user');
    return u ? JSON.parse(u).tenant_id : '';
  } catch { return ''; }
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  const tenantId = getTenantId();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(tenantId && { 'X-Tenant-Id': tenantId }),
  };
}

function buildQuery(params?: ListParams): string {
  if (!params) return '';
  const q = new URLSearchParams();
  if (params.page)      q.set('page', String(params.page));
  if (params.per_page)  q.set('per_page', String(params.per_page));
  if (params.search)    q.set('search', params.search);
  if (params.is_active !== undefined) q.set('is_active', String(params.is_active));
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
    if (res.status === 401 && typeof window !== 'undefined') window.location.href = '/login';
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

export const adminFetcher = (url: string): Promise<any> => req<any>(url);

// --------------------------------------------------------------------------
// Tenants  /api/v1/admin/tenants
// --------------------------------------------------------------------------
export const TenantAPI = {
  list:   (p?: ListParams)          => req<Tenant[]>(`/api/v1/admin/tenants${buildQuery(p)}`),
  get:    (id: string)              => req<Tenant>(`/api/v1/admin/tenants/${id}`),
  create: (b: TenantCreate)         => req<Tenant>('/api/v1/admin/tenants', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<TenantCreate>) => req<Tenant>(`/api/v1/admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)              => req<void>(`/api/v1/admin/tenants/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Countries  /api/v1/admin/countries
// --------------------------------------------------------------------------
export const CountryAPI = {
  list: (p?: ListParams) => req<Country[]>(`/api/v1/admin/countries${buildQuery(p)}`),
};

// --------------------------------------------------------------------------
// Airlines  /api/v1/admin/airlines
// --------------------------------------------------------------------------
export const AirlineAPI = {
  list:   (p?: ListParams)           => req<Airline[]>(`/api/v1/admin/airlines${buildQuery(p)}`),
  get:    (id: string)               => req<Airline>(`/api/v1/admin/airlines/${id}`),
  create: (b: AirlineCreate)         => req<Airline>('/api/v1/admin/airlines', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<AirlineCreate>) => req<Airline>(`/api/v1/admin/airlines/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)               => req<void>(`/api/v1/admin/airlines/${id}`, { method: 'DELETE' }),
  toggle: (id: string, is_active: boolean) => req<Airline>(`/api/v1/admin/airlines/${id}`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
};

// --------------------------------------------------------------------------
// Airports  /api/v1/admin/airports
// --------------------------------------------------------------------------
export const AirportAPI = {
  list:   (p?: ListParams)           => req<Airport[]>(`/api/v1/admin/airports${buildQuery(p)}`),
  get:    (id: string)               => req<Airport>(`/api/v1/admin/airports/${id}`),
  create: (b: AirportCreate)         => req<Airport>('/api/v1/admin/airports', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<AirportCreate>) => req<Airport>(`/api/v1/admin/airports/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)               => req<void>(`/api/v1/admin/airports/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Aircraft Types  /api/v1/admin/aircraft-types
// --------------------------------------------------------------------------
export const AircraftTypeAPI = {
  list:   (p?: ListParams)               => req<AircraftType[]>(`/api/v1/admin/aircraft-types${buildQuery(p)}`),
  get:    (id: string)                   => req<AircraftType>(`/api/v1/admin/aircraft-types/${id}`),
  create: (b: AircraftTypeCreate)        => req<AircraftType>('/api/v1/admin/aircraft-types', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<AircraftTypeCreate>) => req<AircraftType>(`/api/v1/admin/aircraft-types/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)                   => req<void>(`/api/v1/admin/aircraft-types/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Terminals  /api/v1/admin/terminals
// --------------------------------------------------------------------------
export const TerminalAPI = {
  list:   (p?: ListParams)           => req<Terminal[]>(`/api/v1/admin/terminals${buildQuery(p)}`),
  get:    (id: string)               => req<Terminal>(`/api/v1/admin/terminals/${id}`),
  create: (b: TerminalCreate)        => req<Terminal>('/api/v1/admin/terminals', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<TerminalCreate>) => req<Terminal>(`/api/v1/admin/terminals/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)               => req<void>(`/api/v1/admin/terminals/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Gates  /api/v1/admin/gates
// --------------------------------------------------------------------------
export const GateAPI = {
  list:   (p?: ListParams)        => req<Gate[]>(`/api/v1/admin/gates${buildQuery(p)}`),
  get:    (id: string)            => req<Gate>(`/api/v1/admin/gates/${id}`),
  create: (b: GateCreate)         => req<Gate>('/api/v1/admin/gates', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<GateCreate>) => req<Gate>(`/api/v1/admin/gates/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)            => req<void>(`/api/v1/admin/gates/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Stands  /api/v1/admin/stands
// --------------------------------------------------------------------------
export const StandAPI = {
  list:   (p?: ListParams)         => req<Stand[]>(`/api/v1/admin/stands${buildQuery(p)}`),
  get:    (id: string)             => req<Stand>(`/api/v1/admin/stands/${id}`),
  create: (b: StandCreate)         => req<Stand>('/api/v1/admin/stands', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<StandCreate>) => req<Stand>(`/api/v1/admin/stands/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)             => req<void>(`/api/v1/admin/stands/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Runways  /api/v1/admin/runways
// --------------------------------------------------------------------------
export const RunwayAPI = {
  list:   (p?: ListParams)          => req<Runway[]>(`/api/v1/admin/runways${buildQuery(p)}`),
  get:    (id: string)              => req<Runway>(`/api/v1/admin/runways/${id}`),
  create: (b: RunwayCreate)         => req<Runway>('/api/v1/admin/runways', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<RunwayCreate>) => req<Runway>(`/api/v1/admin/runways/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)              => req<void>(`/api/v1/admin/runways/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Belts  /api/v1/admin/belts
// --------------------------------------------------------------------------
export const BeltAPI = {
  list:   (p?: ListParams)        => req<Belt[]>(`/api/v1/admin/belts${buildQuery(p)}`),
  get:    (id: string)            => req<Belt>(`/api/v1/admin/belts/${id}`),
  create: (b: BeltCreate)         => req<Belt>('/api/v1/admin/belts', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<BeltCreate>) => req<Belt>(`/api/v1/admin/belts/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)            => req<void>(`/api/v1/admin/belts/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Checkin Desks  /api/v1/admin/checkin-desks
// --------------------------------------------------------------------------
export const CheckinDeskAPI = {
  list:   (p?: ListParams)             => req<CheckinDesk[]>(`/api/v1/admin/checkin-desks${buildQuery(p)}`),
  get:    (id: string)                 => req<CheckinDesk>(`/api/v1/admin/checkin-desks/${id}`),
  create: (b: CheckinDeskCreate)       => req<CheckinDesk>('/api/v1/admin/checkin-desks', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<CheckinDeskCreate>) => req<CheckinDesk>(`/api/v1/admin/checkin-desks/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)                 => req<void>(`/api/v1/admin/checkin-desks/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Ground Handlers  /api/v1/admin/ground-handlers
// --------------------------------------------------------------------------
export const GroundHandlerAPI = {
  list:   (p?: ListParams)               => req<GroundHandler[]>(`/api/v1/admin/ground-handlers${buildQuery(p)}`),
  get:    (id: string)                   => req<GroundHandler>(`/api/v1/admin/ground-handlers/${id}`),
  create: (b: GroundHandlerCreate)       => req<GroundHandler>('/api/v1/admin/ground-handlers', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<GroundHandlerCreate>) => req<GroundHandler>(`/api/v1/admin/ground-handlers/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)                   => req<void>(`/api/v1/admin/ground-handlers/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// Delay Codes  /api/v1/admin/delay-codes
// --------------------------------------------------------------------------
export const DelayCodeAPI = {
  list:   (p?: ListParams)          => req<DelayCode[]>(`/api/v1/admin/delay-codes${buildQuery(p)}`),
  get:    (id: string)              => req<DelayCode>(`/api/v1/admin/delay-codes/${id}`),
  create: (b: DelayCodeCreate)      => req<DelayCode>('/api/v1/admin/delay-codes', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<DelayCodeCreate>) => req<DelayCode>(`/api/v1/admin/delay-codes/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)              => req<void>(`/api/v1/admin/delay-codes/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------------
// App Users  /api/v1/admin/users
// --------------------------------------------------------------------------
export const UserAPI = {
  list:   (p?: ListParams)          => req<AppUser[]>(`/api/v1/admin/users${buildQuery(p)}`),
  get:    (id: string)              => req<AppUser>(`/api/v1/admin/users/${id}`),
  create: (b: AppUserCreate)        => req<AppUser>('/api/v1/admin/users', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: Partial<AppUserCreate>) => req<AppUser>(`/api/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id: string)              => req<void>(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id: string, password: string) =>
    req<{ success: boolean }>(`/api/v1/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
};
