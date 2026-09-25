import React, { useState } from 'react';
import { EcoShieldProvider, useEcoShield } from './context/EcoShieldContext';
import { HomeMapScreen } from './screens/HomeMapScreen';
import { AlertScreen } from './screens/AlertScreen';
import { RescueTeamScreen } from './screens/RescueTeamScreen';
import { NotificationBanner } from './components/Notifications/NotificationBanner';
import { 
  Map, 
  AlertTriangle, 
  Users, 
  Smartphone, 
  Monitor, 
  Radio, 
  Flame, 
  Volume2, 
  VolumeX, 
  Battery, 
  Wifi, 
  WifiOff,
  Bell,
  Sparkles,
  Info
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    isMobileDeviceView,
    setIsMobileDeviceView,
    userStatus,
    activeEmergencyAlert,
    trappedVictimsCount,
    criticalRedZonesCount,
    userLocation,
    isAlarmPlaying,
    isAlarmMuted,
    toggleAlarmMute,
    triggerEmergencyAlertSimulation,
    isOnline,
    triggerPushNotification
  } = useEcoShield();

  const [showSimInfo, setShowSimInfo] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col antialiased selection:bg-red-500 selection:text-white">
      {/* Expo Push Notification Toast Simulator */}
      <NotificationBanner />

      {/* Global Top Command Header */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <span className="font-black text-sm tracking-wider uppercase text-white font-mono">
              EcoShield<span className="text-red-500">.OS</span>
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
            Expo React Native &bull; Firebase Firestore &bull; IoT Grid
          </span>
        </div>

        {/* Global Controls: Device View Toggle & Quick Simulator Trigger */}
        <div className="flex items-center gap-2">
          {/* Quick simulation helper */}
          <button
            onClick={() => triggerEmergencyAlertSimulation(92, 1.2)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-700/80 text-xs font-mono font-bold transition shadow"
            title="Simulate hazardous alert with risk > 80% and distance < 3 km to trigger full-screen alarm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="hidden md:inline">Test Alert Flow (Risk &gt;80%)</span>
            <span className="md:hidden">Test Alert</span>
          </button>

          {/* Sound Mute/Unmute if alarm active */}
          {isAlarmPlaying && (
            <button
              onClick={toggleAlarmMute}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 ${
                isAlarmMuted 
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                  : 'bg-red-600 text-white border-red-400 animate-pulse'
              }`}
            >
              {isAlarmMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile Bezel Frame vs Full Screen Toggle */}
          <button
            onClick={() => setIsMobileDeviceView(!isMobileDeviceView)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-mono border border-zinc-700 transition"
            title={isMobileDeviceView ? 'Switch to Full Tactical Dashboard' : 'Simulate Mobile Expo Device Frame'}
          >
            {isMobileDeviceView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Tactical View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Expo Mobile View</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Screen Container: Either Mobile Device Frame or Responsive Viewport */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
        {isMobileDeviceView ? (
          // Mobile Expo App Frame
          <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 overflow-y-auto">
            <div className="relative w-full max-w-[400px] h-[780px] bg-black rounded-[48px] border-[10px] border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ring-1 ring-zinc-700/50">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center border border-zinc-800">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800 mr-2"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-950/60"></div>
              </div>

              {/* Mobile Status Bar */}
              <div className="shrink-0 h-10 px-6 pt-2 flex items-center justify-between text-[11px] font-mono font-bold text-zinc-300 z-30 select-none bg-zinc-950">
                <span>09:41</span>
                <div className="flex items-center gap-2">
                  {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                  <div className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{userLocation.battery}%</span>
                  </div>
                </div>
              </div>

              {/* Mobile View Screen Content */}
              <div className="flex-1 relative overflow-hidden flex flex-col">
                {currentScreen === 'home_map' && <HomeMapScreen />}
                {currentScreen === 'alert_screen' && <AlertScreen />}
                {currentScreen === 'rescue_team' && <RescueTeamScreen />}
              </div>

              {/* Bottom Tab Bar for Mobile Frame */}
              <nav className="shrink-0 h-16 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-around px-2 z-30 backdrop-blur-md">
                <button
                  onClick={() => setCurrentScreen('home_map')}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                    currentScreen === 'home_map' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Map className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Home Map</span>
                </button>

                <button
                  onClick={() => setCurrentScreen('alert_screen')}
                  className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                    currentScreen === 'alert_screen' ? 'text-red-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {userStatus === 'ALERT_COUNTDOWN' && (
                    <span className="absolute top-0 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  )}
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-[10px] mt-0.5">Alert Alarm</span>
                </button>

                <button
                  onClick={() => setCurrentScreen('rescue_team')}
                  className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                    currentScreen === 'rescue_team' ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {trappedVictimsCount > 0 && (
                    <span className="absolute -top-1 right-2 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold animate-pulse">
                      {trappedVictimsCount}
                    </span>
                  )}
                  <Users className="w-5 h-5 text-rose-400" />
                  <span className="text-[10px] mt-0.5">Rescue Team</span>
                </button>
              </nav>

              {/* Home indicator bar */}
              <div className="w-32 h-1 bg-zinc-600 rounded-full mx-auto my-1.5 shrink-0"></div>
            </div>
          </div>
        ) : (
          // Full Tactical Desktop & Tablet View
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Primary Screen View */}
            <div className="flex-1 relative overflow-hidden">
              {currentScreen === 'home_map' && <HomeMapScreen />}
              {currentScreen === 'alert_screen' && <AlertScreen />}
              {currentScreen === 'rescue_team' && <RescueTeamScreen />}
            </div>

            {/* Persistent Tactical Navigation Bar */}
            <nav className="shrink-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Tab 1: Home Map */}
                <button
                  onClick={() => setCurrentScreen('home_map')}
                  className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition ${
                    currentScreen === 'home_map'
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>1. Home Map</span>
                  {criticalRedZonesCount > 0 && (
                    <span className="hidden sm:inline px-1.5 py-0.2 text-[10px] rounded bg-red-950 text-red-400 border border-red-800">
                      {criticalRedZonesCount} Red Zones
                    </span>
                  )}
                </button>

                {/* Tab 2: Alert Screen */}
                <button
                  onClick={() => setCurrentScreen('alert_screen')}
                  className={`relative flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition ${
                    currentScreen === 'alert_screen'
                      ? 'bg-red-950 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  {userStatus === 'ALERT_COUNTDOWN' && (
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  )}
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>2. Alert Screen</span>
                  {userStatus === 'ALERT_COUNTDOWN' && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-red-600 text-white font-mono animate-pulse">
                      120s ACTIVE
                    </span>
                  )}
                </button>

                {/* Tab 3: Rescue Team Screen */}
                <button
                  onClick={() => setCurrentScreen('rescue_team')}
                  className={`relative flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition ${
                    currentScreen === 'rescue_team'
                      ? 'bg-blue-950 text-blue-300 border border-blue-500/50 shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <Users className="w-4 h-4 text-rose-400" />
                  <span>3. Rescue Team Screen</span>
                  {trappedVictimsCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-rose-600 text-white font-mono font-bold">
                      {trappedVictimsCount} TRAPPED
                    </span>
                  )}
                </button>
              </div>

              {/* Status info */}
              <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Firebase Firestore Synced</span>
                </div>
                <div>Civilian ID: <span className="text-zinc-200">{userLocation.name || 'Civilian Device'}</span></div>
              </div>
            </nav>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <EcoShieldProvider>
      <MainAppContent />
    </EcoShieldProvider>
  );
}
