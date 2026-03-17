// ============================================================================
// AODB Admin — Master Data TypeScript Types
// Aligned with PostgreSQL schema aodb.*
// ============================================================================

// --- Shared ------------------------------------------------------------------
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

// --- Tenant ------------------------------------------------------------------
export interface Tenant {
  tenant_id: string;
  code: string;
  name: string;
  airport_icao?: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TenantCreate = Omit<Tenant, 'tenant_id' | 'created_at' | 'updated_at'>;

// --- Country -----------------------------------------------------------------
export interface Country {
  country_id: string;
  iso2: string;
  iso3: string;
  name: string;
  region?: string;
  metadata: Record<string, unknown>;
}

// --- Airline -----------------------------------------------------------------
export type AirlineType = 'FULL_SERVICE' | 'LOW_COST' | 'CHARTER' | 'CARGO' | 'REGIONAL' | 'PRIVATE';

export interface Airline {
  airline_id: string;
  tenant_id: string;
  iata_code?: string;
  icao_code?: string;
  name: string;
  callsign?: string;
  country_id?: string;
  country_name?: string;    // joined
  airline_type?: AirlineType;
  alliance?: string;
  terminal_pref?: string;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AirlineCreate = Omit<Airline, 'airline_id' | 'country_name' | 'created_at' | 'updated_at'>;

// --- Airport -----------------------------------------------------------------
export type AirportType = 'INTERNATIONAL' | 'DOMESTIC' | 'REGIONAL' | 'MILITARY' | 'PRIVATE';

export interface Airport {
  airport_id: string;
  tenant_id?: string;
  iata_code?: string;
  icao_code?: string;
  name: string;
  country_id?: string;
  country_name?: string;   // joined
  city_id?: string;
  tz: string;
  latitude?: number;
  longitude?: number;
  elevation_ft?: number;
  apt_type?: AirportType;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AirportCreate = Omit<Airport, 'airport_id' | 'country_name' | 'created_at' | 'updated_at'>;

// --- Aircraft Type -----------------------------------------------------------
export type BodyType = 'NARROW' | 'WIDE' | 'REGIONAL' | 'TURBOPROP' | 'HELICOPTER' | 'CARGO';
export type WakeCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface AircraftType {
  aircraft_type_id: string;
  iata_code: string;
  icao_code?: string;
  name: string;
  manufacturer?: string;
  body_type?: BodyType;
  wingspan_m?: number;
  length_m?: number;
  height_m?: number;
  max_seats?: number;
  mtow_kg?: number;
  noise_chapter?: string;
  wake_category?: WakeCategory;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AircraftTypeCreate = Omit<AircraftType, 'aircraft_type_id' | 'created_at' | 'updated_at'>;

// --- Terminal ----------------------------------------------------------------
export interface Terminal {
  terminal_id: string;
  tenant_id: string;
  airport_id: string;
  airport_name?: string;   // joined
  code: string;
  name?: string;
  pax_capacity?: number;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TerminalCreate = Omit<Terminal, 'terminal_id' | 'airport_name' | 'created_at' | 'updated_at'>;

// --- Gate --------------------------------------------------------------------
export type GateType = 'PASSENGER' | 'CARGO' | 'VIP' | 'CIP';

export interface Gate {
  gate_id: string;
  tenant_id: string;
  airport_id: string;
  terminal_id?: string;
  terminal_code?: string;  // joined
  code: string;
  gate_type?: GateType;
  is_common_use: boolean;
  pax_capacity?: number;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type GateCreate = Omit<Gate, 'gate_id' | 'terminal_code' | 'created_at' | 'updated_at'>;

// --- Stand -------------------------------------------------------------------
export type StandType = 'CONTACT' | 'REMOTE' | 'CARGO' | 'DEICING' | 'MAINTENANCE';

export interface Stand {
  stand_id: string;
  tenant_id: string;
  airport_id: string;
  terminal_id?: string;
  terminal_code?: string;  // joined
  code: string;
  stand_type?: StandType;
  max_wingspan_m?: number;
  max_length_m?: number;
  max_acft_cat?: WakeCategory;
  tow_required: boolean;
  has_jetway: boolean;
  has_gpu: boolean;
  has_pca: boolean;
  pax_capacity?: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type StandCreate = Omit<Stand, 'stand_id' | 'terminal_code' | 'created_at' | 'updated_at'>;

// --- Runway ------------------------------------------------------------------
export interface Runway {
  runway_id: string;
  airport_id: string;
  designator: string;
  reciprocal?: string;
  length_m?: number;
  width_m?: number;
  surface?: string;
  pcn?: string;
  ils_category?: string;
  true_bearing?: number;
  elevation_ft?: number;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type RunwayCreate = Omit<Runway, 'runway_id' | 'created_at' | 'updated_at'>;

// --- Belt --------------------------------------------------------------------
export type BeltType = 'ARRIVALS' | 'OVERSIZED' | 'DEPARTURES' | 'TRANSFER';

export interface Belt {
  belt_id: string;
  tenant_id: string;
  airport_id: string;
  terminal_id?: string;
  terminal_code?: string;  // joined
  code: string;
  belt_type?: BeltType;
  max_weight_kg?: number;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type BeltCreate = Omit<Belt, 'belt_id' | 'terminal_code' | 'created_at' | 'updated_at'>;

// --- Checkin Desk ------------------------------------------------------------
export type DeskType = 'STANDARD' | 'SELF_SERVICE' | 'PREMIUM' | 'OVERSIZED';

export interface CheckinDesk {
  desk_id: string;
  tenant_id: string;
  airport_id: string;
  terminal_id?: string;
  terminal_code?: string;  // joined
  code: string;
  desk_type?: DeskType;
  is_common_use: boolean;
  is_active: boolean;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CheckinDeskCreate = Omit<CheckinDesk, 'desk_id' | 'terminal_code' | 'created_at' | 'updated_at'>;

// --- Ground Handler ----------------------------------------------------------
export interface GroundHandler {
  handler_id: string;
  tenant_id: string;
  name: string;
  iata_code?: string;
  contact_json: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type GroundHandlerCreate = Omit<GroundHandler, 'handler_id' | 'created_at' | 'updated_at'>;

// --- Delay Code --------------------------------------------------------------
export interface DelayCode {
  delay_code_id: string;
  tenant_id: string;
  code: string;
  description: string;
  category?: string;
  responsible?: string;
  is_iata: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DelayCodeCreate = Omit<DelayCode, 'delay_code_id' | 'created_at' | 'updated_at'>;

// --- App User ----------------------------------------------------------------
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'VIEWER' | 'API';

export interface AppUser {
  user_id: string;
  tenant_id: string;
  org_id?: string;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AppUserCreate = Omit<AppUser, 'user_id' | 'last_login_at' | 'created_at' | 'updated_at'> & {
  password?: string;
};
