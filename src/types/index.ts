// ============================================================
// WebLogistica — Shared TypeScript Types
// ============================================================

// ── Address ─────────────────────────────────────────────────
export interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string; // ISO 3166-1 alpha-2
  phone?: string;
  email?: string;
}

// ── Parcel / Dimensions ─────────────────────────────────────
export interface ParcelDimensions {
  weight: number;   // kg
  length: number;   // cm
  width: number;    // cm
  height: number;   // cm
}

export interface ParcelWithVolumetric extends ParcelDimensions {
  volumetricWeight: number; // kg (L*W*H / 5000)
  billableWeight: number;   // max(weight, volumetricWeight)
}

// ── Quote Request ───────────────────────────────────────────
export interface QuoteRequest {
  originPostalCode: string;
  originCountry: string;
  destinationPostalCode: string;
  destinationCountry: string;
  weight: number;
  length: number;
  width: number;
  height: number;
}

// ── Carrier Rate (normalized across all carriers) ───────────
export type CarrierProvider = 'shippo' | 'packlink' | 'genei';

export interface CarrierRate {
  id: string;
  provider: CarrierProvider;
  carrierName: string;       // "DHL Express", "SEUR", etc.
  serviceName: string;       // "Express Domestic", etc.
  estimatedDays: number;
  costPrice: number;         // EUR (what we pay the carrier)
  finalPrice: number;        // EUR (what the user pays)
  currency: string;          // "EUR"
  logoUrl?: string;
}

// ── Carrier Adapter Interface ───────────────────────────────
export interface CarrierAdapter {
  provider: CarrierProvider;
  getRates(params: {
    origin: { postalCode: string; country: string };
    destination: { postalCode: string; country: string };
    parcel: ParcelWithVolumetric;
  }): Promise<CarrierRate[]>;
}

// ── Shipment (DB row) ───────────────────────────────────────
export type ShipmentStatus =
  | 'quoted'
  | 'paid'
  | 'label_created'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Shipment {
  id: string;
  tracking_number: string | null;
  origin_data: Address;
  destination_data: Address;
  dimensions: ParcelWithVolumetric;
  status: ShipmentStatus;
  api_provider: CarrierProvider | null;
  carrier_name: string | null;
  service_name: string | null;
  cost_price: number | null;
  final_price: number | null;
  label_url: string | null;
  stripe_payment_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ── Subdomain Config ────────────────────────────────────────
export interface SubdomainTheme {
  primaryColor?: string;
  heroText?: string;
  heroSubtext?: string;
  backgroundGradient?: string;
  logoUrl?: string;
}

export interface CustomsField {
  field: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

export interface SubdomainConfig {
  id: string;
  name: string;
  display_name: string;
  theme_config: SubdomainTheme;
  specific_markup: number;
  customs_fields: CustomsField[];
  active: boolean;
}

// ── Rate Results (for UI) ───────────────────────────────────
export interface RateResultsData {
  rates: CarrierRate[];
  cheapest?: CarrierRate;
  fastest?: CarrierRate;
  parcel: ParcelWithVolumetric;
  errors: string[]; // carrier errors (non-fatal)
  searchParams: {
    origin: { postalCode: string; country: string };
    destination: { postalCode: string; country: string };
    parcel: ParcelWithVolumetric;
  };
}
