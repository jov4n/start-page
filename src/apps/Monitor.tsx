import { useEffect, useRef, useState } from "react";

interface BatteryLike {
  level: number;
  charging: boolean;
  addEventListener(type: string, fn: () => void): void;
  removeEventListener(type: string, fn: () => void): void;
}

interface ConnLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?(type: string, fn: () => void): void;
  removeEventListener?(type: string, fn: () => void): void;
}

type NavigatorExtras = Navigator & {
  getBattery?: () => Promise<BatteryLike>;
  connection?: ConnLike;
  mozConnection?: ConnLike;
};

interface Series {
  cpu: number[];
  ram: number[];
  net: number[];
}

const N = 60;
const TICK_MS = 800;

/** Chrome/Chromium — JS heap vs limit (not full OS RAM). */
function jsHeapPercent(): number | null {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };
  const m = perf.memory;
  if (!m?.jsHeapSizeLimit) return null;
  const p = (m.usedJSHeapSize / m.jsHeapSizeLimit) * 100;
  return clamp(p, 0, 100);
}

async function pingRoundTripMs(): Promise<number | null> {
  const t0 = performance.now();
  try {
    await fetch(`${location.origin}${location.pathname}?__mon=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      priority: "low",
    } as RequestInit);
  } catch {
    try {
      await fetch(`${location.origin}/`, { method: "GET", cache: "no-store", priority: "low" } as RequestInit);
    } catch {
      return null;
    }
  }
  return Math.round(performance.now() - t0);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pressureToCpuApprox(state: string): number {
  switch (state) {
    case "critical":
      return 92;
    case "serious":
      return 72;
    case "fair":
      return 48;
    case "nominal":
    default:
      return 18;
  }
}

function formatSessionUptime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((x) => x.toString().padStart(2, "0")).join(":");
}

export function MonitorApp() {
  const [series, setSeries] = useState<Series>({
    cpu: Array(N).fill(0),
    ram: Array(N).fill(0),
    net: Array(N).fill(0),
  });
  const [meta, setMeta] = useState({
    cpuHint: "Measuring…",
    ramHint: "Measuring…",
    netHint: "Measuring…",
    uptime: "00:00:00",
    cores: navigator.hardwareConcurrency ?? null as number | null,
    deviceRamGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
    batteryLevel: null as number | null,
    batteryCharging: null as boolean | null,
    connSummary: "",
    cpuSource: "none" as "pressure" | "longtask" | "none",
    lastPingMs: null as number | null,
  });

  const pressureCpuRef = useRef<number | null>(null);
  const longTaskMsRef = useRef(0);
  const pressureObsRef = useRef<{ disconnect: () => void } | null>(null);
  const longTaskObsRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    const navMs = performance.timeOrigin ?? Date.now() - performance.now();

    const PO = (
      globalThis as unknown as {
        PressureObserver?: new (
          cb: (records: readonly { state?: string }[]) => void,
          opts?: { sampleInterval?: number }
        ) => { observe(source: string): void | Promise<void>; disconnect(): void };
      }
    ).PressureObserver;

    if (PO) {
      try {
        const obs = new PO((records) => {
          const last = records[records.length - 1];
          const st = last?.state ?? "nominal";
          pressureCpuRef.current = pressureToCpuApprox(st);
        }, { sampleInterval: 1000 });
        void Promise.resolve(obs.observe("cpu")).catch(() => {
          pressureCpuRef.current = null;
          obs.disconnect();
          if (pressureObsRef.current === obs) pressureObsRef.current = null;
          setMeta((m) =>
            m.cpuSource === "pressure"
              ? { ...m, cpuSource: "longtask", cpuHint: "Main-thread long tasks (tab CPU proxy)" }
              : m
          );
        });
        pressureObsRef.current = obs;
        setMeta((m) => ({
          ...m,
          cpuSource: "pressure",
          cpuHint: "Compute Pressure API (browser/OS hint)",
        }));
      } catch {
        pressureCpuRef.current = null;
      }
    }

    try {
      const lt = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          longTaskMsRef.current += (e as { duration: number }).duration;
        }
      });
      lt.observe({ type: "longtask", buffered: true });
      longTaskObsRef.current = lt;
      setMeta((m) =>
        m.cpuSource === "none"
          ? { ...m, cpuSource: "longtask", cpuHint: "Main-thread long tasks (tab CPU proxy)" }
          : m
      );
    } catch {
      /* Safari / some contexts */
    }

    let cancelled = false;
    const cleanups: (() => void)[] = [];

    const n = navigator as NavigatorExtras;
    if (n.getBattery) {
      void n.getBattery().then((b) => {
        if (cancelled) return;
        const sync = () =>
          setMeta((m) => ({
            ...m,
            batteryLevel: Math.round(b.level * 100),
            batteryCharging: b.charging,
          }));
        sync();
        b.addEventListener("levelchange", sync);
        b.addEventListener("chargingchange", sync);
        cleanups.push(() => {
          b.removeEventListener("levelchange", sync);
          b.removeEventListener("chargingchange", sync);
        });
      });
    }

    const nc = n.connection ?? n.mozConnection;
    if (nc) {
      const summarize = () => {
        const parts: string[] = [];
        if (nc.effectiveType) parts.push(nc.effectiveType);
        if (nc.downlink != null) parts.push(`↓${nc.downlink} Mb/s`);
        if (nc.rtt != null) parts.push(`RTT ~${nc.rtt} ms`);
        setMeta((m) => ({ ...m, connSummary: parts.join(" · ") }));
      };
      summarize();
      nc.addEventListener?.("change", summarize);
      cleanups.push(() => nc.removeEventListener?.("change", summarize));
    }

    const id = window.setInterval(async () => {
      const uptimeMs = Date.now() - navMs;

      let cpuVal = pressureCpuRef.current;
      if (cpuVal != null) {
        longTaskMsRef.current = 0;
      } else {
        const ltMs = longTaskMsRef.current;
        longTaskMsRef.current = 0;
        cpuVal = clamp((ltMs / TICK_MS) * 100, 0, 100);
      }

      const ramVal = jsHeapPercent();
      const pingMs = await pingRoundTripMs();
      const netChart =
        pingMs == null ? 0 : clamp((pingMs / 400) * 100, 0, 100);

      setSeries((s) => ({
        cpu: [...s.cpu.slice(1), cpuVal ?? 0],
        ram: [...s.ram.slice(1), ramVal ?? 0],
        net: [...s.net.slice(1), netChart],
      }));

      setMeta((m) => ({
        ...m,
        uptime: formatSessionUptime(uptimeMs),
        lastPingMs: pingMs,
        cpuHint:
          m.cpuSource === "pressure"
            ? "Compute Pressure API"
            : m.cpuSource === "longtask"
              ? "Long tasks on this tab's main thread"
              : "No CPU signal — blocked by browser",
        ramHint:
          ramVal != null
            ? "JavaScript heap (Chromium) — not total system RAM"
            : "Unavailable — open in Chromium or Edge for heap stats",
        netHint:
          pingMs != null
            ? "HEAD ping to this origin (rough RTT)"
            : "Could not ping origin",
      }));
    }, TICK_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      pressureObsRef.current?.disconnect();
      pressureObsRef.current = null;
      longTaskObsRef.current?.disconnect();
      longTaskObsRef.current = null;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const cpu = series.cpu[series.cpu.length - 1];

  return (
    <div className="h-full p-4 flex flex-col gap-4 overflow-auto">
      <p className="text-[11px] text-muted leading-relaxed">
        Browsers cannot read OS-wide CPU/RAM like Task Manager. This panel uses whatever APIs exist:
        Compute Pressure, JS heap (Chrome), main-thread long tasks, and same-origin ping latency.
      </p>

      <Stat
        title="CPU hint"
        subtitle={meta.cpuHint}
        value={`${cpu.toFixed(0)}%`}
        data={series.cpu}
        color="rgb(var(--accent))"
      />
      <Stat
        title="JS heap"
        subtitle={meta.ramHint}
        value={
          meta.ramHint.startsWith("Unavailable")
            ? "—"
            : `${series.ram[series.ram.length - 1].toFixed(0)}%`
        }
        data={series.ram}
        color="rgb(167 139 250)"
      />
      <Stat
        title="Ping"
        subtitle={meta.netHint}
        value={meta.lastPingMs != null ? `${meta.lastPingMs} ms` : "—"}
        data={series.net}
        color="rgb(52 211 153)"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Pill label="Tab uptime" value={meta.uptime} />
        <Pill label="Logical cores" value={meta.cores != null ? String(meta.cores) : "—"} />
        <Pill
          label="Device RAM (approx)"
          value={meta.deviceRamGb != null ? `~${meta.deviceRamGb} GB` : "—"}
        />
        <Pill
          label="Battery"
          value={
            meta.batteryLevel != null
              ? `${meta.batteryLevel}%${meta.batteryCharging ? " · charging" : ""}`
              : "—"
          }
        />
      </div>
      {meta.connSummary ? (
        <div className="text-[11px] text-subtext font-mono">{meta.connSummary}</div>
      ) : null}
    </div>
  );
}

function Stat({
  title,
  subtitle,
  value,
  data,
  color,
}: {
  title: string;
  subtitle?: string;
  value: string;
  data: number[];
  color: string;
}) {
  const w = 540;
  const h = 60;
  const max = 100;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  const safeId = title.replace(/\s+/g, "-");

  return (
    <div className="rounded-xl glass p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className="text-xs uppercase tracking-widest text-muted">{title}</span>
          {subtitle ? (
            <div className="text-[10px] text-muted/90 mt-0.5 leading-snug">{subtitle}</div>
          ) : null}
        </div>
        <span className="font-mono tabular-nums shrink-0">{value}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-14">
        <defs>
          <linearGradient id={`g-${safeId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#g-${safeId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/5 px-3 py-2 flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <span className="font-mono tabular-nums truncate" title={value}>
        {value}
      </span>
    </div>
  );
}
