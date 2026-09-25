import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Sensor, CriticalVictim, UserLocation } from '../../types';

interface TacticalMapProps {
  sensors: Sensor[];
  victims?: CriticalVictim[];
  userLocation: UserLocation;
  showRedZones?: boolean;
  filterType?: string;
  onSelectSensor?: (sensor: Sensor) => void;
  onSelectVictim?: (victim: CriticalVictim) => void;
  className?: string;
  focusTarget?: { lat: number; lon: number } | null;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  sensors,
  victims = [],
  userLocation,
  showRedZones = true,
  filterType = 'all',
  onSelectSensor,
  onSelectVictim,
  className = 'h-full w-full',
  focusTarget,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lon],
      zoom: 14,
      zoomControl: false,
    });

    // Dark tactical CartoDB tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when focusTarget changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (focusTarget) {
      mapInstanceRef.current.flyTo([focusTarget.lat, focusTarget.lon], 15, { duration: 1.2 });
    }
  }, [focusTarget]);

  // Render Markers, Red Zones, User Beacon, and Victims
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Red Hazard Zones (>80% Risk)
    if (showRedZones) {
      sensors
        .filter(s => s.risk > 80)
        .forEach(sensor => {
          // Circle hazard zone
          const dangerRadius = 900 + (sensor.risk - 80) * 35; // 900m to 1600m
          const dangerCircle = L.circle([sensor.lat, sensor.lon], {
            color: '#ef4444',
            weight: 2,
            opacity: 0.85,
            fillColor: '#dc2626',
            fillOpacity: 0.22,
            dashArray: '6, 8',
          });

          dangerCircle.bindTooltip(
            `<div class="text-xs font-mono font-bold text-red-400 bg-black/90 p-1 rounded border border-red-500/40">
              ⚠️ RED ZONE: ${sensor.zoneName} (${sensor.risk}% RISK)
            </div>`,
            { sticky: true, className: 'tactical-tooltip' }
          );

          dangerCircle.addTo(layerGroup);
        });
    }

    // 2. IoT Sensor Markers
    const filteredSensors = filterType === 'all' 
      ? sensors 
      : sensors.filter(s => s.type === filterType);

    filteredSensors.forEach(sensor => {
      const isRedZone = sensor.risk > 80;
      const isWarning = sensor.risk > 50 && sensor.risk <= 80;

      const bgColor = isRedZone 
        ? 'bg-red-600 border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.9)] animate-pulse' 
        : isWarning 
        ? 'bg-amber-600 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]' 
        : 'bg-emerald-600 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]';

      const iconHtml = `
        <div class="relative group cursor-pointer">
          ${isRedZone ? '<div class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></div>' : ''}
          <div class="relative w-8 h-8 rounded-full border-2 ${bgColor} flex items-center justify-center text-white text-[11px] font-black tracking-tighter transition-transform hover:scale-125">
            ${sensor.risk}%
          </div>
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-[10px] text-zinc-300 px-1 py-0.5 rounded border border-zinc-700 pointer-events-none opacity-80 group-hover:opacity-100">
            ${sensor.name.split(' ')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-sensor-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([sensor.lat, sensor.lon], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectSensor) onSelectSensor(sensor);
      });

      // Quick hover popup
      marker.bindPopup(`
        <div class="p-2 min-w-[200px] text-zinc-100 font-sans">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-zinc-700">
            <span class="font-bold text-xs ${isRedZone ? 'text-red-400' : 'text-zinc-200'}">${sensor.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isRedZone ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-zinc-800 text-zinc-300'}">
              ${sensor.risk}% RISK
            </span>
          </div>
          <div class="grid grid-cols-2 gap-1 text-[11px] text-zinc-400 mt-1">
            <div>Type: <span class="text-zinc-200 uppercase font-semibold">${sensor.type}</span></div>
            <div>Temp: <span class="text-zinc-200 font-semibold">${sensor.temp}°C</span></div>
            <div>Battery: <span class="text-zinc-200">${sensor.battery}%</span></div>
            <div>Sector: <span class="text-zinc-200 truncate">${sensor.zoneName}</span></div>
          </div>
          ${isRedZone ? '<div class="mt-2 text-center py-1 bg-red-950/70 border border-red-600/60 rounded text-[10px] text-red-300 font-bold uppercase tracking-wider">⚠️ Critical Hazard Zone</div>' : ''}
        </div>
      `, {
        className: 'tactical-popup',
      });

      marker.addTo(layerGroup);
    });

    // 3. User Location Beacon
    const userBeaconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 rounded-full bg-cyan-500/20 animate-ping"></div>
        <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30"></div>
        <div class="relative w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_15px_#06b6d4] flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <div class="absolute -bottom-5 whitespace-nowrap bg-cyan-950/90 text-cyan-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-500/50 shadow">
          YOU (CIVILIAN)
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userBeaconHtml,
      className: 'user-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon, zIndexOffset: 1000 });
    userMarker.bindTooltip('Your GPS Location (Civilian Position)', { permanent: false, direction: 'top' });
    userMarker.addTo(layerGroup);

    // Accuracy Circle
    L.circle([userLocation.lat, userLocation.lon], {
      radius: userLocation.accuracy * 2.5,
      color: '#06b6d4',
      weight: 1,
      opacity: 0.4,
      fillColor: '#06b6d4',
      fillOpacity: 0.08,
    }).addTo(layerGroup);

    // 4. Critical Trapped Victims (Rescue Pins)
    victims.forEach(victim => {
      const isTrapped = victim.status === 'TRAPPED';
      const isEnRoute = victim.status === 'EN_ROUTE';
      const isRescued = victim.status === 'RESCUED';

      const pinColor = isTrapped 
        ? 'bg-rose-600 border-white text-white shadow-[0_0_20px_#e11d48] animate-bounce' 
        : isEnRoute 
        ? 'bg-amber-500 border-white text-white shadow-[0_0_15px_#f59e0b]' 
        : 'bg-emerald-600 border-white text-white opacity-80';

      const victimHtml = `
        <div class="relative group cursor-pointer">
          ${isTrapped ? '<div class="absolute -inset-3 rounded-full bg-red-600/40 animate-ping"></div>' : ''}
          <div class="w-9 h-9 rounded-full border-2 ${pinColor} flex flex-col items-center justify-center font-black">
            <span class="text-[12px] leading-none">${isTrapped ? '🆘' : isEnRoute ? '🚑' : '✅'}</span>
            <span class="text-[8px] font-mono leading-none tracking-tight">${victim.battery}%</span>
          </div>
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-950/95 text-red-200 text-[9px] font-mono font-bold px-1 rounded border border-red-500/60 shadow">
            ${victim.status}
          </div>
        </div>
      `;

      const victimIcon = L.divIcon({
        html: victimHtml,
        className: 'critical-victim-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const victimMarker = L.marker([victim.lat, victim.lon], { icon: victimIcon, zIndexOffset: 900 });

      victimMarker.on('click', () => {
        if (onSelectVictim) onSelectVictim(victim);
      });

      // Navigate link for Google Maps
      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${victim.lat},${victim.lon}`;

      victimMarker.bindPopup(`
        <div class="p-2 min-w-[220px] text-zinc-100 font-sans">
          <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-700">
            <span class="font-bold text-xs text-rose-400">DISTRESS: ${victim.userId}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${isTrapped ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-zinc-800 text-zinc-300'}">
              ${victim.status}
            </span>
          </div>
          <div class="space-y-1 text-[11px] text-zinc-300">
            <div>Coords: <span class="font-mono text-zinc-200">${victim.lat.toFixed(4)}, ${victim.lon.toFixed(4)}</span></div>
            <div>Phone Battery: <span class="font-bold ${victim.battery < 20 ? 'text-red-400' : 'text-emerald-400'}">${victim.battery}%</span></div>
            <div>Trigger: <span class="text-zinc-400">${victim.source || 'EMERGENCY BEACON'}</span></div>
            ${victim.notes ? `<div class="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400 text-[10px] mt-1 italic">"${victim.notes}"</div>` : ''}
          </div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" 
             class="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition shadow">
            <span>🗺️</span>
            <span>Navigate in Google Maps</span>
          </a>
        </div>
      `, {
        className: 'tactical-popup',
      });

      victimMarker.addTo(layerGroup);
    });

  }, [sensors, victims, userLocation, showRedZones, filterType, onSelectSensor, onSelectVictim]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full bg-zinc-950 z-0" />
    </div>
  );
};
