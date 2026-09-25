import React, { useState } from 'react';
import { useEcoShield } from '../../context/EcoShieldContext';
import { 
  User, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  X, 
  Key, 
  Mail, 
  BadgeCheck, 
  Radio, 
  Check, 
  ChevronDown 
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, loginProfile, logoutProfile, userLocation, triggerPushNotification } = useEcoShield();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [role, setRole] = useState<'Civilian' | 'Rescue Commander' | 'First Responder' | 'IoT Engineer'>(userProfile.role);
  const [callsign, setCallsign] = useState(userProfile.callsign);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    loginProfile(name, email, role, callsign);
    setIsEditing(false);
    triggerPushNotification('Profile Updated', `Active Operator profile updated to ${name} [${role}]`, 'system');
  };

  const handleLogout = () => {
    logoutProfile();
    setIsEditing(false);
    triggerPushNotification('Operator Logged Out', 'Current profile switched to Guest Civilian mode.', 'system');
  };

  const handleQuickLoginAs = (presetRole: 'Rescue Commander' | 'First Responder' | 'Civilian' | 'IoT Engineer') => {
    let presetName = 'Agent Jacob';
    let presetCallsign = 'ECHO-1';

    if (presetRole === 'Rescue Commander') {
      presetName = 'Commander Jacob';
      presetCallsign = 'ECHO-COMMANDER-1';
    } else if (presetRole === 'First Responder') {
      presetName = 'Captain Vance';
      presetCallsign = 'SIERRA-PARAMEDIC-4';
    } else if (presetRole === 'IoT Engineer') {
      presetName = 'Dr. Elena Rostova';
      presetCallsign = 'GRID-TELEMETRY-SYS';
    } else {
      presetName = 'Sarah Miller';
      presetCallsign = 'CIVILIAN-ZONE-4';
    }

    setName(presetName);
    setRole(presetRole);
    setCallsign(presetCallsign);
    loginProfile(presetName, userProfile.email || 'andrewsannajacob31@gmail.com', presetRole, presetCallsign);
    triggerPushNotification('Tactical Switch', `Switched active credentials to ${presetName} (${presetRole})`, 'rescue');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg border border-cyan-400/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                Operator Profile
                {userProfile.isLoggedIn && (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                    AUTHENTICATED
                  </span>
                )}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                EcoShield Tactical ID &amp; Firebase Auth
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!isEditing ? (
            <>
              {/* Profile Card View */}
              <div className="p-4 rounded-2xl bg-black/50 border border-zinc-800 text-left font-mono space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Operator Name</span>
                    <span className="text-base font-bold text-white">{userProfile.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-950 text-blue-300 border border-blue-600/50">
                    {userProfile.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800/80">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Callsign</span>
                    <span className="text-cyan-400 font-bold">{userProfile.callsign}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">GPS Sector</span>
                    <span className="text-zinc-300 truncate">{userLocation.name || 'Civilian Base'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] uppercase text-zinc-500 block">Firebase Verified Account</span>
                  <span className="text-xs text-zinc-300 truncate block">{userProfile.email}</span>
                </div>
              </div>

              {/* Quick Role Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Switch Active Role Persona:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickLoginAs('Rescue Commander')}
                    className={`p-2 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                      userProfile.role === 'Rescue Commander'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>Commander</span>
                  </button>

                  <button
                    onClick={() => handleQuickLoginAs('First Responder')}
                    className={`p-2 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                      userProfile.role === 'First Responder'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300'
                    }`}
                  >
                    <span>🚑</span>
                    <span>Responder</span>
                  </button>

                  <button
                    onClick={() => handleQuickLoginAs('IoT Engineer')}
                    className={`p-2 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                      userProfile.role === 'IoT Engineer'
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300'
                    }`}
                  >
                    <span>📡</span>
                    <span>IoT Engineer</span>
                  </button>

                  <button
                    onClick={() => handleQuickLoginAs('Civilian')}
                    className={`p-2 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                      userProfile.role === 'Civilian'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300'
                    }`}
                  >
                    <span>👤</span>
                    <span>Civilian</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Edit Profile / Login</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-red-400 border border-zinc-700 text-xs font-mono font-bold transition flex items-center gap-1.5"
                  title="Logout operator"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            /* Edit / Login Form */
            <form onSubmit={handleSave} className="space-y-3.5 text-left font-mono">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Operator Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Email / Tactical Dispatch ID</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Radio Callsign</label>
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Operational Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Rescue Commander">Rescue Commander (Incident Lead)</option>
                  <option value="First Responder">First Responder (Paramedic / Search &amp; Rescue)</option>
                  <option value="IoT Engineer">IoT Engineer (Sensor Grid Overseer)</option>
                  <option value="Civilian">Civilian (Evacuation Standby)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Authenticate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
