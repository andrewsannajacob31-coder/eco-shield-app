import React, { useState } from 'react';
import { useEcoShield } from '../context/EcoShieldContext';
import { TacticalMap } from '../components/Map/TacticalMap';
import { Sensor } from '../types';
import { 
  Shield, 
  AlertTriangle, 
  Flame, 
  Droplets, 
  Activity, 
  Wind, 
  Battery, 
  Navigation, 
  Radio, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  Sliders, 
  Zap, 
  Crosshair, 
  Smartphone, 
  AlertOctagon,
  RefreshCw,
  Info
} from 'lucide-react';

export const HomeMapScreen: React.FC = () => {
  const {
    sensors,
    userLocation,
    criticalRedZonesCount,
    trappedVictimsCount,
    nearestHazardDistanceKm,
    simulateSensorFluctuation,
    triggerEmergencyAlertSimulation,
    updateUserLocation,
    refreshDeviceGPS,
    setCurrentScreen,
    isOnline
  } = useEcoShield();

  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState<boolean>(true);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [mapFocus, setMapFocus] = useState<{ lat: number; lon: number } | null>(null);

  const handleSensorClick = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setMapFocus({ lat: sensor.lat, lon: sensor.lon });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wildfire':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
      case 'flood':
        return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      case 'seismic':
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      case 'gas_leak':
        return <Wind className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-zinc-950 text-white select-none overflow-hidden">
      {/* Top Tactical Status Bar */}
      <div className="shrink-0 z-20 bg-zinc-900/90 border-b border-zinc-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 backdrop-blur-md">
        {/* Brand & Threat Level */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-white uppercase">
                EcoShield
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                v2.4 IoT Grid
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-zinc-400">Status:</span>
              {criticalRedZonesCount > 0 ? (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  {criticalRedZonesCount} RED ZONES (&gt;80% RISK)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">ALL PERIMETERS NORMAL</span>
              )}
            </div>
          </div>
        </div>

        {/* Hazard Metric & Action Controls */}
        <div className="flex items-center gap-2">
          {nearestHazardDistanceKm !== null && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-700/60 text-xs font-mono">
              <span className="text-zinc-400">Nearest Hazard:</span>
              <span className="text-red-300 font-bold">{nearestHazardDistanceKm.toFixed(1)} km</span>
            </div>
          )}

          {/* Quick Simulation Trigger for Alert Screen */}
          <button
            onClick={() => triggerEmergencyAlertSimulation(94, 1.1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400"
            title="Trigger an emergency document in collection alerts with risk >80 and within 3km"
          >
            <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Simulate Hazard Alert (Risk 94%)</span>
            <span className="sm:hidden">Trigger Alert</span>
          </button>

          {/* Location Selector */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700"
            title="Adjust GPS / civilian location"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">{userLocation.name || 'GPS'}</span>
          </button>
        </div>
      </div>

      {/* Main Map View */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <TacticalMap
          sensors={sensors}
          userLocation={userLocation}
          showRedZones={true}
          filterType={filterType}
          focusTarget={mapFocus}
          onSelectSensor={handleSensorClick}
          className="h-full w-full"
        />

        {/* Floating Quick Action / Legend Overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
          {/* Legend badge */}
          <div className="pointer-events-auto bg-black/85 backdrop-blur-md border border-zinc-700/80 rounded-xl p-2.5 shadow-2xl text-[11px] font-mono space-y-1.5 max-w-[210px]">
            <div className="flex items-center justify-between text-zinc-400 font-bold pb-1 border-b border-zinc-800">
              <span>IOT RISK MATRIX</span>
              <span className="text-[10px] text-zinc-500">{sensors.length} Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400 animate-pulse"></span>
              <span className="text-red-300 font-bold">&gt;80% Red Danger Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-400"></span>
              <span className="text-amber-300">51-80% Elevated Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400"></span>
              <span className="text-emerald-300">0-50% Normal</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
              <span className="w-3 h-3 rounded-full bg-cyan-400 border border-white"></span>
              <span className="text-cyan-300">Your Civilian Beacon</span>
            </div>
          </div>
        </div>

        {/* Filter Pill Buttons on top right */}
        <div className="absolute top-3 right-12 z-10 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-zinc-700 shadow-xl overflow-x-auto max-w-[calc(100vw-80px)]">
          {['all', 'wildfire', 'flood', 'seismic', 'gas_leak'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold transition flex items-center gap-1 shrink-0 ${
                filterType === type
                  ? 'bg-zinc-100 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {type !== 'all' && getTypeIcon(type)}
              <span>{type}</span>
            </button>
          ))}
        </div>

        {/* Bottom Sliding Telemetry Drawer */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-xl transition-all duration-300 shadow-2xl ${
            isTelemetryDrawerOpen ? 'max-h-72 sm:max-h-80' : 'max-h-11'
          }`}
        >
          {/* Drawer Header Toggle */}
          <div
            onClick={() => setIsTelemetryDrawerOpen(!isTelemetryDrawerOpen)}
            className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-800/70 transition"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-white">LIVE IOT SENSOR TELEMETRY</span>
              <span className="text-zinc-400">({sensors.length} Connected Probes)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                Click sensor to focus map &bull; Test spike to trigger red zone
              </span>
              <button className="text-zinc-400 hover:text-white p-1">
                {isTelemetryDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Drawer Content: Sensor Cards */}
          {isTelemetryDrawerOpen && (
            <div className="p-3 overflow-x-auto flex gap-3 h-60">
              {sensors.map((sensor) => {
                const isRed = sensor.risk > 80;
                const isWarning = sensor.risk > 50 && sensor.risk <= 80;

                return (
                  <div
                    key={sensor.id}
                    onClick={() => handleSensorClick(sensor)}
                    className={`min-w-[240px] max-w-[260px] shrink-0 p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      selectedSensor?.id === sensor.id
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : isRed
                        ? 'border-red-600/70 bg-red-950/30 hover:border-red-500'
                        : isWarning
                        ? 'border-amber-600/50 bg-amber-950/20 hover:border-amber-500'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* Sensor Header */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(sensor.type)}
                          <span className="font-bold text-xs text-white truncate max-w-[130px]">
                            {sensor.name}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                            isRed
                              ? 'bg-red-600 text-white animate-pulse'
                              : isWarning
                              ? 'bg-amber-600 text-black'
                              : 'bg-zinc-800 text-emerald-400'
                          }`}
                        >
                          {sensor.risk}% RISK
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-zinc-400 mt-1 truncate">
                        {sensor.zoneName}
                      </div>

                      {/* Risk Progress Bar */}
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isRed ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${sensor.risk}%` }}
                        />
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-zinc-300 mt-2.5">
                        <div>Temp: <span className="font-bold text-white">{sensor.temp}°C</span></div>
                        <div>Battery: <span className="font-bold text-white">{sensor.battery}%</span></div>
                        {sensor.smokeLevel && (
                          <div className="col-span-2 text-zinc-400">Smoke: <span className="text-amber-300">{sensor.smokeLevel} AQI</span></div>
                        )}
                      </div>
                    </div>

                    {/* Sensor Interactive Spike Controls */}
                    <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          simulateSensorFluctuation(sensor.id, isRed ? -25 : +30);
                        }}
                        className={`w-full py-1 px-2 rounded text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 ${
                          isRed
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            : 'bg-red-700/80 hover:bg-red-600 text-white'
                        }`}
                        title="Simulate sudden risk increase to test red zone creation"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{isRed ? 'De-escalate (-25%)' : 'Spike to Red Zone (+30%)'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Location / Coordinate Adjustment Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-md w-full shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">GPS Coordinate &amp; Sector Control</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Test alert proximity triggers (&lt; 3 km) by toggling your civilian GPS position relative to active hazard zones:
            </p>

            <div className="space-y-2.5 mt-4">
              <button
                onClick={() => {
                  updateUserLocation(47.6150, -122.3275, true);
                  setShowLocationModal(false);
                }}
                className="w-full text-left p-3 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-700/60 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-red-300">Move Inside Hazard Zone (Ridgecrest 1.1km)</span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">&lt; 3 KM DANGER</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-1">47.6150° N, -122.3275° W</div>
              </button>

              <button
                onClick={() => {
                  updateUserLocation(47.6062, -122.3321, true);
                  setShowLocationModal(false);
                }}
                className="w-full text-left p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-200">Move to Civilian Base (Moderate Proximity)</span>
                  <span className="text-[10px] font-mono text-zinc-400">1.8 KM</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-1">47.6062° N, -122.3321° W</div>
              </button>

              <button
                onClick={() => {
                  updateUserLocation(47.5300, -122.3100, true);
                  setShowLocationModal(false);
                }}
                className="w-full text-left p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/60 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-300">Move to Safe Sector Base</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">&gt; 8 KM SAFE</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-1">47.5300° N, -122.3100° W</div>
              </button>

              <button
                onClick={() => {
                  refreshDeviceGPS();
                  setShowLocationModal(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Fetch Live Real Device GPS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
