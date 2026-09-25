import React, { useState } from 'react';
import { useEcoShield } from '../context/EcoShieldContext';
import { TacticalMap } from '../components/Map/TacticalMap';
import { CriticalVictim } from '../types';
import { 
  Users, 
  MapPin, 
  Battery, 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  Truck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Radio, 
  Share2, 
  Compass, 
  PhoneCall, 
  Maximize2,
  RefreshCw
} from 'lucide-react';

export const RescueTeamScreen: React.FC = () => {
  const {
    criticalVictims,
    sensors,
    userLocation,
    updateVictimStatus,
    triggerPushNotification,
    setCurrentScreen
  } = useEcoShield();

  const [statusFilter, setStatusFilter] = useState<'TRAPPED' | 'EN_ROUTE' | 'RESCUED' | 'ALL'>('TRAPPED');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVictim, setSelectedVictim] = useState<CriticalVictim | null>(null);
  const [mapFocus, setMapFocus] = useState<{ lat: number; lon: number } | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Filtered victims
  const filteredVictims = criticalVictims
    .filter(v => {
      if (statusFilter === 'ALL') return true;
      return v.status === statusFilter;
    })
    .filter(v => {
      if (!searchQuery) return true;
      return (
        v.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.notes && v.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const trappedCount = criticalVictims.filter(v => v.status === 'TRAPPED').length;
  const enRouteCount = criticalVictims.filter(v => v.status === 'EN_ROUTE').length;
  const rescuedCount = criticalVictims.filter(v => v.status === 'RESCUED').length;

  const handleNavigateGoogleMaps = (victim: CriticalVictim) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${victim.lat},${victim.lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUpdateStatus = async (victimId: string, newStatus: 'TRAPPED' | 'RESCUED' | 'SAFE' | 'EN_ROUTE') => {
    setIsUpdatingId(victimId);
    await updateVictimStatus(victimId, newStatus, 'Rapid Triage Alpha');
    setIsUpdatingId(null);
  };

  const focusOnMap = (victim: CriticalVictim) => {
    setSelectedVictim(victim);
    setMapFocus({ lat: victim.lat, lon: victim.lon });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 select-none overflow-hidden">
      {/* Tactical Top Bar */}
      <div className="shrink-0 bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-white">
                Rescue Team Dispatch Command
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-600/50 animate-pulse">
                LIVE TRIAGE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Firestore Collection: <code className="text-amber-400">critical_victims</code>
            </p>
          </div>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('TRAPPED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              statusFilter === 'TRAPPED'
                ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.6)]'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span>TRAPPED ({trappedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('EN_ROUTE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              statusFilter === 'EN_ROUTE'
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <span>EN ROUTE ({enRouteCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('RESCUED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              statusFilter === 'RESCUED'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <span>RESCUED ({rescuedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content: Split Map & Triage List */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Map showing trapped victims with red pins */}
        <div className="h-64 lg:h-auto lg:flex-1 relative border-b lg:border-b-0 lg:border-r border-zinc-800">
          <TacticalMap
            sensors={sensors}
            victims={criticalVictims}
            userLocation={userLocation}
            showRedZones={true}
            focusTarget={mapFocus}
            onSelectVictim={(victim) => focusOnMap(victim)}
            className="h-full w-full"
          />

          {/* Map Overlay Badge */}
          <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-md border border-zinc-700 rounded-xl p-2.5 shadow-xl text-xs font-mono">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>{trappedCount} Trapped Victim Red Pins Displayed</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Click any pin to inspect GPS telemetry &amp; route Google Maps
            </div>
          </div>
        </div>

        {/* Right: Critical Victims Dispatch Queue */}
        <div className="flex-1 lg:w-[480px] lg:flex-none flex flex-col bg-zinc-950 overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search civilian ID, notes, or coordinates..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 px-2">
              {filteredVictims.length} Records
            </span>
          </div>

          {/* List of Victims */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredVictims.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-zinc-500">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2 opacity-70" />
                <p className="text-sm font-bold text-zinc-300">No {statusFilter} Records Found</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  {statusFilter === 'TRAPPED' 
                    ? 'No civilians currently registered in TRAPPED status. All perimeters cleared.' 
                    : 'Adjust filters or simulate an alert to generate distress beacons.'}
                </p>
              </div>
            ) : (
              filteredVictims.map((victim) => {
                const isTrapped = victim.status === 'TRAPPED';
                const isEnRoute = victim.status === 'EN_ROUTE';
                const isRescued = victim.status === 'RESCUED';

                return (
                  <div
                    key={victim.id}
                    onClick={() => focusOnMap(victim)}
                    className={`rounded-xl border p-3.5 transition cursor-pointer ${
                      selectedVictim?.id === victim.id
                        ? 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : isTrapped
                        ? 'border-red-900/60 bg-zinc-900/80 hover:border-red-500/60'
                        : isEnRoute
                        ? 'border-amber-900/60 bg-zinc-900/80 hover:border-amber-500/60'
                        : 'border-zinc-800 bg-zinc-900/40 opacity-75'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {isTrapped ? '🆘' : isEnRoute ? '🚑' : '✅'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {victim.userId}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                isTrapped
                                  ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                  : isEnRoute
                                  ? 'bg-amber-950 text-amber-300 border border-amber-600'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              }`}
                            >
                              {victim.status}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 block">
                            Doc ID: {victim.id}
                          </span>
                        </div>
                      </div>

                      {/* Battery Badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        victim.battery < 20 
                          ? 'bg-red-950 text-red-400 border border-red-700 animate-pulse' 
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        <Battery className="w-3.5 h-3.5" />
                        <span>{victim.battery}%</span>
                      </div>
                    </div>

                    {/* Metadata Coordinates & Telemetry */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg bg-black/50 text-[11px] font-mono text-zinc-300 border border-zinc-800/80">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{victim.lat.toFixed(4)}, {victim.lon.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>
                          {new Date(victim.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Trigger source / Notes */}
                    {victim.source && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-zinc-500 uppercase">Trigger:</span>
                        <span className="text-amber-400 font-bold bg-amber-950/60 px-1 rounded">
                          {victim.source === 'TIMER_EXPIRY_AUTO' ? '120s INACTIVITY PROTOCOL' : victim.source}
                        </span>
                      </div>
                    )}

                    {victim.notes && (
                      <p className="mt-2 text-xs text-zinc-400 italic bg-zinc-950/70 p-2 rounded border border-zinc-800/60">
                        "{victim.notes}"
                      </p>
                    )}

                    {victim.responderAssigned && (
                      <div className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Unit: {victim.responderAssigned}</span>
                      </div>
                    )}

                    {/* Action Bar: Navigate via Google Maps & Status Controls */}
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                      {/* Linking to Google Maps button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateGoogleMaps(victim);
                        }}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md"
                        title="Open directions in Google Maps via Linking"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Navigate Google Maps</span>
                      </button>

                      {/* Status transitions */}
                      {isTrapped && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(victim.id, 'EN_ROUTE');
                          }}
                          disabled={isUpdatingId === victim.id}
                          className="flex items-center gap-1 py-2 px-2.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs transition"
                          title="Mark unit en route"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {!isRescued && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(victim.id, 'RESCUED');
                          }}
                          disabled={isUpdatingId === victim.id}
                          className="flex items-center gap-1 py-2 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition"
                          title="Confirm victim rescued"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Rescued</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
