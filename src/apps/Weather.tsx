import { useEffect, useState } from "react";
import { Search, Wind } from "lucide-react";
import { useStore } from "../store";
import {
  WEATHER_CODE_LABEL,
  fetchWeatherForecast,
  geocodeCity,
  weatherGlyph,
} from "../lib/weather-openmeteo";
import { formatTempDisplay } from "../lib/temperature";

interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  is_day: number;
  time: string;
}

interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weathercode: number[];
}

interface Forecast {
  city: string;
  current: CurrentWeather;
  daily: DailyWeather;
}

export function WeatherApp() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [city, setCity] = useState(settings.city ?? "");
  const [data, setData] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const place = await geocodeCity(c);
      if (!place) {
        setError("City not found");
        setData(null);
        return;
      }
      const w = await fetchWeatherForecast(place.latitude, place.longitude);
      setData({
        city: `${place.name}${place.country_code ? ", " + place.country_code : ""}`,
        current: w.current_weather,
        daily: w.daily,
      });
      setSettings({ city: c });
    } catch (e) {
      setError("Failed to fetch weather. Check your network.");
      void e;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (settings.city) load(settings.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col p-5 gap-4 overflow-auto">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(city);
        }}
      >
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city…"
            className="w-full bg-white/5 rounded-md pl-7 pr-3 py-1.5 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="text-sm px-3 py-1.5 rounded-md bg-accent/30 hover:bg-accent/40 text-accent transition"
        >
          Go
        </button>
      </form>

      {loading && <div className="text-muted text-sm">Loading…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {data && (
        <>
          <div className="rounded-xl glass p-5 flex items-center gap-5">
            <div>{weatherGlyph(data.current.weathercode, 56)}</div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-muted">{data.city}</div>
              <div className="text-5xl font-light tabular-nums">
                {formatTempDisplay(data.current.temperature, settings.temperatureUnit)}
              </div>
              <div className="text-sm text-muted">
                {WEATHER_CODE_LABEL[data.current.weathercode] ?? "—"}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Wind size={14} /> {data.current.windspeed} km/h
              </span>
              <span>{new Date(data.current.time).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {data.daily.time.map((d, i) => (
              <div
                key={d}
                className="rounded-md bg-white/5 px-2 py-3 flex flex-col items-center gap-1 text-xs"
              >
                <span className="text-muted">
                  {new Date(d).toLocaleDateString([], { weekday: "short" })}
                </span>
                {weatherGlyph(data.daily.weathercode[i], 18)}
                <span className="font-medium">
                  {formatTempDisplay(data.daily.temperature_2m_max[i], settings.temperatureUnit)}
                </span>
                <span className="text-muted/70">
                  {formatTempDisplay(data.daily.temperature_2m_min[i], settings.temperatureUnit)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-muted text-sm">
          Enter a city to see the weather. Powered by Open-Meteo (no API key needed).
        </div>
      )}
    </div>
  );
}
