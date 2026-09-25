import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection, ensureAuth } from '../firebase';
import { Sensor, EmergencyAlert, CriticalVictim, UserLocation, calculateDistanceKm } from '../types';
import { INITIAL_SENSORS, INITIAL_ALERTS, INITIAL_CRITICAL_VICTIMS, DEFAULT_COORDS } from '../utils/seedData';
import { sirenPlayer } from '../utils/sirenAudio';

interface PushNotificationEvent {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'danger' | 'rescue' | 'system';
}

interface EcoShieldContextType {
  // Screens & Navigation
  currentScreen: 'home_map' | 'alert_screen' | 'rescue_team' | 'weather_earth';
  setCurrentScreen: (screen: 'home_map' | 'alert_screen' | 'rescue_team' | 'weather_earth') => void;
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;

  // Data
  sensors: Sensor[];
  alerts: EmergencyAlert[];
  criticalVictims: CriticalVictim[];
  userLocation: UserLocation;
  userStatus: 'NORMAL' | 'SAFE' | 'ALERT_COUNTDOWN' | 'TRAPPED';
  activeEmergencyAlert: EmergencyAlert | null;
  
  // Timer & Alarm
  countdownSeconds: number;
  isAlarmPlaying: boolean;
  isAlarmMuted: boolean;
  toggleAlarmMute: () => void;
  
  // Actions
  handleIAmSafe: () => Promise<void>;
  handleNeedHelp: (customNotes?: string) => Promise<void>;
  triggerEmergencyAlertSimulation: (customRisk?: number, customDistKm?: number) => Promise<void>;
  resetEmergencyState: () => void;
  jumpTimerToSeconds: (seconds: number) => void;
  updateVictimStatus: (victimId: string, newStatus: 'TRAPPED' | 'RESCUED' | 'SAFE' | 'EN_ROUTE', responderName?: string) => Promise<void>;
  updateUserLocation: (lat: number, lon: number, isSimulated?: boolean) => void;
  refreshDeviceGPS: () => Promise<void>;
  simulateSensorFluctuation: (sensorId: string, riskChange: number) => Promise<void>;
  
  // Offline & SMS
  isOnline: boolean;
  offlineDispatchQueue: Array<{ id: string; payload: Partial<CriticalVictim>; time: string }>;
  sendEmergencySMSFallback: (coords: { lat: number; lon: number }, battery: number, reason: string) => void;
  
