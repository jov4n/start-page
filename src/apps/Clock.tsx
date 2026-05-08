import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Mode = "clock" | "stopwatch" | "timer";

export function ClockApp() {
  const [mode, setMode] = useState<Mode>("clock");
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-center gap-1 p-2 border-b border-white/5">
        {(["clock", "stopwatch", "timer"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              "text-xs px-3 py-1.5 rounded-md transition capitalize",
              mode === m ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-muted"
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center">
        {mode === "clock" && <AnalogClock />}
        {mode === "stopwatch" && <Stopwatch />}
        {mode === "timer" && <Timer />}
      </div>
    </div>
  );
}

function AnalogClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(i);
  }, []);
  const s = now.getSeconds();
  const m = now.getMinutes();
  const h = now.getHours() % 12;
  const sa = (s / 60) * 360;
  const ma = ((m + s / 60) / 60) * 360;
  const ha = ((h + m / 60) / 12) * 360;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-56 h-56 rounded-full bg-panel2/60 border border-white/10 shadow-window">
        {/* Ticks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 origin-top-left"
            style={{
              transform: `rotate(${i * 30}deg) translate(-50%, -50%)`,
            }}
          >
            <div
              className="w-0.5 h-3 bg-white/40 rounded"
              style={{ transform: "translate(50%, -50%) translateY(-100px)" }}
            />
          </div>
        ))}
        {/* Hour */}
        <Hand angle={ha} length={56} thickness={3} color="rgb(var(--ink))" />
        {/* Minute */}
        <Hand angle={ma} length={84} thickness={2} color="rgb(var(--ink))" />
        {/* Second */}
        <Hand angle={sa} length={92} thickness={1} color="rgb(var(--accent))" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-glow" />
        </div>
      </div>
      <div className="text-2xl font-mono tabular-nums">
        {now.toLocaleTimeString([], { hour12: false })}
      </div>
      <div className="text-xs text-muted">
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
}

function Hand({ angle, length, thickness, color }: { angle: number; length: number; thickness: number; color: string }) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: thickness,
        height: length,
        background: color,
        borderRadius: 2,
        transformOrigin: "center bottom",
        transform: `translate(-50%, -100%) rotate(${angle}deg)`,
      }}
    />
  );
}

function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    lastTickRef.current = performance.now();
    const loop = (t: number) => {
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      setMs((m) => m + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const total = Math.floor(ms);
  const min = Math.floor(total / 60000);
  const sec = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-5xl font-mono tabular-nums tracking-wider">
        {pad(min)}:{pad(sec)}
        <span className="text-2xl text-muted">.{pad(cs)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-4 py-1.5 rounded-md bg-accent/30 text-accent hover:bg-accent/40 transition"
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setMs(0);
          }}
          className="px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Timer() {
  const [target, setTarget] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          try {
            new Notification("Nebula Timer", { body: "Time's up!" });
          } catch {
            // ignore
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [running]);

  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-5xl font-mono tabular-nums">
        {pad(min)}:{pad(sec)}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-1">
          Set
          <input
            type="number"
            value={target}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value));
              setTarget(v);
              if (!running) setRemaining(v);
            }}
            className="bg-white/5 rounded px-2 py-1 w-20 outline-none"
          />
          sec
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-4 py-1.5 rounded-md bg-accent/30 text-accent hover:bg-accent/40 transition"
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(target);
          }}
          className="px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
