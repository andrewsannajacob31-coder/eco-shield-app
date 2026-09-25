import React, { useState } from 'react';
import { useEcoShield } from '../context/EcoShieldContext';
import { GoogleTacticalMap } from '../components/Map/GoogleTacticalMap';
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
  Minimize2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X
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
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  
  // Floating triage tray state
  const [isTrayMinimized, setIsTrayMinimized] = useState<boolean>(false);
  const [isTrayExpanded, setIsTrayExpanded] = useState<boolean>(false);

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
    <div className="relative h-full w-full bg-zinc-950 text-zinc-100 select-none overflow-hidden flex flex-col">
      {/* Top Floating Command HUD Bar */}
      <div className="shrink-0 z-20 bg-zinc-900/90 border-b border-zinc-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-white">
                4. Rescue Team Command
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-600/50 animate-pulse">
                FULL SCREEN GOOGLE MAP
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Firestore Collection: <code className="text-amber-400">critical_victims</code>
            </p>
          </div>
        </div>

        {/* Map Engine & Status Filter Counters */}
        <div className="flex items-center gap-2">
          {/* Map Engine Selector */}
          <div className="flex items-center p-0.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setMapEngine('google')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 font-bold ${
                mapEngine === 'google' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Google Maps Platform Engine"
            >
              <span>Google Map</span>
            </button>
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 font-bold ${
                mapEngine === 'leaflet' 
                  ? 'bg-zinc-800 text-emerald-400 shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tactical Vector Map"
            >
              <span>Tactical OSM</span>
            </button>
          </div>

          <button
            onClick={() => {
              setStatusFilter('TRAPPED');
              setIsTrayMinimized(false);
            }}
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
            onClick={() => {
              setStatusFilter('EN_ROUTE');
              setIsTrayMinimized(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              statusFilter === 'EN_ROUTE'
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <span>EN ROUTE ({enRouteCount})</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter('RESCUED');
              setIsTrayMinimized(false);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              statusFilter === 'RESCUED'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <span>RESCUED ({rescuedCount})</span>
          </button>
        </div>
      </div>

      {/* FULL SCREEN MAP CONTAINER */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {mapEngine === 'google' ? (
          <GoogleTacticalMap
            sensors={sensors}
            victims={criticalVictims}
            userLocation={userLocation}
            showRedZones={true}
            focusTarget={mapFocus}
            onSelectVictim={(victim) => {
              focusOnMap(victim);
              setIsTrayMinimized(false);
            }}
            titleBadge="FULLSCREEN GOOGLE MAP"
            className="h-full w-full"
          />
        ) : (
          <TacticalMap
            sensors={sensors}
            victims={criticalVictims}
            userLocation={userLocation}
            showRedZones={true}
            focusTarget={mapFocus}
            onSelectVictim={(victim) => {
              focusOnMap(victim);
              setIsTrayMinimized(false);
            }}
            className="h-full w-full"
          />
        )}

        {/* FLOATING RESCUE TRIAGE DISPATCH TRAY (DRAGGABLE / COLLAPSIBLE) */}
        <div
          className={`absolute bottom-4 right-4 z-30 transition-all duration-300 flex flex-col ${
            isTrayMinimized
              ? 'w-auto'
              : isTrayExpanded
              ? 'w-full max-w-lg h-[82vh]'
              : 'w-full max-w-sm sm:max-w-md max-h-[500px] h-[58vh]'
          }`}
        >
          {isTrayMinimized ? (
            /* Minimized Floating Pill Button */
            <button
              onClick={() => setIsTrayMinimized(false)}
              className="p-3 bg-zinc-950/95 border-2 border-red-500 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono font-bold text-white flex items-center gap-2 hover:bg-zinc-900 transition animate-bounce"
            >
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span>Distress Queue: <strong>{trappedCount} Trapped</strong></span>
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            </button>
          ) : (
            /* Floating Glass Panel */
            <div className="flex-1 flex flex-col bg-zinc-950/95 border border-zinc-700/80 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
              {/* Tray Header */}
              <div className="p-3.5 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white font-mono flex items-center gap-1.5">
                      Floating Trapped Records
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600/50 text-[10px]">
                        {filteredVictims.length}
                      </span>
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      Live dispatch sync &bull; {statusFilter} filter
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsTrayExpanded(!isTrayExpanded)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title={isTrayExpanded ? 'Standardize Tray Size' : 'Expand Tray Size'}
                  >
                    {isTrayExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setIsTrayMinimized(true)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Minimize Tray to Floating Pill"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-2.5 bg-black/60 border-b border-zinc-800/80 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search civilian ID, GPS, or notes..."
                    className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Scrollable Victims List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filteredVictims.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4 text-zinc-500">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-1 opacity-70" />
                    <p className="text-xs font-bold text-zinc-300">No {statusFilter} Records Found</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      All civilian evacuation sectors are currently stabilized.
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
                        className={`rounded-2xl border p-3 transition cursor-pointer ${
                          selectedVictim?.id === victim.id
                            ? 'border-red-500 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                            : isTrapped
                            ? 'border-red-900/70 bg-zinc-900/90 hover:border-red-500/70'
                            : isEnRoute
                            ? 'border-amber-900/60 bg-zinc-900/90 hover:border-amber-500/60'
                            : 'border-zinc-800 bg-zinc-900/60 opacity-80'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {isTrapped ? '🆘' : isEnRoute ? '🚑' : '✅'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">
                                  {victim.userId}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
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
                              <span className="text-[9px] font-mono text-zinc-500 block">
                                {victim.id}
                              </span>
                            </div>
                          </div>

                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            victim.battery < 20 
                              ? 'bg-red-950 text-red-400 border border-red-700 animate-pulse' 
                              : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            <Battery className="w-3 h-3" />
                            <span>{victim.battery}%</span>
                          </div>
                        </div>

                        {/* Metadata Coordinates */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2 p-2 rounded-xl bg-black/60 text-[10px] font-mono text-zinc-300 border border-zinc-800/80">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>{victim.lat.toFixed(4)}, {victim.lon.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>
                              {new Date(victim.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {victim.notes && (
                          <p className="mt-1.5 text-[11px] text-zinc-400 italic bg-zinc-950/70 p-1.5 rounded-lg border border-zinc-850">
                            "{victim.notes}"
                          </p>
                        )}

                        {/* Quick Action Navigation & Dispatch */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateGoogleMaps(victim);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition shadow"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Google Maps</span>
                          </button>

                          {isTrapped && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(victim.id, 'EN_ROUTE');
                              }}
                              disabled={isUpdatingId === victim.id}
                              className="py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition"
                            >
                              Dispatch
                            </button>
                          )}

                          {!isRescued && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(victim.id, 'RESCUED');
                              }}
                              disabled={isUpdatingId === victim.id}
                              className="py-1.5 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition"
                            >
                              Rescued
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
