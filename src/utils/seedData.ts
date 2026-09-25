import { Sensor, EmergencyAlert, CriticalVictim } from '../types';

// Default center: Pacific Northwest wildland-urban interface (e.g., Cascade Ridge / Foothills)
export const DEFAULT_COORDS = {
  lat: 47.6062,
  lon: -122.3321, // Seattle / Eastside foothills
};

export const INITIAL_SENSORS: Sensor[] = [
  {
    id: 'sensor-rf-01',
    name: 'Ridgecrest Sierra Tower #1',
    lat: 47.6185,
    lon: -122.3250,
    risk: 88, // >80% RED ZONE
    type: 'wildfire',
    status: 'critical',
    battery: 92,
    temp: 48.5,
    smokeLevel: 310,
    lastUpdated: '1 min ago',
    zoneName: 'North Ridge Sector 4'
  },
  {
    id: 'sensor-rf-02',
    name: 'Pine Canyon Thermal Node',
    lat: 47.6120,
    lon: -122.3410,
    risk: 84, // >80% RED ZONE
    type: 'wildfire',
    status: 'critical',
    battery: 78,
    temp: 46.2,
    smokeLevel: 285,
    lastUpdated: 'Just now',
    zoneName: 'Pine Canyon Gulch'
  },
  {
    id: 'sensor-rf-03',
    name: 'Cedar Creek Hydrology Probe',
    lat: 47.5950,
    lon: -122.3210,
    risk: 42,
    type: 'flood',
    status: 'normal',
    battery: 95,
    temp: 18.2,
    waterLevel: 1.4,
    lastUpdated: '3 mins ago',
    zoneName: 'Cedar Basin Spillway'
  },
  {
    id: 'sensor-rf-04',
    name: 'East Mesa Seismic Geophone',
    lat: 47.6250,
    lon: -122.3100,
    risk: 28,
    type: 'seismic',
    status: 'normal',
    battery: 88,
    temp: 21.0,
    seismicMagnitude: 1.2,
    lastUpdated: '4 mins ago',
    zoneName: 'East Fault Escarpment'
  },
  {
    id: 'sensor-rf-05',
    name: 'Industrial Corridor Gas Detector',
    lat: 47.5880,
    lon: -122.3500,
    risk: 65,
    type: 'gas_leak',
    status: 'warning',
    battery: 64,
    temp: 24.3,
    smokeLevel: 110,
    lastUpdated: '2 mins ago',
    zoneName: 'Depot Substation'
  },
  {
    id: 'sensor-rf-06',
    name: 'Summit Lookout Weather Station',
    lat: 47.6320,
    lon: -122.3480,
    risk: 91, // >80% RED ZONE
    type: 'wildfire',
    status: 'critical',
    battery: 85,
    temp: 52.1,
    smokeLevel: 395,
    lastUpdated: '30s ago',
    zoneName: 'High Summit Crest'
  }
];

export const INITIAL_ALERTS: EmergencyAlert[] = [
  {
    id: 'alert-wildfire-88',
    title: 'Extreme Wildfire Flashover Warning',
    description: 'High wind velocity causing rapid thermal spread. Ambient temperature >48°C. Immediate shelter-in-place or evacuation required.',
    risk: 92, // >80 risk
    lat: 47.6150,
    lon: -122.3280, // ~1.1 km from default user location
    radiusKm: 2.8,
    disasterType: 'wildfire',
    severity: 'critical',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'alert-flash-flood-45',
    title: 'Lowland Runoff Advisory',
    description: 'Moderate precipitation overflow in lower creek basin.',
    risk: 45,
    lat: 47.5750,
    lon: -122.3100,
    radiusKm: 1.5,
    disasterType: 'flood',
    severity: 'moderate',
    active: true,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const INITIAL_CRITICAL_VICTIMS: CriticalVictim[] = [
  {
    id: 'victim-01',
    userId: 'user_civilian_9921',
    lat: 47.6165,
    lon: -122.3260,
    battery: 18,
    timestamp: new Date(Date.now() - 420000).toISOString(),
    status: 'TRAPPED',
    notes: 'Structure compromised by wildfire smoke, zero visibility, timer expired.',
    source: 'TIMER_EXPIRY_AUTO',
    distanceKm: 1.2
  },
  {
    id: 'victim-02',
    userId: 'user_civilian_4102',
    lat: 47.6110,
    lon: -122.3430,
    battery: 34,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    status: 'TRAPPED',
    notes: 'Vehicular road blockage on Pine Canyon Rd. Medical assistance needed.',
    source: 'MANUAL_SOS',
    distanceKm: 1.8
  },
  {
    id: 'victim-03',
    userId: 'user_civilian_1150',
    lat: 47.5920,
    lon: -122.3380,
    battery: 72,
    timestamp: new Date(Date.now() - 2500000).toISOString(),
    status: 'EN_ROUTE',
    notes: 'Rescue Unit Bravo assigned. ETA 4 mins.',
    source: 'MANUAL_SOS',
    distanceKm: 2.1,
    responderAssigned: 'Unit Echo-4'
  }
];
