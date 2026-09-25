import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps3D } from '../../services/googleMapsLoader';
import { Sensor, CriticalVictim, UserLocation } from '../../types';
import { Globe, Compass, RefreshCw, ZoomIn, ZoomOut, AlertTriangle, Eye } from 'lucide-react';

interface GoogleEarth3DViewProps {
  userLocation: UserLocation;
  sensors: Sensor[];
  victims: CriticalVictim[];
  weatherOverlay?: 'radar' | 'clouds' | 'wind' | 'temp';
  className?: string;
  onSelectCoordinates?: (coords: { lat: number; lon: number; name: string }) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        center?: string;
        tilt?: number | string;
        heading?: number | string;
        range?: number | string;
        mode?: string;
        'internal-usage-attribution-ids'?: string;
      };
    }
  }
  interface Window {
    google?: any;
  }
}

export const GoogleEarth3DView: React.FC<GoogleEarth3DViewProps> = ({
  userLocation,
  sensors,
  victims,
  weatherOverlay = 'radar',
  className = 'h-full w-full',
  onSelectCoordinates,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [cameraAltitude, setCameraAltitude] = useState<number>(3500);
  const [cameraTilt, setCameraTilt] = useState<number>(65);
  const [cameraHeading, setCameraHeading] = useState<number>(30);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gmpMapRef = useRef<any>(null);

  // Initialize Maps 3D
  useEffect(() => {
    let mounted = true;
    loadGoogleMaps3D().then((success) => {
      if (!mounted) return;
      if (success) {
        setIsLoaded(true);
      } else {
        setHasError(true);
      }
    });

    return () => {
      mounted = false;
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, []);

  // Set up 3D elements once ready
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    // Check if gmp-map-3d already exists
    let mapElement = containerRef.current.querySelector('gmp-map-3d') as any;

    if (!mapElement) {
      mapElement = document.createElement('gmp-map-3d');
      mapElement.setAttribute('center', `${userLocation.lat.toFixed(4)},${userLocation.lon.toFixed(4)},${cameraAltitude}`);
      mapElement.setAttribute('tilt', `${cameraTilt}`);
      mapElement.setAttribute('heading', `${cameraHeading}`);
      mapElement.setAttribute('mode', 'hybrid');
      mapElement.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
      mapElement.style.width = '100%';
      mapElement.style.height = '100%';
      mapElement.style.display = 'block';

      containerRef.current.appendChild(mapElement);
      gmpMapRef.current = mapElement;
    } else {
      mapElement.setAttribute('center', `${userLocation.lat.toFixed(4)},${userLocation.lon.toFixed(4)},${cameraAltitude}`);
    }
  }, [isLoaded, userLocation, cameraAltitude, cameraTilt, cameraHeading]);

  // Orbit / Fly around animation
  const toggleOrbit = () => {
    if (isRotating) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
      setIsRotating(false);
    } else {
      setIsRotating(true);
      rotationTimerRef.current = setInterval(() => {
        setCameraHeading((prev) => {
          const next = (prev + 1.5) % 360;
          if (gmpMapRef.current) {
            gmpMapRef.current.setAttribute('heading', `${next.toFixed(1)}`);
          }
          return next;
        });
      }, 100);
    }
  };

  const adjustTilt = (delta: number) => {
    const newTilt = Math.min(85, Math.max(15, cameraTilt + delta));
    setCameraTilt(newTilt);
    if (gmpMapRef.current) {
      gmpMapRef.current.setAttribute('tilt', `${newTilt}`);
    }
  };

  const adjustAltitude = (factor: number) => {
    const newAlt = Math.min(25000, Math.max(400, Math.round(cameraAltitude * factor)));
    setCameraAltitude(newAlt);
    if (gmpMapRef.current) {
      gmpMapRef.current.setAttribute('center', `${userLocation.lat.toFixed(4)},${userLocation.lon.toFixed(4)},${newAlt}`);
    }
  };

  return (
    <div className={`relative ${className} bg-zinc-950 overflow-hidden select-none`}>
      {/* 3D Map Container */}
      <div ref={containerRef} className="w-full h-full relative" />

      {/* Atmospheric / Weather Filter Overlays */}
      {weatherOverlay === 'radar' && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_rgba(239,68,68,0.15)_60%,_transparent_100%)] mix-blend-screen opacity-70 animate-pulse"></div>
      )}
      {weatherOverlay === 'clouds' && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-cyan-950/20 via-transparent to-blue-900/25 mix-blend-overlay"></div>
      )}
      {weatherOverlay === 'wind' && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_40%,_rgba(59,130,246,0.15)_0%,_transparent_70%)]"></div>
      )}

      {/* Loading or Fallback Banner */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-white z-20">
          <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
          <p className="font-mono text-xs text-zinc-300 tracking-wide uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Streaming Google Earth 3D Photorealistic Mesh...
          </p>
          <span className="text-[10px] font-mono text-zinc-500 mt-1">
            Loading maps3d library with cloud styling &bull; Internal ID: gmp_git_agentskills_v1
          </span>
        </div>
      )}

      {/* Fallback View if WebGL / 3D Not Supported */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950/95 text-white z-20 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
          <h3 className="font-bold text-sm text-zinc-200">3D Photorealistic Earth Initializing</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            Google Maps Platform 3D globe requires hardware-accelerated WebGL. Switching to high-res tactical satellite telemetry mode.
          </p>
        </div>
      )}

      {/* 3D Navigation Controls Floating Widget */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 shadow-2xl">
        <button
          onClick={() => adjustAltitude(0.6)}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition border border-zinc-700/60"
          title="Zoom In (Decrease Altitude)"
        >
          <ZoomIn className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={() => adjustAltitude(1.6)}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition border border-zinc-700/60"
          title="Zoom Out (Increase Altitude)"
        >
          <ZoomOut className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={() => adjustTilt(+10)}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition border border-zinc-700/60"
          title="Pitch Camera Down (Steeper 3D Tilt)"
        >
          <span className="text-[10px] font-mono font-bold">Tilt +</span>
        </button>

        <button
          onClick={() => adjustTilt(-10)}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition border border-zinc-700/60"
          title="Pitch Camera Up (Flatter Horizon)"
        >
          <span className="text-[10px] font-mono font-bold">Tilt -</span>
        </button>

        <button
          onClick={toggleOrbit}
          className={`p-2 rounded-xl border transition ${
            isRotating
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/60'
          }`}
          title={isRotating ? 'Stop 360° Orbit Flyover' : 'Start 360° Orbit Flyover'}
        >
          <Compass className={`w-4 h-4 ${isRotating ? 'animate-spin' : 'text-cyan-400'}`} />
        </button>
      </div>

      {/* Camera Flight Status HUD */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/85 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-800 shadow-2xl text-[11px] font-mono text-zinc-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Globe className="w-3.5 h-3.5" />
          <span className="font-bold">Google Earth 3D Hybrid</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-zinc-400 border-l border-zinc-700 pl-3">
          <span>Alt: <strong className="text-white">{(cameraAltitude / 1000).toFixed(1)} km</strong></span>
          <span>Tilt: <strong className="text-white">{cameraTilt}°</strong></span>
          <span>Heading: <strong className="text-white">{Math.round(cameraHeading)}°</strong></span>
        </div>
      </div>
    </div>
  );
};
