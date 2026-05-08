import { lazy, Suspense, type ComponentType } from "react";
import type { AppId } from "../types";
import { QuickLinks } from "./QuickLinks";
import { SearchApp } from "./SearchApp";
import { SettingsApp } from "./Settings";
import { FilesApp } from "./Files";
import { NotesApp } from "./Notes";
import { ClockApp } from "./Clock";
import { CalculatorApp } from "./Calculator";
import { MonitorApp } from "./Monitor";
import { WeatherApp } from "./Weather";
import { ReaderApp } from "./Reader";
import { AboutApp } from "./About";

// Heavy apps load on demand to keep the initial bundle small.
const TerminalApp = lazy(() =>
  import("./Terminal").then((m) => ({ default: m.TerminalApp }))
);
const GamesApp = lazy(() =>
  import("./Games").then((m) => ({ default: m.GamesApp }))
);
const VncApp = lazy(() =>
  import("./Vnc").then((m) => ({ default: m.VncApp }))
);
const CodeApp = lazy(() =>
  import("./Code").then((m) => ({ default: m.CodeApp }))
);
const PaintApp = lazy(() =>
  import("./Paint").then((m) => ({ default: m.PaintApp }))
);

function withSuspense(Comp: ComponentType): ComponentType {
  return function Wrapped() {
    return (
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center text-muted text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin-slow" />
          </div>
        }
      >
        <Comp />
      </Suspense>
    );
  };
}

export const APP_COMPONENTS: Record<AppId, ComponentType> = {
  links: QuickLinks,
  search: SearchApp,
  terminal: withSuspense(TerminalApp),
  settings: SettingsApp,
  files: FilesApp,
  notes: NotesApp,
  clock: ClockApp,
  calculator: CalculatorApp,
  monitor: MonitorApp,
  weather: WeatherApp,
  reader: ReaderApp,
  games: withSuspense(GamesApp),
  vnc: withSuspense(VncApp),
  code: withSuspense(CodeApp),
  bitmappery: withSuspense(PaintApp),
  about: AboutApp,
};
