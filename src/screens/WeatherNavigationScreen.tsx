import React, { useState, useEffect } from 'react';
import { useEcoShield } from '../context/EcoShieldContext';
import { GoogleEarth3DView } from '../components/GoogleEarth/GoogleEarth3DView';
import { GoogleTacticalMap } from '../components/Map/GoogleTacticalMap';
import { 
  fetchCurrentWeather, 
  fetchHourlyForecast, 
  fetchWeatherAlerts, 
  CurrentWeatherResponse, 
  HourlyForecastInterval, 
  SevereWeatherAlert 
} from '../services/weatherService';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Eye, 
  Droplets, 
  Compass, 
  AlertTriangle, 
  Clock, 
  Globe, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  Flame,
  Layers,
  Sparkles,
  Map as MapIcon
} from 'lucide-react';

export const WeatherNavigationScreen: React.FC = () => {
  const { userLocation, sensors, criticalVictims, updateUserLocation } = useEcoShield();

  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherResponse | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastInterval[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<SevereWeatherAlert[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<'radar' | 'clouds' | 'wind' | 'temp'>('radar');
  const [selectedPresetLocation, setSelectedPresetLocation] = useState<string>('current');
  const [viewDimension, setViewDimension] = useState<'3d' | '2d'>('3d');

  // Load Weather Data
  const loadWeatherData = async (lat: number, lon: number) => {
    setIsLoadingWeather(true);
    try {
      const [current, hourly, alerts] = await Promise.all([
        fetchCurrentWeather(lat, lon),
        fetchHourlyForecast(lat, lon, 12),
        fetchWeatherAlerts(lat, lon),
      ]);
      setCurrentWeather(current);
      setHourlyForecast(hourly);
      setWeatherAlerts(alerts);
    } catch (err) {
      console.warn('Error loading weather data:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeatherData(userLocation.lat, userLocation.lon);
  }, [userLocation.lat, userLocation.lon]);

  // Preset disaster / weather zones for rapid navigation
  const presets = [
    { id: 'current', name: 'User Sector (Civilian)', lat: userLocation.lat, lon: userLocation.lon, desc: 'Current GPS tracking area' },
    { id: 'ridgecrest', name: 'Ridgecrest Fireline', lat: 47.6185, lon: -122.3250, desc: 'Active 88% Wildfire Red Zone' },
    { id: 'pinecanyon', name: 'Pine Canyon Thermal', lat: 47.6120, lon: -122.3410, desc: 'Severe Thermal Hazard Node' },
    { id: 'cedarbasin', name: 'Cedar River Spillway', lat: 47.5950, lon: -122.3210, desc: 'Hydrology Basin Drainage' },
    { id: 'california', name: 'Sierra Nevada Foothills', lat: 37.7749, lon: -122.4194, desc: 'Regional High Wind Corridors' },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPresetLocation(p.id);
    updateUserLocation(p.lat, p.lon, true);
    loadWeatherData(p.lat, p.lon);
  };

  const currentConditionDesc = currentWeather?.weatherCondition?.description?.text || 'Partly Cloudy';
  const tempDegrees = currentWeather?.temperature?.degrees !== undefined ? Math.round(currentWeather.temperature.degrees) : 18;
  const feelsLike = currentWeather?.feelsLikeTemperature?.degrees !== undefined ? Math.round(currentWeather.feelsLikeTemperature.degrees) : tempDegrees;
  const windSpeed = currentWeather?.wind?.speed?.value || 14;
  const windUnit = currentWeather?.wind?.speed?.unit === 'KILOMETERS_PER_HOUR' ? 'km/h' : 'mph';
  const windDir = currentWeather?.wind?.direction?.cardinal || 'SW';
  const humidity = currentWeather?.relativeHumidity !== undefined ? currentWeather.relativeHumidity : 76;
  const uv = currentWeather?.uvIndex !== undefined ? currentWeather.uvIndex : 3;
  const precipProb = currentWeather?.precipitation?.probability?.percent !== undefined ? currentWeather.precipitation.probability.percent : 15;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white select-none overflow-hidden font-sans">
      {/* Top Weather Header Banner */}
      <div className="shrink-0 bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-400/30">
            <Globe className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-white flex items-center gap-1.5">
                Google Earth 3D Weather Navigation
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-600/50">
                Maps 3D Hybrid
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Photorealistic 3D Globe with Google Maps Platform Weather API &bull; <span className="text-emerald-400 font-bold">Live Atmospheric Feed</span>
            </p>
          </div>
        </div>

        {/* Layer Selector, 2D/3D Dimension Switch & Refresh */}
        <div className="flex items-center gap-2">
          {/* 3D vs 2D View Dimension Toggle */}
          <div className="flex items-center p-0.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setViewDimension('3d')}
              className={`px-3 py-1.5 rounded-lg transition font-bold flex items-center gap-1.5 ${
                viewDimension === '3d'
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Photorealistic 3D Globe View"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Earth</span>
            </button>

            <button
              onClick={() => setViewDimension('2d')}
              className={`px-3 py-1.5 rounded-lg transition font-bold flex items-center gap-1.5 ${
                viewDimension === '2d'
                  ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tactical 2D Google Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Map</span>
            </button>
          </div>

          {/* Weather Layers */}
          <div className="hidden sm:flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setActiveLayer('radar')}
              className={`px-2.5 py-1 rounded-lg transition font-bold ${
                activeLayer === 'radar' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Radar
            </button>
            <button
              onClick={() => setActiveLayer('clouds')}
              className={`px-2.5 py-1 rounded-lg transition font-bold ${
                activeLayer === 'clouds' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Clouds
            </button>
            <button
              onClick={() => setActiveLayer('wind')}
              className={`px-2.5 py-1 rounded-lg transition font-bold ${
                activeLayer === 'wind' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Wind
            </button>
          </div>

          <button
            onClick={() => loadWeatherData(userLocation.lat, userLocation.lon)}
            disabled={isLoadingWeather}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
            title="Refresh Real-time Weather Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingWeather ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split Layout: 3D Earth Globe / 2D Google Map + Weather HUD Navigation Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: Viewport (Switchable between 3D Earth and 2D Google Map) */}
        <div className="flex-1 h-72 lg:h-auto relative border-b lg:border-b-0 lg:border-r border-zinc-800">
          {viewDimension === '3d' ? (
            <GoogleEarth3DView
              userLocation={userLocation}
              sensors={sensors}
              victims={criticalVictims}
              weatherOverlay={activeLayer}
              className="h-full w-full"
            />
          ) : (
            <GoogleTacticalMap
              sensors={sensors}
              victims={criticalVictims}
              userLocation={userLocation}
              showRedZones={true}
              titleBadge="GOOGLE MAP 2D TACTICAL"
              mapType="hybrid"
              className="h-full w-full"
            />
          )}

          {/* Preset Location Navigator floating pills */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-md pointer-events-none">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`pointer-events-auto px-2.5 py-1.5 rounded-xl text-xs font-mono transition border shadow-lg backdrop-blur-md flex items-center gap-1.5 ${
                  selectedPresetLocation === preset.id
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                    : 'bg-black/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <span>📍</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>

          {/* Mandatory Google Maps Attribution Footer on Map Viewport */}
          <div className="absolute bottom-2 right-4 z-20 pointer-events-none">
            <span className="text-[10px] font-mono text-zinc-400 bg-black/80 px-2 py-0.5 rounded border border-zinc-800 shadow">
              Google Maps
            </span>
          </div>
        </div>

        {/* Right / Bottom: Meteorological Telemetry & Navigation Drawer */}
        <div className="w-full lg:w-[440px] lg:shrink-0 flex flex-col bg-zinc-950 overflow-y-auto border-t lg:border-t-0 border-zinc-800">
          {/* Current Meteorological Conditions Card */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
              <span className="uppercase tracking-wider">Atmospheric Conditions</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Weather API Live
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                    {tempDegrees}°C
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Feels like {feelsLike}°C
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CloudSun className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-zinc-200">{currentConditionDesc}</span>
                </div>
              </div>

              {/* Wind Speed / Direction Compass Badge */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-center min-w-[90px]">
                <Compass className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="text-xs font-black font-mono text-white">{windSpeed} {windUnit}</span>
                <span className="text-[10px] font-mono text-zinc-400">{windDir} Vector</span>
              </div>
            </div>

            {/* Micro Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-black/40 border border-zinc-800/80">
                <div className="text-zinc-500 text-[10px]">HUMIDITY</div>
                <div className="font-bold text-white mt-0.5 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  {humidity}%
                </div>
              </div>

              <div className="p-2 rounded-xl bg-black/40 border border-zinc-800/80">
                <div className="text-zinc-500 text-[10px]">RAIN PROB</div>
                <div className="font-bold text-white mt-0.5 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                  {precipProb}%
                </div>
              </div>

              <div className="p-2 rounded-xl bg-black/40 border border-zinc-800/80">
                <div className="text-zinc-500 text-[10px]">UV INDEX</div>
                <div className="font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {uv} Mod
                </div>
              </div>
            </div>
          </div>

          {/* Severe Weather Alerts Section */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Active Meteorological Warnings
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                {weatherAlerts.length} Active
              </span>
            </div>

            {weatherAlerts.length === 0 ? (
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-mono flex items-center gap-2">
                <span className="text-emerald-400 text-base">✓</span>
                <span>No extreme public meteorological watches currently issued for this coordinate sector.</span>
              </div>
            ) : (
              weatherAlerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className="p-3 rounded-xl bg-red-950/40 border border-red-600/60 text-xs font-mono space-y-1 mb-2"
                >
                  <div className="flex items-center justify-between text-red-300 font-bold">
                    <span>{alert.alertTitle}</span>
                    <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[10px]">
                      {alert.severity || 'CRITICAL'}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {alert.instruction || alert.eventType}
                  </p>
                  {alert.dataSource && (
                    <div className="pt-1 text-[10px] text-zinc-400">
                      Authority:{' '}
                      <a
                        href={alert.dataSource.authorityUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline"
                      >
                        {alert.dataSource.name || alert.dataSource.publisher || 'National Weather Service'}
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 12-Hour Atmospheric Forecast Timeline */}
          <div className="p-4 border-b border-zinc-800 flex-1">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Hourly Tactical Forecast (12H)
              </span>
              <span className="text-[10px] text-zinc-400">Granular Timeline</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {hourlyForecast.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                  Loading hourly forecast intervals...
                </div>
              ) : (
                hourlyForecast.slice(0, 8).map((hour, idx) => {
                  const hourTime = new Date(hour.interval.startTime).toLocaleTimeString([], {
                    hour: 'numeric',
                    hour12: true,
                  });
                  const hourTemp = hour.temperature?.degrees !== undefined ? Math.round(hour.temperature.degrees) : '--';
                  const hourRain = hour.precipitation?.probability?.percent !== undefined ? hour.precipitation.probability.percent : 0;
                  const hourWind = hour.wind?.speed?.value ? Math.round(hour.wind.speed.value) : 10;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono hover:bg-zinc-900 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-[70px]">
                        <span className="text-zinc-400">{hourTime}</span>
                        <span className="font-bold text-white">{hourTemp}°C</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] truncate max-w-[140px]">
                        <CloudSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{hour.weatherCondition?.description?.text || 'Clear'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                        <span className={hourRain > 30 ? 'text-cyan-400 font-bold' : ''}>
                          💧 {hourRain}%
                        </span>
                        <span>
                          💨 {hourWind}kph
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mandatory Google Maps Attribution Footer Requirement */}
          <div className="p-3 bg-black/60 text-center border-t border-zinc-800/80">
            <p className="text-[11px] font-mono text-zinc-400">
              Data sourced from Google Maps Platform Weather API &amp; Photorealistic 3D Maps.
            </p>
            <p className="text-[11px] font-mono text-zinc-300 font-bold mt-0.5">
              Google Maps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