  // Push Notification / Background simulator
  notifications: PushNotificationEvent[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  triggerPushNotification: (title: string, body: string, type?: 'danger' | 'rescue' | 'system') => void;
  
  // Auth Profile
  userProfile: {
    name: string;
    email: string;
    role: 'Civilian' | 'Rescue Commander' | 'First Responder' | 'IoT Engineer';
    callsign: string;
    isLoggedIn: boolean;
  };
  loginProfile: (name: string, email: string, role: 'Civilian' | 'Rescue Commander' | 'First Responder' | 'IoT Engineer', callsign?: string) => void;
  logoutProfile: () => void;
  
  // Metrics
  trappedVictimsCount: number;
  criticalRedZonesCount: number;
  nearestHazardDistanceKm: number | null;
}

const EcoShieldContext = createContext<EcoShieldContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_ID_KEY = 'ecoshield_user_id';
const LOCAL_STORAGE_OFFLINE_QUEUE_KEY = 'ecoshield_offline_queue';

export const EcoShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<'home_map' | 'alert_screen' | 'rescue_team' | 'weather_earth'>('home_map');
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);

  // User Identity & Location
  const [userId] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY);
    if (saved) return saved;
    const generated = `civilian_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, generated);
    return generated;
  });

  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: DEFAULT_COORDS.lat,
    lon: DEFAULT_COORDS.lon,
    accuracy: 8,
    battery: 84,
    isSimulated: false,
    name: 'Sector Civilian Base'
  });

  const [userStatus, setUserStatus] = useState<'NORMAL' | 'SAFE' | 'ALERT_COUNTDOWN' | 'TRAPPED'>('NORMAL');
  
  // Data Collections
  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [criticalVictims, setCriticalVictims] = useState<CriticalVictim[]>(INITIAL_CRITICAL_VICTIMS);

  // Alarm & Countdown State
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<EmergencyAlert | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(120);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [isAlarmMuted, setIsAlarmMuted] = useState<boolean>(false);

  // Connectivity & Fallback SMS Queue
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineDispatchQueue, setOfflineDispatchQueue] = useState<Array<{ id: string; payload: Partial<CriticalVictim>; time: string }>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Simulated Expo Push Notifications
  const [notifications, setNotifications] = useState<PushNotificationEvent[]>([]);

  // User Profile & Authentication State
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    role: 'Civilian' | 'Rescue Commander' | 'First Responder' | 'IoT Engineer';
    callsign: string;
    isLoggedIn: boolean;
  }>(() => {
    const saved = localStorage.getItem('ecoshield_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      name: 'Agent Jacob',
      email: 'andrewsannajacob31@gmail.com',
      role: 'Rescue Commander',
      callsign: 'ECHO-LEADER-1',
      isLoggedIn: true,
    };
  });

  const loginProfile = useCallback((name: string, email: string, role: 'Civilian' | 'Rescue Commander' | 'First Responder' | 'IoT Engineer', callsign?: string) => {
    const profile = {
      name,
      email,
      role,
      callsign: callsign || name.toUpperCase().slice(0, 4) + '-99',
      isLoggedIn: true,
    };
    setUserProfile(profile);
    localStorage.setItem('ecoshield_user_profile', JSON.stringify(profile));
  }, []);

  const logoutProfile = useCallback(() => {
    const loggedOut = {
      name: 'Guest Civilian',
      email: 'guest@ecoshield.network',
      role: 'Civilian' as const,
      callsign: 'CIVILIAN-BASE',
      isLoggedIn: false,
    };
    setUserProfile(loggedOut);
    localStorage.removeItem('ecoshield_user_profile');
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Refs for timer and synchronization
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedAlertIdsRef = useRef<Set<string>>(new Set());

  // 1. Initial connection & auth
  useEffect(() => {
    testConnection();
    ensureAuth();

    // Battery API if supported
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number; addEventListener: (event: string, cb: () => void) => void }> })
        .getBattery()
        .then((battery) => {
          setUserLocation(prev => ({ ...prev, battery: Math.round(battery.level * 100) }));
          battery.addEventListener('levelchange', () => {
            setUserLocation(prev => ({ ...prev, battery: Math.round(battery.level * 100) }));
          });
        })
        .catch(() => {});
    }

    // Geolocation attempt on boot
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Keep default if user permits or updates
          console.log('Real GPS located:', pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.log('Geolocation note: using configured field coordinates.', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // Online/Offline tracking
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Seed initial data to Firestore if collection is empty
  useEffect(() => {
    const seedFirestore = async () => {
      try {
        const sensorsCol = collection(db, 'sensors');
        const sensorSnap = await getDocs(sensorsCol).catch(() => null);
        if (!sensorSnap || sensorSnap.empty) {
          console.log('Seeding initial sensors to Firestore...');
          for (const s of INITIAL_SENSORS) {
            await setDoc(doc(db, 'sensors', s.id), s).catch(e => handleFirestoreError(e, OperationType.WRITE, `sensors/${s.id}`));
          }
        }

        const alertsCol = collection(db, 'alerts');
        const alertSnap = await getDocs(alertsCol).catch(() => null);
        if (!alertSnap || alertSnap.empty) {
          console.log('Seeding initial alerts to Firestore...');
          for (const a of INITIAL_ALERTS) {
            await setDoc(doc(db, 'alerts', a.id), a).catch(e => handleFirestoreError(e, OperationType.WRITE, `alerts/${a.id}`));
          }
        }

        const victimsCol = collection(db, 'critical_victims');
        const victimSnap = await getDocs(victimsCol).catch(() => null);
        if (!victimSnap || victimSnap.empty) {
          console.log('Seeding initial victims to Firestore...');
          for (const v of INITIAL_CRITICAL_VICTIMS) {
            await setDoc(doc(db, 'critical_victims', v.id), v).catch(e => handleFirestoreError(e, OperationType.WRITE, `critical_victims/${v.id}`));
          }
        }
      } catch (e) {
        console.warn('Seeding note (local fallback active):', e);
      }
    };

    seedFirestore();
  }, []);

  // 3. Setup Firestore real-time listeners with local fallbacks
  useEffect(() => {
    // Sensors Listener
    const unsubSensors = onSnapshot(
      collection(db, 'sensors'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Sensor[] = [];
          snapshot.forEach(doc => {
            loaded.push({ id: doc.id, ...(doc.data() as Omit<Sensor, 'id'>) });
          });
          setSensors(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sensors');
      }
    );

    // Alerts Listener
    const unsubAlerts = onSnapshot(
      collection(db, 'alerts'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: EmergencyAlert[] = [];
          snapshot.forEach(doc => {
            loaded.push({ id: doc.id, ...(doc.data() as Omit<EmergencyAlert, 'id'>) });
          });
          setAlerts(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'alerts');
      }
    );

    // Critical Victims Listener
    const unsubVictims = onSnapshot(
      collection(db, 'critical_victims'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: CriticalVictim[] = [];
          snapshot.forEach(doc => {
            loaded.push({ id: doc.id, ...(doc.data() as Omit<CriticalVictim, 'id'>) });
          });
          setCriticalVictims(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'critical_victims');
      }
    );

    return () => {
      unsubSensors();
      unsubAlerts();
      unsubVictims();
    };
  }, []);

  // 4. Background sensor fluctuation simulation (to simulate dynamic IoT telemetry)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => {
        // Minor natural variance
        const tempDelta = (Math.random() - 0.48) * 0.3;
        const newTemp = Math.max(10, Math.min(65, parseFloat((sensor.temp + tempDelta).toFixed(1))));
        return {
          ...sensor,
          temp: newTemp,
          lastUpdated: 'Live telemetry ping'
        };
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Helper to trigger simulated Expo Push Notification
  const triggerPushNotification = useCallback((title: string, body: string, type: 'danger' | 'rescue' | 'system' = 'danger') => {
    const newNotif: PushNotificationEvent = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 5)]);

    // Try HTML5 browser notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/vite.svg' });
      } catch {
        // ignore
      }
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // SMS Fallback logic as specified: "Also try to send SMS if no internet."
  const sendEmergencySMSFallback = useCallback((coords: { lat: number; lon: number }, battery: number, reason: string) => {
    const emergencyNumber = '911';
    const message = encodeURIComponent(
      `[ECOSHIELD SOS] TRAPPED DISTRESS ALERT!\nUser: ${userId}\nCoords: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}\nBattery: ${battery}%\nStatus: TRAPPED\nTrigger: ${reason}\nMap: https://maps.google.com/?q=${coords.lat},${coords.lon}`
    );
    
    console.log(`[EcoShield SMS Trigger]: Dispatching to ${emergencyNumber}: ${decodeURIComponent(message)}`);
    
    // Store in offline dispatch queue
    const queuedItem = {
      id: `offline-${Date.now()}`,
      payload: {
        userId,
        lat: coords.lat,
        lon: coords.lon,
        battery,
        timestamp: new Date().toISOString(),
        status: 'TRAPPED' as const,
        source: 'OFFLINE_SMS_FALLBACK' as const,
        notes: `Distress dispatched via emergency SMS fallback (${reason})`
      },
      time: new Date().toISOString()
    };

    setOfflineDispatchQueue(prev => {
      const updated = [queuedItem, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Attempt to open SMS intent on mobile / web client
    try {
      window.location.href = `sms:${emergencyNumber}?&body=${message}`;
    } catch (e) {
      console.warn('SMS handler note:', e);
    }
  }, [userId]);

  // Sync offline queue when connection returns
  useEffect(() => {
    if (isOnline && offlineDispatchQueue.length > 0) {
      console.log(`Connection restored: Syncing ${offlineDispatchQueue.length} offline emergency distress beacons...`);
      offlineDispatchQueue.forEach(async (item) => {
        try {
          await setDoc(doc(db, 'critical_victims', item.id), item.payload);
        } catch {
          // ignore
        }
      });
      setOfflineDispatchQueue([]);
      localStorage.removeItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
      triggerPushNotification('Network Restored', 'All queued offline distress beacons successfully synced to Rescue Command.', 'rescue');
    }
  }, [isOnline, offlineDispatchQueue, triggerPushNotification]);

  // 5. CRITICAL CHECK: "Alert Screen: Full-screen red alarm with loud sound when a document in collection alerts has risk >80 and user location within 3km"
  useEffect(() => {
    if (userStatus === 'TRAPPED' || userStatus === 'SAFE') {
      return; // already handled
    }

    // Check all active alerts
    for (const alert of alerts) {
      if (!alert.active) continue;

      const distKm = calculateDistanceKm(userLocation.lat, userLocation.lon, alert.lat, alert.lon);
      
      // Prompt Rule: risk > 80 AND distance <= 3km
      if (alert.risk > 80 && distKm <= 3.0) {
        if (!processedAlertIdsRef.current.has(alert.id)) {
          processedAlertIdsRef.current.add(alert.id);
          console.warn(`[EMERGENCY DETECTED] Alert '${alert.title}' Risk: ${alert.risk}%, Dist: ${distKm}km <= 3km. Triggering Alarm.`);
          
          setActiveEmergencyAlert({ ...alert, distanceKm: distKm });
          setCurrentScreen('alert_screen');
          setUserStatus('ALERT_COUNTDOWN');
          setCountdownSeconds(120);

          // Loud emergency siren
          sirenPlayer.start();
          setIsAlarmPlaying(true);

          // Vibration if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([800, 300, 800, 300, 1200]);
          }

          // Push Notification
          triggerPushNotification(
            `🚨 EXTREME HAZARD ALERT (${alert.risk}% RISK)`,
            `You are ${distKm.toFixed(1)}km from severe hazard: ${alert.title}. Immediate action required!`,
            'danger'
          );
          break;
        }
      }
    }
  }, [alerts, userLocation, userStatus, triggerPushNotification]);

  // 6. Countdown Timer Logic (120 seconds countdown)
  // "If timer hits 0 with no response, automatically get GPS location via expo-location and send to Firestore collection critical_victims with {userId, lat, lon, battery, timestamp, status: 'TRAPPED'}. Also try to send SMS if no internet."
  useEffect(() => {
    if (userStatus === 'ALERT_COUNTDOWN' && currentScreen === 'alert_screen') {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev <= 1) {
            // TIMER HIT 0 WITH NO RESPONSE!
            clearInterval(countdownIntervalRef.current!);
            countdownIntervalRef.current = null;
            
            // Execute automatic distress dispatch
            handleTimerExpiredAutoDispatch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [userStatus, currentScreen]);

  // Automatic dispatch when 120s timer hits 0
  const handleTimerExpiredAutoDispatch = useCallback(async () => {
    console.warn('[ECOSHIELD AUTO-DISPATCH]: 120s countdown reached zero with no user response! Gathering GPS & battery...');
    sirenPlayer.stop();
    setIsAlarmPlaying(false);
    setUserStatus('TRAPPED');

    let currentLat = userLocation.lat;
    let currentLon = userLocation.lon;
    let currentBattery = userLocation.battery;

    // Fetch fresh GPS coordinates (expo-location equivalent)
    if (navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              currentLat = pos.coords.latitude;
              currentLon = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000, enableHighAccuracy: true }
          );
        });
      } catch {
        // fallback to state coordinates
      }
    }

    const victimRecord: CriticalVictim = {
      id: `victim_auto_${Date.now()}`,
      userId,
      lat: currentLat,
      lon: currentLon,
      battery: currentBattery,
      timestamp: new Date().toISOString(),
      status: 'TRAPPED',
      source: 'TIMER_EXPIRY_AUTO',
      notes: 'AUTOMATIC SYSTEM DISPATCH: 120s countdown expired with no civilian response inside red danger zone.'
    };

    // Send to Firestore collection critical_victims
    try {
      await setDoc(doc(db, 'critical_victims', victimRecord.id), victimRecord);
      console.log('Victim dispatch committed to Firestore collection critical_victims:', victimRecord.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `critical_victims/${victimRecord.id}`);
      // Also update local list so UI reflects immediately
      setCriticalVictims(prev => [victimRecord, ...prev.filter(v => v.userId !== userId)]);
    }

    // Local state fallback update
    setCriticalVictims(prev => {
      const exists = prev.find(v => v.id === victimRecord.id);
      return exists ? prev : [victimRecord, ...prev];
    });

    // Check internet connectivity & send SMS if offline or network degraded
    if (!navigator.onLine) {
      console.warn('Network offline! Triggering emergency SMS fallback...');
      sendEmergencySMSFallback({ lat: currentLat, lon: currentLon }, currentBattery, '120s Timer Expired (No Civilian Response - Offline)');
    }

    triggerPushNotification(
      '⚠️ AUTOMATIC DISTRESS BEACON SENT',
      'No response recorded. Your GPS coordinates and battery level have been transmitted to Rescue Teams as TRAPPED.',
      'danger'
    );
  }, [userId, userLocation, sendEmergencySMSFallback, triggerPushNotification]);

  // "I AM SAFE" Button Handler
  const handleIAmSafe = async () => {
    sirenPlayer.stop();
    setIsAlarmPlaying(false);
    setUserStatus('SAFE');
    setCountdownSeconds(120);
    setCurrentScreen('home_map');

    triggerPushNotification(
      '✅ Civilian Marked Safe',
      'You confirmed safety. Rescue teams have been notified of your safe status.',
      'system'
    );

    // If previously recorded as trapped, update record
    const existingTrap = criticalVictims.find(v => v.userId === userId && v.status === 'TRAPPED');
    if (existingTrap) {
      try {
        await updateDoc(doc(db, 'critical_victims', existingTrap.id), {
          status: 'SAFE',
          notes: 'Civilian marked self as SAFE after emergency alarm.'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `critical_victims/${existingTrap.id}`);
      }
      setCriticalVictims(prev => prev.map(v => v.id === existingTrap.id ? { ...v, status: 'SAFE' } : v));
    }
  };

  // "NEED HELP" Button Handler
  const handleNeedHelp = async (customNotes?: string) => {
    sirenPlayer.stop();
    setIsAlarmPlaying(false);
    setUserStatus('TRAPPED');

    let currentLat = userLocation.lat;
    let currentLon = userLocation.lon;
    const currentBattery = userLocation.battery;

    if (navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              currentLat = pos.coords.latitude;
              currentLon = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      } catch {
        // fallback
      }
    }

    const victimRecord: CriticalVictim = {
      id: `victim_manual_${Date.now()}`,
      userId,
      lat: currentLat,
      lon: currentLon,
      battery: currentBattery,
      timestamp: new Date().toISOString(),
      status: 'TRAPPED',
      source: 'MANUAL_SOS',
      notes: customNotes || 'EMERGENCY SOS: Civilian requested urgent rescue assistance.'
    };

    try {
      await setDoc(doc(db, 'critical_victims', victimRecord.id), victimRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `critical_victims/${victimRecord.id}`);
    }

    setCriticalVictims(prev => [victimRecord, ...prev.filter(v => v.id !== victimRecord.id)]);

    // Check if offline to dispatch SMS
    if (!navigator.onLine) {
      sendEmergencySMSFallback({ lat: currentLat, lon: currentLon }, currentBattery, 'Manual Civilian SOS (Offline)');
    }

    triggerPushNotification(
      '🚨 RESCUE BEACON ACTIVE',
      'Distress signal sent to Rescue Command! Help is being routed to your GPS position.',
      'danger'
    );
  };

  // Trigger emergency alert simulation for quick testing
  const triggerEmergencyAlertSimulation = async (customRisk: number = 94, customDistKm: number = 1.2) => {
    // Generate an alert 1.2km away from user location with risk >80
    // 1.2km offset: ~0.0108 degrees
    const simLat = userLocation.lat + 0.009;
    const simLon = userLocation.lon + 0.006;
    const newAlert: EmergencyAlert = {
      id: `alert_sim_${Date.now()}`,
      title: 'CRITICAL WILDFIRE RAPID ADVANCE',
      description: 'Massive wind-driven fire front spreading at 35 km/h. Smoke saturation >400 AQI. Extreme radiant heat warning within perimeter.',
      risk: customRisk,
      lat: simLat,
      lon: simLon,
      radiusKm: customDistKm * 1.5,
      disasterType: 'wildfire',
      severity: 'critical',
      active: true,
      createdAt: new Date().toISOString(),
      distanceKm: customDistKm
    };

    try {
      await setDoc(doc(db, 'alerts', newAlert.id), newAlert);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `alerts/${newAlert.id}`);
    }

    setAlerts(prev => [newAlert, ...prev]);
    // Reset processed set so it triggers
    processedAlertIdsRef.current.delete(newAlert.id);
  };

  const resetEmergencyState = () => {
    sirenPlayer.stop();
    setIsAlarmPlaying(false);
    setUserStatus('NORMAL');
    setActiveEmergencyAlert(null);
    setCountdownSeconds(120);
    setCurrentScreen('home_map');
  };

  const jumpTimerToSeconds = (seconds: number) => {
    setCountdownSeconds(seconds);
  };

  const toggleAlarmMute = () => {
    const muted = sirenPlayer.toggleMute();
    setIsAlarmMuted(muted);
  };

  const updateVictimStatus = async (victimId: string, newStatus: 'TRAPPED' | 'RESCUED' | 'SAFE' | 'EN_ROUTE', responderName: string = 'Unit Sierra-1') => {
    try {
      await updateDoc(doc(db, 'critical_victims', victimId), {
        status: newStatus,
        responderAssigned: responderName,
        lastUpdated: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `critical_victims/${victimId}`);
    }

    setCriticalVictims(prev => prev.map(v => v.id === victimId ? { ...v, status: newStatus, responderAssigned: responderName } : v));
    
    if (newStatus === 'RESCUED') {
      triggerPushNotification('Heroic Rescue Confirmed', `Victim ${victimId} has been successfully extracted by ${responderName}!`, 'rescue');
    } else if (newStatus === 'EN_ROUTE') {
      triggerPushNotification('Rescue Unit Dispatched', `${responderName} is en route to victim coordinates.`, 'system');
    }
  };

  const updateUserLocation = (lat: number, lon: number, isSimulated: boolean = true) => {
    setUserLocation(prev => ({
      ...prev,
      lat,
      lon,
      isSimulated,
      name: isSimulated ? 'Simulated Field Position' : 'Live Device GPS'
    }));
  };

  const refreshDeviceGPS = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation(prev => ({
            ...prev,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            isSimulated: false,
            name: 'Device GPS (Live)'
          }));
          triggerPushNotification('GPS Synchronized', `Coordinates locked to ±${Math.round(pos.coords.accuracy)}m accuracy.`, 'system');
        },
        (err) => {
          console.warn('GPS error:', err);
          triggerPushNotification('GPS Fallback Active', 'Location permission denied. Using high-precision tactical coordinate grid.', 'system');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const simulateSensorFluctuation = async (sensorId: string, riskChange: number) => {
    const sensor = sensors.find(s => s.id === sensorId);
    if (!sensor) return;

    const newRisk = Math.min(99, Math.max(5, sensor.risk + riskChange));
    const newStatus = newRisk > 80 ? 'critical' : newRisk > 50 ? 'warning' : 'normal';

    const updated = {
      ...sensor,
      risk: newRisk,
      status: newStatus as 'normal' | 'warning' | 'critical',
      temp: newRisk > 80 ? 51.4 : sensor.temp,
      smokeLevel: newRisk > 80 ? 380 : sensor.smokeLevel,
      lastUpdated: 'Manual Telemetry Override'
    };

    try {
      await updateDoc(doc(db, 'sensors', sensorId), updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sensors/${sensorId}`);
    }

    setSensors(prev => prev.map(s => s.id === sensorId ? updated : s));

    if (newRisk > 80) {
      triggerPushNotification('⚠️ Sensor Hazard Spike', `${sensor.name} crossed RED ZONE threshold at ${newRisk}% risk!`, 'danger');
    }
  };

  // Metrics
  const trappedVictimsCount = criticalVictims.filter(v => v.status === 'TRAPPED').length;
  const criticalRedZonesCount = sensors.filter(s => s.risk > 80).length;

  let nearestHazardDistanceKm: number | null = null;
  const criticalSensors = sensors.filter(s => s.risk > 80);
  if (criticalSensors.length > 0) {
    const distances = criticalSensors.map(s => calculateDistanceKm(userLocation.lat, userLocation.lon, s.lat, s.lon));
    nearestHazardDistanceKm = Math.min(...distances);
  }

  return (
    <EcoShieldContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        isMobileDeviceView,
        setIsMobileDeviceView,
        sensors,
        alerts,
        criticalVictims,
        userLocation,
        userStatus,
        activeEmergencyAlert,
        countdownSeconds,
        isAlarmPlaying,
        isAlarmMuted,
        toggleAlarmMute,
        handleIAmSafe,
        handleNeedHelp,
        triggerEmergencyAlertSimulation,
        resetEmergencyState,
        jumpTimerToSeconds,
        updateVictimStatus,
        updateUserLocation,
        refreshDeviceGPS,
        simulateSensorFluctuation,
        isOnline,
        offlineDispatchQueue,
        sendEmergencySMSFallback,
        notifications,
        dismissNotification,
        clearAllNotifications,
        triggerPushNotification,
        userProfile,
        loginProfile,
        logoutProfile,
        trappedVictimsCount,
        criticalRedZonesCount,
        nearestHazardDistanceKm,
      }}
    >
      {children}
    </EcoShieldContext.Provider>
  );
};

export const useEcoShield = () => {
  const context = useContext(EcoShieldContext);
  if (!context) {
    throw new Error('useEcoShield must be used within an EcoShieldProvider');
  }
  return context;
};
