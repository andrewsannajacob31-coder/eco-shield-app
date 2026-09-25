import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps3D } from '../../services/googleMapsLoader';
import { Sensor, CriticalVictim, UserLocation } from '../../types';
import { 
  ShieldAlert, 
  MapPin, 
  Layers, 
  Radio, 
  Compass, 
  Crosshair, 
  ExternalLink,
  Flame,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Navigation
} from 'lucide-react';

interface GoogleTacticalMapProps {
  sensors: Sensor[];
  victims?: CriticalVictim[];
  userLocation: UserLocation;
  showRedZones?: boolean;
  filterType?: string;
  onSelectSensor?: (sensor: Sensor) => void;
  onSelectVictim?: (victim: CriticalVictim) => void;
  className?: string;
  focusTarget?: { lat: number; lon: number } | null;
  mapType?: 'tactical' | 'satellite' | 'hybrid' | 'terrain';
  titleBadge?: string;
}

// Ultra-clean high-contrast tactical dark style for Google Maps
const TACTICAL_DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#09090b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#09090b' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52525b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#131915' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3f6212' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#18181b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a1a1aa' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3f3f46' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f4f4f5' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#18181b' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#71717a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#030712' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3b82f6' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#030712' }],
  },
];

export const GoogleTacticalMap: React.FC<GoogleTacticalMapProps> = ({
  sensors,
  victims = [],
  userLocation,
  showRedZones = true,
  filterType = 'all',
  onSelectSensor,
  onSelectVictim,
  className = 'h-full w-full',
  focusTarget,
  mapType: initialMapType = 'tactical',
  titleBadge,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [activeMapType, setActiveMapType] = useState<'tactical' | 'satellite' | 'hybrid' | 'terrain'>(initialMapType);
  const [activeSensorCount, setActiveSensorCount] = useState<number>(0);
  const [activeTrappedCount, setActiveTrappedCount] = useState<number>(0);

  // Load Google Maps API
  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps3D().then((success) => {
      if (!isMounted) return;
      if (success && window.google?.maps) {
        setIsLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const google = window.google;

    const mapOptions: any = {
      center: { lat: userLocation.lat, lng: userLocation.lon },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: activeMapType === 'tactical' ? TACTICAL_DARK_MAP_STYLE : undefined,
      mapTypeId: activeMapType === 'tactical' ? 'roadmap' : activeMapType,
    };

    const map = new google.maps.Map(mapContainerRef.current, mapOptions);
    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow({
      maxWidth: 320,
    });
    setMapReady(true);
  }, [isLoaded]);

  // Handle map type changes (Tactical Dark vs Satellite vs Hybrid)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;

    if (activeMapType === 'tactical') {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: TACTICAL_DARK_MAP_STYLE });
    } else {
      map.setMapTypeId(activeMapType);
      map.setOptions({ styles: null });
    }
  }, [activeMapType]);

  // Focus target updates
  useEffect(() => {
    if (!mapInstanceRef.current || !focusTarget) return;
    mapInstanceRef.current.panTo({ lat: focusTarget.lat, lng: focusTarget.lon });
    mapInstanceRef.current.setZoom(15);
  }, [focusTarget]);

  // Center on user location changes when no explicit focusTarget
  useEffect(() => {
    if (!mapInstanceRef.current || focusTarget) return;
    mapInstanceRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lon });
  }, [userLocation.lat, userLocation.lon, focusTarget]);

  // Render Overlays: Red Zones, IoT Sensors, Civilian Beacon, and Rescue Victims
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const google = window.google;
    const map = mapInstanceRef.current;

    // Clean previous markers and circles
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    // Filter sensors
    const filteredSensors = filterType === 'all' 
      ? sensors 
      : sensors.filter((s) => s.type === filterType);
    setActiveSensorCount(filteredSensors.length);

    // 1. DYNAMIC RED HAZARD ZONES (>80% Risk)
    if (showRedZones) {
      sensors
        .filter((s) => s.risk > 80)
        .forEach((sensor) => {
          const radius = 950 + (sensor.risk - 80) * 40; // 950m to 1750m

          // Outer pulsing warning perimeter
          const outerCircle = new google.maps.Circle({
            strokeColor: '#ef4444',
            strokeOpacity: 0.85,
            strokeWeight: 2,
            fillColor: '#dc2626',
            fillOpacity: 0.22,
            map: map,
            center: { lat: sensor.lat, lng: sensor.lon },
            radius: radius,
            clickable: true,
          });

          // Inner high-density core
          const coreCircle = new google.maps.Circle({
            strokeColor: '#f87171',
            strokeOpacity: 0.95,
            strokeWeight: 1,
            fillColor: '#b91c1c',
            fillOpacity: 0.35,
            map: map,
            center: { lat: sensor.lat, lng: sensor.lon },
            radius: radius * 0.45,
            clickable: false,
          });

          outerCircle.addListener('click', (e: any) => {
            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(`
                <div style="background:#09090b; color:#f4f4f5; padding:10px; font-family:monospace; border-radius:8px; border:1px solid #ef4444;">
                  <div style="color:#ef4444; font-weight:bold; font-size:12px; margin-bottom:4px;">⚠️ RED HAZARD PERIMETER &gt;80%</div>
                  <div style="font-size:11px; color:#d4d4d8;">Sector: <strong>${sensor.zoneName}</strong></div>
                  <div style="font-size:11px; color:#fca5a5;">Current Risk: <strong>${sensor.risk}%</strong></div>
                  <div style="font-size:10px; color:#71717a; margin-top:4px;">Radius: ${(radius / 1000).toFixed(1)} km hazard boundary</div>
                </div>
              `);
              infoWindowRef.current.setPosition(e.latLng || { lat: sensor.lat, lng: sensor.lon });
              infoWindowRef.current.open(map);
            }
          });

          circlesRef.current.push(outerCircle, coreCircle);
        });
    }

    // 2. IOT SENSOR MARKERS (Custom Google Maps SVG Markers)
    filteredSensors.forEach((sensor) => {
      const isRedZone = sensor.risk > 80;
      const isWarning = sensor.risk > 50 && sensor.risk <= 80;

      const strokeColor = isRedZone ? '#f87171' : isWarning ? '#fbbf24' : '#34d399';
      const fillColor = isRedZone ? '#dc2626' : isWarning ? '#d97706' : '#059669';

      const sensorSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
          <defs>
            <filter id="glow-${sensor.id}" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${isRedZone ? '#ef4444' : '#10b981'}" flood-opacity="0.8"/>
            </filter>
          </defs>
          <path d="M19 0 C8.5 0 0 8.5 0 19 C0 29 19 46 19 46 C19 46 38 29 38 19 C38 8.5 29.5 0 19 0 Z" 
                fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" filter="url(#glow-${sensor.id})"/>
          <circle cx="19" cy="18" r="13" fill="#09090b" stroke="${strokeColor}" stroke-width="1.5"/>
          <text x="19" y="22" font-family="monospace" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">
            ${sensor.risk}%
          </text>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: { lat: sensor.lat, lng: sensor.lon },
        map: map,
        title: `${sensor.name} (${sensor.risk}% Risk)`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(sensorSvg)}`,
          scaledSize: new google.maps.Size(38, 46),
          anchor: new google.maps.Point(19, 46),
        },
      });

      marker.addListener('click', () => {
        if (onSelectSensor) onSelectSensor(sensor);

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="background:#09090b; color:#f4f4f5; padding:12px; font-family:sans-serif; min-width:220px; border-radius:10px; border:1px solid ${isRedZone ? '#ef4444' : '#27272a'};">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #27272a; padding-bottom:6px; margin-bottom:8px;">
                <span style="font-weight:bold; font-size:13px; color:${isRedZone ? '#f87171' : '#f4f4f5'};">${sensor.name}</span>
                <span style="background:${isRedZone ? '#991b1b' : '#27272a'}; color:${isRedZone ? '#fecaca' : '#34d399'}; font-family:monospace; font-weight:bold; font-size:11px; padding:2px 6px; border-radius:4px;">
                  ${sensor.risk}% RISK
                </span>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px; font-family:monospace; color:#a1a1aa;">
                <div>Sector: <strong style="color:#ffffff;">${sensor.zoneName}</strong></div>
                <div>Type: <strong style="color:#ffffff; text-transform:uppercase;">${sensor.type}</strong></div>
                <div>Temp: <strong style="color:#ffffff;">${sensor.temp}°C</strong></div>
                <div>Battery: <strong style="color:#34d399;">${sensor.battery}%</strong></div>
                ${sensor.smokeLevel ? `<div style="grid-column:span 2;">Smoke Level: <strong style="color:#fbbf24;">${sensor.smokeLevel} AQI</strong></div>` : ''}
              </div>
              ${isRedZone ? `
                <div style="margin-top:8px; padding:5px; background:rgba(220,38,38,0.2); border:1px solid #dc2626; border-radius:6px; font-size:10px; font-weight:bold; color:#fca5a5; text-align:center; text-transform:uppercase;">
                  ⚠️ CRITICAL RED ZONE ACTIVE
                </div>
              ` : ''}
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // 3. CIVILIAN USER BEACON WITH RADAR PULSE
    const userSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="9" fill="#06b6d4" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="18" cy="18" r="3" fill="#ffffff"/>
      </svg>
    `;

    const userMarker = new google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lon },
      map: map,
      title: 'Your Location (Civilian Position)',
      zIndex: 999,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(userSvg)}`,
        scaledSize: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 18),
      },
    });

    // User accuracy circle
    const userAccuracyCircle = new google.maps.Circle({
      strokeColor: '#06b6d4',
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: '#06b6d4',
      fillOpacity: 0.08,
      map: map,
      center: { lat: userLocation.lat, lng: userLocation.lon },
      radius: userLocation.accuracy * 2.5,
      clickable: false,
    });
    circlesRef.current.push(userAccuracyCircle);

    userMarker.addListener('click', () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div style="background:#09090b; color:#f4f4f5; padding:10px; font-family:sans-serif; border-radius:8px; border:1px solid #06b6d4;">
            <div style="color:#06b6d4; font-weight:bold; font-size:12px;">📍 CIVILIAN GPS POSITION</div>
            <div style="font-family:monospace; font-size:11px; margin-top:4px;">
              Coords: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}
            </div>
            <div style="font-family:monospace; font-size:11px; color:#34d399;">
              Battery: ${userLocation.battery}% &bull; Accuracy: ±${userLocation.accuracy}m
            </div>
          </div>
        `);
        infoWindowRef.current.open(map, userMarker);
      }
    });

    markersRef.current.push(userMarker);

    // 4. CRITICAL TRAPPED VICTIMS (Rescue Pins on Google Map)
    const trappedCount = victims.filter((v) => v.status === 'TRAPPED').length;
    setActiveTrappedCount(trappedCount);

    victims.forEach((victim) => {
      const isTrapped = victim.status === 'TRAPPED';
      const isEnRoute = victim.status === 'EN_ROUTE';

      const pinColor = isTrapped ? '#e11d48' : isEnRoute ? '#f59e0b' : '#059669';
      const badgeIcon = isTrapped ? '🆘' : isEnRoute ? '🚑' : '✓';

      const victimSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54">
          <defs>
            <filter id="distress-glow-${victim.id}" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${isTrapped ? '#e11d48' : '#f59e0b'}" flood-opacity="0.9"/>
            </filter>
          </defs>
          <path d="M22 0 C9.8 0 0 9.8 0 22 C0 34 22 54 22 54 C22 54 44 34 44 22 C44 9.8 34.2 0 22 0 Z" 
                fill="${pinColor}" stroke="#ffffff" stroke-width="2.5" filter="url(#distress-glow-${victim.id})"/>
          <circle cx="22" cy="20" r="14" fill="#09090b" stroke="#ffffff" stroke-width="1.5"/>
          <text x="22" y="25" font-size="13" text-anchor="middle">
            ${badgeIcon}
          </text>
        </svg>
      `;

      const victimMarker = new google.maps.Marker({
        position: { lat: victim.lat, lng: victim.lon },
        map: map,
        title: `CRITICAL DISTRESS: ${victim.userId} (${victim.status})`,
        zIndex: isTrapped ? 950 : 800,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(victimSvg)}`,
          scaledSize: new google.maps.Size(44, 54),
          anchor: new google.maps.Point(22, 54),
        },
      });

      const gmapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${victim.lat},${victim.lon}`;

      victimMarker.addListener('click', () => {
        if (onSelectVictim) onSelectVictim(victim);

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="background:#09090b; color:#f4f4f5; padding:12px; font-family:sans-serif; min-width:240px; border-radius:10px; border:2px solid ${isTrapped ? '#e11d48' : '#f59e0b'};">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #27272a; padding-bottom:6px; margin-bottom:8px;">
                <span style="font-weight:bold; font-size:13px; color:#f43f5e;">🆘 ${victim.userId}</span>
                <span style="background:${isTrapped ? '#881337' : '#78350f'}; color:${isTrapped ? '#fecdd3' : '#fef3c7'}; font-family:monospace; font-weight:bold; font-size:10px; padding:2px 6px; border-radius:4px;">
                  ${victim.status}
                </span>
              </div>
              <div style="font-family:monospace; font-size:11px; line-height:1.6; color:#d4d4d8;">
                <div>GPS: <strong>${victim.lat.toFixed(4)}, ${victim.lon.toFixed(4)}</strong></div>
                <div>Battery: <strong style="color:${victim.battery < 20 ? '#f87171' : '#34d399'};">${victim.battery}%</strong></div>
                <div>Time: <strong style="color:#a1a1aa;">${new Date(victim.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                ${victim.notes ? `<div style="margin-top:4px; font-style:italic; color:#a1a1aa; font-size:10px; background:#18181b; padding:4px 6px; border-radius:4px;">"${victim.notes}"</div>` : ''}
              </div>
              <a href="${gmapsNavUrl}" target="_blank" rel="noopener noreferrer" 
                 style="display:flex; align-items:center; justify-content:center; gap:6px; margin-top:10px; padding:8px 12px; background:#2563eb; color:#ffffff; font-weight:bold; font-size:11px; text-decoration:none; border-radius:6px; box-shadow:0 2px 8px rgba(37,99,235,0.4);">
                <span>🗺️ Navigate via Google Maps</span>
              </a>
            </div>
          `);
          infoWindowRef.current.open(map, victimMarker);
        }
      });

      markersRef.current.push(victimMarker);
    });

  }, [sensors, victims, userLocation, showRedZones, filterType, isLoaded, mapReady, onSelectSensor, onSelectVictim]);

  // Map Controls
  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  };

  const centerOnUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lon });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const centerOnRedZones = () => {
    const redSensors = sensors.filter((s) => s.risk > 80);
    if (redSensors.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: redSensors[0].lat, lng: redSensors[0].lon });
      mapInstanceRef.current.setZoom(14);
    }
  };

  return (
    <div className={`relative ${className} bg-zinc-950 overflow-hidden select-none`}>
      {/* Container where Google Map initializes */}
      <div ref={mapContainerRef} className="w-full h-full relative z-0" />

      {/* Loading state indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-white z-20">
          <div className="w-10 h-10 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
          <span className="font-mono text-xs text-zinc-300 tracking-wide uppercase">
            Loading Google Maps Platform &bull; Tactical Engine...
          </span>
        </div>
      )}

      {/* Top Left Status Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-black/85 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 shadow-2xl text-[11px] font-mono space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between text-zinc-400 font-bold pb-1 border-b border-zinc-800">
            <span className="flex items-center gap-1.5 text-white">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              {titleBadge || 'GOOGLE MAPS ENGINE'}
            </span>
            <span className="text-[10px] text-zinc-500">{activeSensorCount} Nodes</span>
          </div>

          <div className="flex items-center justify-between text-red-400 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              Red Zones (&gt;80%):
            </span>
            <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
              {sensors.filter((s) => s.risk > 80).length} Active
            </span>
          </div>

          {victims.length > 0 && (
            <div className="flex items-center justify-between text-rose-400 font-bold pt-1 border-t border-zinc-800/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce"></span>
                Trapped Victims:
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                {activeTrappedCount} TRAPPED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Tactical Layer & Camera Controls on Top-Right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer Mode Switcher: Tactical Dark vs Satellite vs Hybrid */}
        <div className="flex items-center p-1 bg-black/85 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xl text-xs font-mono">
          <button
            onClick={() => setActiveMapType('tactical')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              activeMapType === 'tactical' ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40' : 'text-zinc-400 hover:text-white'
            }`}
            title="Tactical Dark Mode"
          >
            Tactical
          </button>
          <button
            onClick={() => setActiveMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              activeMapType === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title="Google Satellite Imagery"
          >
            Satellite
          </button>
          <button
            onClick={() => setActiveMapType('hybrid')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              activeMapType === 'hybrid' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title="Google Hybrid Imagery"
          >
            Hybrid
          </button>
        </div>

        {/* Quick Map Action Buttons */}
        <div className="flex flex-col gap-1.5 self-end">
          <button
            onClick={centerOnUser}
            className="p-2.5 rounded-xl bg-black/85 hover:bg-zinc-850 text-cyan-400 border border-zinc-800 shadow-xl transition"
            title="Recenter on Civilian GPS Location"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={centerOnRedZones}
            className="p-2.5 rounded-xl bg-black/85 hover:bg-zinc-850 text-red-400 border border-zinc-800 shadow-xl transition"
            title="Focus on Active Red Hazard Zones"
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            onClick={zoomIn}
            className="p-2.5 rounded-xl bg-black/85 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 shadow-xl transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={zoomOut}
            className="p-2.5 rounded-xl bg-black/85 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 shadow-xl transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mandatory Google Maps Attribution Tag */}
      <div className="absolute bottom-2 left-4 z-10 pointer-events-none">
        <span className="text-[10px] font-mono text-zinc-400 bg-black/80 px-2 py-0.5 rounded border border-zinc-800 shadow">
          Google Maps
        </span>
      </div>
    </div>
  );
};
