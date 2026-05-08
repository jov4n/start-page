import { useEffect, useState } from "react";
import { fetchWeatherForecast, geocodeCity } from "../lib/weather-openmeteo";

export interface WeatherSnapshot {
  cityLabel: string;
  temperature: number;
  weathercode: number;
  windspeed: number;
}

type CacheEntry = {
  queryNorm: string;
  fetchedAt: number;
  snapshot: WeatherSnapshot;
};

const TTL_MS = 12 * 60 * 1000;
let cache: CacheEntry | null = null;

async function resolveSnapshot(rawCity: string): Promise<WeatherSnapshot | null> {
  const trimmed = rawCity.trim();
  if (!trimmed) return null;
  const queryNorm = trimmed.toLowerCase();

  if (
    cache &&
    cache.queryNorm === queryNorm &&
    Date.now() - cache.fetchedAt < TTL_MS
  ) {
    return cache.snapshot;
  }

  const place = await geocodeCity(trimmed);
  if (!place) return null;

  const w = await fetchWeatherForecast(place.latitude, place.longitude);
  const snapshot: WeatherSnapshot = {
    cityLabel: `${place.name}${place.country_code ? ", " + place.country_code : ""}`,
    temperature: w.current_weather.temperature,
    weathercode: w.current_weather.weathercode,
    windspeed: w.current_weather.windspeed,
  };

  cache = {
    queryNorm,
    fetchedAt: Date.now(),
    snapshot,
  };
  return snapshot;
}

/** Shared cached snapshot for idle desktop + waybar (same city = one geocode/forecast burst). */
export function useWeatherSnapshot(city: string | undefined | null) {
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(() => {
    const q = city?.trim().toLowerCase() ?? "";
    if (
      cache &&
      cache.queryNorm === q &&
      Date.now() - cache.fetchedAt < TTL_MS
    ) {
      return cache.snapshot;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const trimmed = city?.trim();
    if (!trimmed) {
      setSnapshot(null);
      setLoading(false);
      setFailed(false);
      return;
    }

    const q = trimmed.toLowerCase();
    if (
      cache &&
      cache.queryNorm === q &&
      Date.now() - cache.fetchedAt < TTL_MS
    ) {
      setSnapshot(cache.snapshot);
      setLoading(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    resolveSnapshot(trimmed)
      .then((s) => {
        if (cancelled) return;
        setSnapshot(s);
        setLoading(false);
        setFailed(s === null);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setFailed(true);
        }
      });

    const interval = setInterval(() => {
      resolveSnapshot(trimmed)
        .then((s) => {
          if (!cancelled && s) setSnapshot(s);
        })
        .catch(() => {});
    }, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [city]);

  return { snapshot, loading, failed };
}
