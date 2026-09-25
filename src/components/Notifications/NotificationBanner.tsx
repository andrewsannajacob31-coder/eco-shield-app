import React from 'react';
import { useEcoShield } from '../../context/EcoShieldContext';
import { Bell, X, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const { notifications, dismissNotification } = useEcoShield();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.slice(0, 3).map((notif) => {
        const isDanger = notif.type === 'danger';
        const isRescue = notif.type === 'rescue';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 ${
              isDanger
                ? 'bg-red-950/95 border-red-500/70 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : isRescue
                ? 'bg-emerald-950/95 border-emerald-500/70 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900/95 border-zinc-700 text-zinc-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isDanger ? (
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              ) : isRescue ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Info className="w-5 h-5 text-blue-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Expo Push Alert
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">{notif.timestamp}</span>
              </div>
              <p className="text-xs font-bold mt-0.5 leading-snug line-clamp-1">{notif.title}</p>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-tight">{notif.body}</p>
            </div>

            <button
              onClick={() => dismissNotification(notif.id)}
              className="text-zinc-400 hover:text-white p-1 rounded transition shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
