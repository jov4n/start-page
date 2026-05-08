import { Cloud, CloudRain, CloudSnow, Sun } from "lucide-react";
import { createElement } from "react";
import type { ReactNode } from "react";

export interface GeocodeHit {
  name: string;
  country_code?: string;
  latitude: number;
  longitude: number;
}

export async function geocodeCity(name: string): Promise<GeocodeHit | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`
  );
  const data = await res.json();
  return data.results?.[0] ?? null;
}

export interface CurrentWeatherPayload {
  temperature: number;
  windspeed: number;
  weathercode: number;
  is_day: number;
  time: string;
}

export interface OpenMeteoForecastJson {
  current_weather: CurrentWeatherPayload;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

export async function fetchWeatherForecast(
  lat: number,
  lon: number
): Promise<OpenMeteoForecastJson> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  return res.json();
}

export const WEATHER_CODE_LABEL: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Thunderstorm + heavy hail",
};

export function weatherGlyph(code: number, size = 20): ReactNode {
  if (code === 0 || code === 1)
    return createElement(Sun, { size, className: "text-yellow-300" });
  if ([2, 3, 45, 48].includes(code))
    return createElement(Cloud, { size, className: "text-slate-300" });
  if (code >= 71 && code <= 77)
    return createElement(CloudSnow, { size, className: "text-cyan-200" });
  if (code >= 51 && code <= 82)
    return createElement(CloudRain, { size, className: "text-sky-300" });
  return createElement(Cloud, { size, className: "text-slate-300" });
}
