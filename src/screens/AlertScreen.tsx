import React, { useState } from 'react';
import { useEcoShield } from '../context/EcoShieldContext';
import { 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  Flame, 
  ShieldCheck, 
  LifeBuoy, 
  Navigation, 
  Battery, 
  Wifi, 
  WifiOff, 
  Clock, 
  Radio, 
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const AlertScreen: React.FC = () => {
  const {
    activeEmergencyAlert,
    countdownSeconds,
    isAlarmPlaying,
    isAlarmMuted,
    toggleAlarmMute,
    handleIAmSafe,
    handleNeedHelp,
    jumpTimerToSeconds,
    userLocation,
    userStatus,
    isOnline,
    setCurrentScreen,
    sendEmergencySMSFallback,
    criticalVictims
  } = useEcoShield();

  const [customHelpNotes, setCustomHelpNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const riskPercent = activeEmergencyAlert?.risk || 92;
  const distanceKm = activeEmergencyAlert?.distanceKm !== undefined 
    ? activeEmergencyAlert.distanceKm 
    : 1.2;

  // Format countdown: mm:ss
  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Progress fraction for visual ring
  const progressRatio = countdownSeconds / 120;
  const strokeDashoffset = 440 - 440 * progressRatio;

  const onConfirmSafe = async () => {
    setIsSubmitting(true);
    await handleIAmSafe();
    setIsSubmitting(false);
  };

  const onConfirmHelp = async () => {
    setIsSubmitting(true);
    await handleNeedHelp(customHelpNotes);
    setIsSubmitting(false);
  };

  const triggerDirectSMS = () => {
    sendEmergencySMSFallback(
      { lat: userLocation.lat, lon: userLocation.lon },
      userLocation.battery,
      'Manual Civilian SMS Trigger'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-red-950 text-white select-none animate-emergency-red p-4 sm:p-6 md:p-8">
      {/* Background radial warning glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/30 via-red-950/80 to-black/90"></div>
      
      {/* Top Header: Warning Level & Audio Controls */}
      <div className="relative z-10 flex items-center justify-between border-b border-red-500/40 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600 text-white animate-bounce shadow-[0_0_20px_#ef4444]">
            <AlertOctagon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-black uppercase tracking-wider bg-black/60 text-red-300 rounded border border-red-500/50">
                ECOSHIELD LEVEL 1 EVACUATION ALARM
              </span>
              <span className="animate-ping w-2 h-2 rounded-full bg-red-400"></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
              EXTREME HAZARD PROXIMITY (&lt; 3 KM)
            </h1>
          </div>
        </div>

        {/* Siren Sound Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAlarmMute}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs font-bold transition shadow-lg backdrop-blur-sm border ${
              isAlarmMuted 
                ? 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800' 
                : 'bg-red-600/90 text-white border-red-400 animate-pulse hover:bg-red-500'
            }`}
            title={isAlarmMuted ? 'Unmute siren' : 'Mute siren'}
          >
            {isAlarmMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAlarmMuted ? 'SIREN MUTED' : 'LOUD SIREN ACTIVE'}</span>
          </button>
        </div>
      </div>

      {/* Main Body: Countdown & Hazard Details */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 max-w-2xl mx-auto w-full text-center">
        {userStatus === 'TRAPPED' ? (
          // Status after timer expiry or SOS click
          <div className="w-full bg-black/85 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(239,68,68,0.6)] backdrop-blur-xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-600 text-white mx-auto flex items-center justify-center text-3xl font-black mb-4 animate-pulse shadow-[0_0_25px_#dc2626]">
              🆘
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/50">
              CRITICAL RESCUE BEACON ACTIVE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              CIVILIAN STATUS: TRAPPED
            </h2>
            <p className="text-sm text-red-200 mt-2 max-w-md mx-auto leading-relaxed">
              Your exact GPS coordinates and battery level have been transmitted to Firestore collection <code className="bg-red-950 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs">critical_victims</code>. Rescue units are monitoring your telemetry.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6 p-4 rounded-2xl bg-zinc-950/80 border border-red-900/50 text-left font-mono text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">Civilian ID</span>
                <span className="text-white font-bold">{userLocation.name || 'Civilian Device'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">Phone Battery</span>
                <span className="text-emerald-400 font-bold">{userLocation.battery}%</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">GPS Latitude</span>
                <span className="text-white font-bold">{userLocation.lat.toFixed(5)}° N</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">GPS Longitude</span>
                <span className="text-white font-bold">{userLocation.lon.toFixed(5)}° W</span>
              </div>
            </div>

            {/* Offline SMS button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={triggerDirectSMS}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Emergency SMS Dispatch (Offline Fallback)</span>
              </button>

              <button
                onClick={() => setCurrentScreen('rescue_team')}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg"
              >
                <span>View on Rescue Team Screen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onConfirmSafe}
              className="mt-4 text-xs font-mono text-zinc-400 hover:text-white underline"
            >
              False alarm? Click here to mark yourself SAFE
            </button>
          </div>
        ) : (
          // Active Countdown Mode
          <>
            {/* Circular Countdown Timer */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-56 h-56 sm:w-64 sm:h-64 -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  className="stroke-red-950/80 fill-black/60"
                  strokeWidth="10"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  className="stroke-red-500 transition-all duration-1000 ease-linear"
                  strokeWidth="10"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Countdown Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-mono font-bold tracking-widest text-red-300 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Auto SOS In
                </span>
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                  {formattedTime}
                </span>
                <span className="text-[11px] font-mono text-red-400 mt-0.5">
                  {countdownSeconds}s REMAINING
                </span>
              </div>
            </div>

            {/* Test accelerator for testing */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => jumpTimerToSeconds(5)}
                className="px-2.5 py-1 rounded-full bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-[11px] font-mono text-red-200 transition flex items-center gap-1"
                title="Fast forward timer to test 0s automatic dispatch"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Test 0s Trigger: Jump to 5s</span>
              </button>
            </div>

            {/* Active Hazard Banner */}
            <div className="w-full bg-black/75 border border-red-500/60 rounded-2xl p-4 sm:p-5 text-left backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b border-red-900/60 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="font-bold text-sm text-red-200 uppercase tracking-wide">
                    {activeEmergencyAlert?.title || 'Wildfire Danger Surge'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-red-600 text-white">
                    {riskPercent}% RISK
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                    {distanceKm.toFixed(1)} KM AWAY
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {activeEmergencyAlert?.description || 'Extreme environmental hazard detected within your immediate perimeter (<3 km). If you do not respond before timer hits 0, automatic distress beacon with GPS coordinates will be sent to Rescue Command.'}
              </p>

              {/* Telemetry bar */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-red-950 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GPS: {userLocation.lat.toFixed(3)}, {userLocation.lon.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Battery: {userLocation.battery}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  {isOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> Online</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1"><WifiOff className="w-3.5 h-3.5" /> SMS Standby</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Action Bar: Two Major Buttons as requested: "I AM SAFE" and "NEED HELP" */}
      {userStatus !== 'TRAPPED' && (
        <div className="relative z-10 max-w-2xl mx-auto w-full pt-4 pb-2 border-t border-red-900/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Button 1: I AM SAFE */}
            <button
              onClick={onConfirmSafe}
              disabled={isSubmitting}
              className="group relative flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg tracking-wide uppercase shadow-[0_0_30px_rgba(16,185,129,0.5)] transition duration-200 border-2 border-emerald-300/40"
            >
              <ShieldCheck className="w-7 h-7 transition-transform group-hover:scale-110" />
              <span>I AM SAFE</span>
            </button>

            {/* Button 2: NEED HELP */}
            <button
              onClick={onConfirmHelp}
              disabled={isSubmitting}
              className="group relative flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-lg tracking-wide uppercase shadow-[0_0_30px_rgba(245,158,11,0.6)] transition duration-200 border-2 border-yellow-200"
            >
              <LifeBuoy className="w-7 h-7 text-black transition-transform group-hover:scale-110 animate-bounce" />
              <span>NEED HELP</span>
            </button>
          </div>

          <div className="mt-3 text-center">
            <span className="text-[11px] font-mono text-red-300/80">
              ⚠️ Inactivity protocol: Zero response at 00:00 will automatically mark you TRAPPED in Firestore &amp; dispatch emergency SMS.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
