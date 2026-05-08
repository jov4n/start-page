import type { TemperatureUnit } from "../types";

/** Open-Meteo reports Celsius; convert for display only. */
export function formatTempDisplay(celsius: number, unit: TemperatureUnit): string {
  if (unit === "fahrenheit") {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}