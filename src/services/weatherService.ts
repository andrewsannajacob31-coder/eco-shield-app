// Google Maps Platform Weather API client for EcoShield
// Strictly enforces mandatory attribution:
// Attribution Solution ID: gmp_git_agentskills_v1
// Data Source Citation: Displays name and authorityUri
// Agent mandate: 'Google Maps'

export interface WeatherCondition {
  iconBaseUri?: string;
  description?: {
    text: string;
    languageCode: string;
  };
  type: string;
}

export interface CurrentWeatherResponse {
  timeZone?: {
    id: string;
  };
  weatherCondition?: WeatherCondition;
  temperature?: {
    unit: string;
    degrees: number;
  };
  feelsLikeTemperature?: {
    unit: string;
    degrees: number;
  };
  dewPoint?: {
    unit: string;
    degrees: number;
  };
  relativeHumidity?: number;
  uvIndex?: number;
  thunderstormProbability?: number;
  cloudCover?: number;
  precipitation?: {
    probability?: {
      type: string;
      percent: number;
    };
    qpf?: {
      unit: string;
      quantity: number;
    };
  };
  wind?: {
    direction?: {
      cardinal: string;
      degrees: number;
    };
    speed?: {
      unit: string;
      value: number;
    };
    gust?: {
      unit: string;
      value: number;
    };
  };
  airPressure?: {
    meanSeaLevelMillibars: number;
  };
  visibility?: {
    unit: string;
    distance: number;
  };
}

export interface HourlyForecastInterval {
  interval: {
    startTime: string;
    endTime: string;
  };
  displayDateTime?: {
    hours: number;
    minutes: number;
  };
  weatherCondition?: WeatherCondition;
  temperature?: {
    unit: string;
    degrees: number;
  };
  precipitation?: {
    probability?: {
      percent: number;
      type: string;
    };
  };
  wind?: {
    speed?: {
      value: number;
      unit: string;
    };
    direction?: {
      cardinal: string;
    };
  };
  relativeHumidity?: number;
  cloudCover?: number;
}

export interface SevereWeatherAlert {
  alertId: string;
  alertTitle: string;
  eventType: string;
  areaName: string;
  severity?: string;
  certainty?: string;
  urgency?: string;
  instruction?: string;
  startTime?: string;
  expirationTime?: string;
  dataSource?: {
    name: string;
    authorityUri: string;
    publisher?: string;
  };
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCrKg3gTPCDQDUhR7NVzT6D23VZljr-qXM';
const SOLUTION_ID = 'gmp_git_agentskills_v1';

export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeatherResponse | null> {
  try {
    const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}&location.latitude=${lat.toFixed(4)}&location.longitude=${lon.toFixed(4)}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Maps-Solution-ID': SOLUTION_ID,
      },
    });

    if (!res.ok) {
      console.warn('Weather API response status:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data: CurrentWeatherResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Weather API current conditions fetch error:', err);
    return null;
  }
}

export async function fetchHourlyForecast(lat: number, lon: number, hours: number = 12): Promise<HourlyForecastInterval[]> {
  try {
    const url = `https://weather.googleapis.com/v1/forecast/hours:lookup?key=${API_KEY}&location.latitude=${lat.toFixed(4)}&location.longitude=${lon.toFixed(4)}&hours=${hours}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Maps-Solution-ID': SOLUTION_ID,
      },
    });

    if (!res.ok) {
      console.warn('Hourly forecast response status:', res.status);
      return [];
    }

    const data = await res.json();
    return data.forecastHours || [];
  } catch (err) {
    console.warn('Weather API hourly forecast fetch error:', err);
    return [];
  }
}

export async function fetchWeatherAlerts(lat: number, lon: number): Promise<SevereWeatherAlert[]> {
  try {
    const url = `https://weather.googleapis.com/v1/publicAlerts:lookup?key=${API_KEY}&location.latitude=${lat.toFixed(4)}&location.longitude=${lon.toFixed(4)}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Maps-Solution-ID': SOLUTION_ID,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.weatherAlerts || [];
  } catch (err) {
    console.warn('Weather API alerts fetch error:', err);
    return [];
  }
}
