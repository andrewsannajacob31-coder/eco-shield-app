export interface Sensor {
  id: string;
  name: string;
  lat: number;
  lon: number;
  risk: number; // 0 - 100%
  type: 'wildfire' | 'flood' | 'seismic' | 'gas_leak' | 'landslide' | 'cyclone';
  status: 'normal' | 'warning' | 'critical';
  battery: number;
  temp: number;
  smokeLevel?: number;
  waterLevel?: number;
  seismicMagnitude?: number;
  lastUpdated: string;
  zoneName: string;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  risk: number; // >80 triggers emergency siren if <= 3km
  lat: number;
  lon: number;
  radiusKm: number;
  disasterType: 'wildfire' | 'flood' | 'seismic' | 'chemical' | 'storm';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  active: boolean;
  createdAt: string;
  distanceKm?: number;
}

export interface CriticalVictim {
  id: string;
  userId: string;
  lat: number;
  lon: number;
  battery: number;
  timestamp: string;
  status: 'TRAPPED' | 'RESCUED' | 'SAFE' | 'EN_ROUTE';
  notes?: string;
  source?: 'TIMER_EXPIRY_AUTO' | 'MANUAL_SOS' | 'OFFLINE_SMS_FALLBACK';
  distanceKm?: number;
  responderAssigned?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
  battery: number;
  isSimulated: boolean;
  name?: string;
}

// Distance calculation using Haversine formula in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}
