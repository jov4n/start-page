import { useEffect, useMemo, useRef, useState } from "react";
import {
  Maximize2,
  Monitor,
  Plus,
  Power,
  ScreenShare,
  Trash2,
  Unplug,
  Wifi,
  WifiOff,
} from "lucide-react";
import RFB from "@novnc/novnc";
import clsx from "clsx";

import { useStore } from "../store";
import type { VncProfile } from "../types";

type Status = "idle" | "connecting" | "connected" | "disconnected" | "error";

export function VncApp() {
  const profiles = useStore((s) => s.settings.vncProfiles);
  const lastId = useStore((s) => s.settings.lastVncProfileId);
  const addVncProfile = useStore((s) => s.addVncProfile);
  const updateVncProfile = useStore((s) => s.updateVncProfile);
  const removeVncProfile = useStore((s) => s.removeVncProfile);
  const setLastVncProfileId = useStore((s) => s.setLastVncProfileId);
  const pushToast = useStore((s) => s.pushToast);

  const [selectedId, setSelectedId] = useState<string | undefined>(
    lastId ?? profiles[0]?.id
  );
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<VncProfile | null>(null);
  const [showForm, setShowForm] = useState(profiles.length === 0);

  const screenRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);

  const selected = useMemo(
    () => profiles.find((p) => p.id === selectedId),
    [profiles, selectedId]
  );

  useEffect(() => {
    return () => {
      try {
        rfbRef.current?.disconnect();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function disconnect() {
    try {
      rfbRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    rfbRef.current = null;
    setStatus("idle");
  }

  function connect(profile: VncProfile) {
    if (!screenRef.current) return;
    disconnect();
    setErrorMsg(null);
    setStatus("connecting");
    setLastVncProfileId(profile.id);

    try {
      const rfb = new RFB(screenRef.current, profile.url, {
        credentials: profile.password ? { password: profile.password } : undefined,
      });
      rfb.viewOnly = profile.viewOnly;
      rfb.scaleViewport = profile.scaleToFit;
      rfb.resizeSession = false;
      rfb.background = "transparent";
      rfb.showDotCursor = true;

      rfb.addEventListener("connect", () => {
        setStatus("connected");
        pushToast({
          title: "VNC connected",
          body: profile.name,
          tone: "success",
        });
      });
      rfb.addEventListener("disconnect", (e) => {
        const ev = e as Event & { detail?: { clean?: boolean } };
        setStatus(ev.detail?.clean ? "disconnected" : "error");
        if (!ev.detail?.clean) setErrorMsg("Connection lost.");
      });
      rfb.addEventListener("credentialsrequired", () => {
        const password =
          profile.password ??
          window.prompt(`Password for ${profile.name}`) ??
          "";
        rfb.sendCredentials({ password });
      });
      rfb.addEventListener("securityfailure", (e) => {
        const ev = e as Event & { detail?: { reason?: string } };
        setErrorMsg(`Auth failed: ${ev.detail?.reason ?? "unknown"}`);
        setStatus("error");
      });

      rfbRef.current = rfb;
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }
  }

  function saveProfile(p: Omit<VncProfile, "id"> & { id?: string }) {
    if (p.id) {
      updateVncProfile(p.id, p);
      setSelectedId(p.id);
    } else {
      const id = addVncProfile(p);
      setSelectedId(id);
    }
    setShowForm(false);
    setEditing(null);
  }

  function deleteProfile(id: string) {
    removeVncProfile(id);
    if (selectedId === id) {
      setSelectedId(profiles.find((p) => p.id !== id)?.id);
    }
  }

  return (
    <div className="h-full w-full flex bg-mantle/40">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-base/40 border-r border-line/40 flex flex-col">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-muted font-mono">
            Connections
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-surface/60 text-subtext"
            title="New connection"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-1 py-1">
          {profiles.length === 0 && (
            <div className="px-3 py-6 text-xs text-muted">
              No saved connections.
            </div>
          )}
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              className={clsx(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm group",
                selectedId === p.id
                  ? "bg-surface/70 text-text"
                  : "text-subtext hover:bg-surface/40"
              )}
              onClick={() => {
                setSelectedId(p.id);
                setShowForm(false);
                setEditing(null);
              }}
            >
              <Monitor size={13} className="text-accent shrink-0" />
              <span className="flex-1 truncate">{p.name}</span>
              <span
                className={clsx(
                  "text-[10px] font-mono px-1 rounded",
                  selectedId === p.id && status === "connected"
                    ? "bg-green/20 text-green"
                    : "bg-surface/60 text-muted"
                )}
              >
                {selectedId === p.id ? statusLabel(status) : "•"}
              </span>
            </button>
          ))}
        </div>
        <div className="p-2 text-[10px] text-muted leading-snug border-t border-line/40">
          Needs a websockify proxy in front of your VNC server.
          <br />
          <code className="text-subtext">ws://host:6080/</code>
        </div>
      </aside>

      {/* Main */}
      <section className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="h-9 px-3 flex items-center gap-2 border-b border-line/40 bg-base/30">
          {selected ? (
            <>
              <Monitor size={13} className="text-accent" />
              <span className="text-sm text-text font-mono truncate">
                {selected.name}
              </span>
              <span className="text-xs text-muted truncate">
                {selected.url}
              </span>
              <div className="flex-1" />
              {status === "connected" ? (
                <Wifi size={13} className="text-green" />
              ) : (
                <WifiOff size={13} className="text-muted" />
              )}
              {status !== "connected" ? (
                <button
                  type="button"
                  onClick={() => selected && connect(selected)}
                  disabled={status === "connecting"}
                  className="px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 text-accent text-xs font-mono disabled:opacity-50"
                >
                  {status === "connecting" ? "connecting…" : "connect"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => rfbRef.current?.sendCtrlAltDel()}
                    title="Send Ctrl+Alt+Del"
                    className="px-2 py-1 rounded bg-surface/60 hover:bg-surface text-subtext text-xs font-mono"
                  >
                    C-A-D
                  </button>
                  <button
                    type="button"
                    onClick={() => screenRef.current?.requestFullscreen?.()}
                    title="Fullscreen"
                    className="p-1 rounded hover:bg-surface/60 text-subtext"
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={disconnect}
                    title="Disconnect"
                    className="px-2 py-1 rounded bg-red/20 hover:bg-red/30 text-red text-xs font-mono inline-flex items-center gap-1"
                  >
                    <Unplug size={12} /> disconnect
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditing(selected);
                  setShowForm(true);
                }}
                title="Edit"
                className="p-1 rounded hover:bg-surface/60 text-subtext"
              >
                <ScreenShare size={13} />
              </button>
              <button
                type="button"
                onClick={() => deleteProfile(selected.id)}
                title="Delete"
                className="p-1 rounded hover:bg-red/20 text-muted hover:text-red"
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <span className="text-sm text-muted">No connection selected.</span>
          )}
        </div>

        {/* Body */}
        <div className="relative flex-1 min-h-0 bg-crust/80 overflow-hidden">
          {showForm && (
            <ProfileForm
              key={editing?.id ?? "new"}
              initial={editing}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              onSave={saveProfile}
            />
          )}
          {!showForm && (
            <>
              {/* Pre-connect overlay */}
              {selected && status !== "connected" && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
                  <Power size={28} className="text-accent mb-3" />
                  <div className="text-text font-mono text-sm">
                    {selected.name}
                  </div>
                  <div className="text-muted text-xs font-mono mt-1">
                    {selected.url}
                  </div>
                  {errorMsg && (
                    <div className="mt-3 text-red text-xs font-mono">
                      {errorMsg}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => connect(selected)}
                    disabled={status === "connecting"}
                    className="mt-4 px-4 py-2 rounded bg-accent text-mantle text-sm font-mono hover:bg-accent2 disabled:opacity-50"
                  >
                    {status === "connecting" ? "connecting…" : "Connect"}
                  </button>
                </div>
              )}
              {!selected && profiles.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted text-sm gap-3">
                  <Monitor size={36} className="text-muted/60" />
                  <div>No VNC connections saved yet.</div>
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="px-3 py-1.5 rounded bg-accent/20 text-accent text-xs font-mono hover:bg-accent/30"
                  >
                    Add a connection
                  </button>
                </div>
              )}
              <div
                ref={screenRef}
                className={clsx(
                  "absolute inset-0",
                  status === "connected" ? "block" : "opacity-0 pointer-events-none"
                )}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function statusLabel(s: Status): string {
  switch (s) {
    case "connected":
      return "ON";
    case "connecting":
      return "...";
    case "error":
      return "ERR";
    case "disconnected":
      return "OFF";
    default:
      return "•";
  }
}

interface ProfileFormProps {
  initial: VncProfile | null;
  onCancel: () => void;
  onSave: (p: Omit<VncProfile, "id"> & { id?: string }) => void;
}

function ProfileForm({ initial, onCancel, onSave }: ProfileFormProps) {
  const [name, setName] = useState(initial?.name ?? "My VNC");
  const [url, setUrl] = useState(initial?.url ?? "ws://localhost:6080/");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [scaleToFit, setScaleToFit] = useState(initial?.scaleToFit ?? true);
  const [viewOnly, setViewOnly] = useState(initial?.viewOnly ?? false);

  return (
    <div className="absolute inset-0 z-20 bg-base/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        className="w-full max-w-md bg-mantle border border-line rounded-2xl shadow-window p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          onSave({
            id: initial?.id,
            name: name.trim() || "Unnamed",
            url: url.trim(),
            password: password || undefined,
            scaleToFit,
            viewOnly,
          });
        }}
      >
        <h2 className="text-text text-sm font-mono mb-4 flex items-center gap-2">
          <Monitor size={14} className="text-accent" />
          {initial ? "Edit connection" : "New VNC connection"}
        </h2>

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface text-text rounded px-2 py-1.5 text-sm border border-line focus:border-accent outline-none"
            autoFocus
          />
        </Field>

        <Field label="WebSocket URL">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ws://host:6080/  or  wss://host/websockify"
            className="w-full bg-surface text-text font-mono rounded px-2 py-1.5 text-xs border border-line focus:border-accent outline-none"
          />
          <p className="text-[10px] text-muted mt-1 leading-snug">
            Run{" "}
            <code className="text-subtext">
              ./utils/novnc_proxy --vnc localhost:5901
            </code>{" "}
            on your server to expose the VNC port over WebSocket.
          </p>
        </Field>

        <Field label="Password (optional, stored locally)">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full bg-surface text-text rounded px-2 py-1.5 text-sm border border-line focus:border-accent outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <label className="flex items-center gap-2 text-xs text-subtext">
            <input
              type="checkbox"
              checked={scaleToFit}
              onChange={(e) => setScaleToFit(e.target.checked)}
              className="accent-accent"
            />
            Scale to fit
          </label>
          <label className="flex items-center gap-2 text-xs text-subtext">
            <input
              type="checkbox"
              checked={viewOnly}
              onChange={(e) => setViewOnly(e.target.checked)}
              className="accent-accent"
            />
            View only
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded text-sm text-subtext hover:bg-surface/60"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-accent text-mantle text-sm font-mono hover:bg-accent2"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] uppercase tracking-wider text-muted font-mono mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
