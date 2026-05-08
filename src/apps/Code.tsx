import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  Code2,
  ExternalLink,
  FileCode,
  FilePlus,
  Globe,
  Server,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";

import { useStore } from "../store";
import type { CodeFile } from "../types";

const LANGS = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "json",
  "html",
  "css",
  "scss",
  "markdown",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "shell",
  "yaml",
  "sql",
  "plaintext",
];

function extToLang(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return (
    {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      mjs: "javascript",
      cjs: "javascript",
      json: "json",
      html: "html",
      htm: "html",
      css: "css",
      scss: "scss",
      md: "markdown",
      markdown: "markdown",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      c: "c",
      h: "c",
      cpp: "cpp",
      cc: "cpp",
      hpp: "cpp",
      cs: "csharp",
      rb: "ruby",
      sh: "shell",
      bash: "shell",
      zsh: "shell",
      yml: "yaml",
      yaml: "yaml",
      sql: "sql",
      txt: "plaintext",
    }[ext] ?? "plaintext"
  );
}

export function CodeApp() {
  const files = useStore((s) => s.codeFiles);
  const addCodeFile = useStore((s) => s.addCodeFile);
  const updateCodeFile = useStore((s) => s.updateCodeFile);
  const removeCodeFile = useStore((s) => s.removeCodeFile);
  const theme = useStore((s) => s.settings.theme);
  const codeRemoteUrl = useStore((s) => s.settings.codeRemoteUrl);
  const setSettings = useStore((s) => s.setSettings);

  const [activeId, setActiveId] = useState<string | undefined>(files[0]?.id);
  const [showRemote, setShowRemote] = useState(false);

  // Make sure active is always valid
  useEffect(() => {
    if (!files.find((f) => f.id === activeId)) {
      setActiveId(files[0]?.id);
    }
  }, [files, activeId]);

  const active = useMemo(
    () => files.find((f) => f.id === activeId),
    [files, activeId]
  );

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  function newFile() {
    const id = addCodeFile({
      name: "untitled.ts",
      language: "typescript",
      body: "",
    });
    setActiveId(id);
  }

  function rename(file: CodeFile, name: string) {
    if (!name.trim()) return;
    const language = extToLang(name);
    updateCodeFile(file.id, { name, language });
  }

  function close(id: string) {
    removeCodeFile(id);
    if (activeId === id) {
      const remaining = files.filter((f) => f.id !== id);
      setActiveId(remaining[0]?.id);
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-mantle/60">
      {/* Toolbar */}
      <div className="h-9 px-2 flex items-center gap-1 border-b border-line/40 bg-base/30 shrink-0">
        <Code2 size={14} className="text-accent ml-1 mr-2" />
        <button
          type="button"
          onClick={newFile}
          title="New file"
          className="p-1 rounded hover:bg-surface/60 text-subtext"
        >
          <FilePlus size={14} />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowRemote(!showRemote)}
          className={clsx(
            "px-2 py-1 rounded text-xs font-mono inline-flex items-center gap-1",
            showRemote
              ? "bg-accent/20 text-accent"
              : "text-subtext hover:bg-surface/60"
          )}
          title="Remote VS Code"
        >
          <Server size={12} /> remote
        </button>
      </div>

      {/* Tabs */}
      <div className="flex h-8 border-b border-line/40 bg-base/20 shrink-0 overflow-x-auto">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveId(f.id)}
            className={clsx(
              "group flex items-center gap-1.5 pl-3 pr-1 text-xs border-r border-line/40 transition-colors shrink-0",
              activeId === f.id
                ? "bg-mantle text-text"
                : "bg-base/40 text-subtext hover:bg-base/60"
            )}
          >
            <FileCode size={11} className="text-accent shrink-0" />
            <span className="font-mono truncate max-w-[180px]">{f.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                close(f.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") close(f.id);
              }}
              className="p-0.5 rounded hover:bg-red/20 hover:text-red text-muted opacity-0 group-hover:opacity-100"
              aria-label="Close file"
            >
              <X size={11} />
            </span>
          </button>
        ))}
        {files.length === 0 && (
          <div className="px-3 py-1.5 text-xs text-muted font-mono">
            No files. Click + to create one.
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 relative">
        {showRemote && (
          <RemotePanel
            url={codeRemoteUrl}
            onChange={(u) => setSettings({ codeRemoteUrl: u })}
            onClose={() => setShowRemote(false)}
          />
        )}

        {!showRemote && active && (
          <div className="h-full flex flex-col">
            <FileMeta file={active} onRename={(n) => rename(active, n)} />
            <div className="flex-1 min-h-0">
              <Editor
                key={active.id}
                value={active.body}
                language={active.language}
                onMount={handleMount}
                onChange={(v) =>
                  updateCodeFile(active.id, { body: v ?? "" })
                }
                theme={monacoThemeFor(theme)}
                options={{
                  fontFamily:
                    "JetBrains Mono, Fira Code, ui-monospace, monospace",
                  fontSize: 13,
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  renderWhitespace: "selection",
                  padding: { top: 12, bottom: 12 },
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />
            </div>
          </div>
        )}

        {!showRemote && !active && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted">
            <Code2 size={36} className="text-muted/60" />
            <div className="text-sm">No file open.</div>
            <button
              type="button"
              onClick={newFile}
              className="px-3 py-1.5 rounded bg-accent/20 text-accent text-xs font-mono hover:bg-accent/30"
            >
              New file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FileMeta({
  file,
  onRename,
}: {
  file: CodeFile;
  onRename: (name: string) => void;
}) {
  const updateCodeFile = useStore((s) => s.updateCodeFile);
  const removeCodeFile = useStore((s) => s.removeCodeFile);
  const [name, setName] = useState(file.name);
  useEffect(() => setName(file.name), [file.name]);

  return (
    <div className="h-8 px-3 flex items-center gap-2 border-b border-line/40 bg-base/20 shrink-0">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== file.name && onRename(name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="bg-transparent outline-none text-xs font-mono text-text px-1 rounded focus:bg-surface/40"
      />
      <select
        value={file.language}
        onChange={(e) =>
          updateCodeFile(file.id, { language: e.target.value })
        }
        className="bg-transparent text-[10px] text-muted font-mono outline-none cursor-pointer"
      >
        {LANGS.map((l) => (
          <option key={l} value={l} className="bg-mantle text-text">
            {l}
          </option>
        ))}
      </select>
      <div className="flex-1" />
      <span className="text-[10px] text-muted font-mono">
        {timeAgo(file.updatedAt)}
      </span>
      <button
        type="button"
        onClick={() => removeCodeFile(file.id)}
        title="Delete file"
        className="p-1 rounded hover:bg-red/20 text-muted hover:text-red"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function RemotePanel({
  url,
  onChange,
  onClose,
}: {
  url: string | undefined;
  onChange: (u: string | undefined) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(url ?? "");
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(url);
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="absolute inset-0 bg-mantle/95 flex flex-col">
      <div className="px-4 py-3 border-b border-line/40 flex items-center gap-2">
        <Server size={14} className="text-accent" />
        <span className="text-text text-sm font-mono">Remote VS Code</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-surface/60 text-subtext"
        >
          <X size={14} />
        </button>
      </div>

      {!iframeSrc && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h3 className="text-text text-sm font-mono mb-2 inline-flex items-center gap-2">
              <Globe size={13} className="text-accent" /> Hosted editors
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              These open in a new tab — they explicitly block iframe embedding.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <RemoteCard
                title="vscode.dev"
                url="https://vscode.dev/"
                blurb="Microsoft's official browser VS Code."
              />
              <RemoteCard
                title="github.dev"
                url="https://github.dev/"
                blurb="VS Code on github.com — open any repo with `.`"
              />
              <RemoteCard
                title="github1s"
                url="https://github1s.com/"
                blurb="Browse a GitHub repo as a VS Code workspace."
              />
            </div>
          </div>

          <div>
            <h3 className="text-text text-sm font-mono mb-2 inline-flex items-center gap-2">
              <Server size={13} className="text-accent" /> Your code-server
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Saved across reloads. If your server allows iframe embedding it
              renders inline; otherwise hit "open in tab".
            </p>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="https://code.example.com/"
                className="flex-1 bg-surface text-text font-mono rounded px-2 py-1.5 text-xs border border-line focus:border-accent outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!draft.trim()) return;
                  onChange(draft.trim());
                  setIframeSrc(draft.trim());
                  setBlocked(false);
                }}
                className="px-3 py-1.5 rounded bg-accent/20 text-accent text-xs font-mono hover:bg-accent/30"
              >
                Connect
              </button>
              {url && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setDraft("");
                    setIframeSrc(undefined);
                  }}
                  className="px-3 py-1.5 rounded text-xs font-mono text-muted hover:text-red hover:bg-red/10"
                >
                  Forget
                </button>
              )}
            </div>
            {url && url !== draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft(url);
                  setIframeSrc(url);
                }}
                className="mt-2 text-[11px] text-muted font-mono hover:text-accent"
              >
                use saved → {url}
              </button>
            )}
          </div>
        </div>
      )}

      {iframeSrc && (
        <div className="flex-1 relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {blocked && (
              <a
                href={iframeSrc}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded bg-yellow/20 text-yellow text-xs font-mono hover:bg-yellow/30 inline-flex items-center gap-1"
              >
                <ExternalLink size={12} /> open in tab
              </a>
            )}
            <button
              type="button"
              onClick={() => setIframeSrc(undefined)}
              className="px-2 py-1 rounded bg-surface/80 text-subtext text-xs font-mono hover:bg-surface"
            >
              back
            </button>
          </div>
          <iframe
            src={iframeSrc}
            title="Remote VS Code"
            className="w-full h-full border-0 bg-base"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-clipboard-read allow-clipboard-write"
            onLoad={(e) => {
              try {
                // If iframe is cross-origin and embedding is denied, accessing
                // contentDocument throws; we treat that as "blocked".
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (!doc) setBlocked(true);
              } catch {
                setBlocked(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

function RemoteCard({
  title,
  url,
  blurb,
}: {
  title: string;
  url: string;
  blurb: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl bg-surface/40 hover:bg-surface/70 border border-line/40 p-3 transition-colors group"
    >
      <div className="flex items-center gap-2 text-text text-sm font-mono">
        <Globe size={13} className="text-accent" />
        {title}
        <ExternalLink
          size={11}
          className="ml-auto text-muted group-hover:text-accent"
        />
      </div>
      <div className="text-[11px] text-muted mt-1 leading-snug">{blurb}</div>
    </a>
  );
}

function monacoThemeFor(theme: string): string {
  // Monaco supports "vs", "vs-dark", "hc-black", "hc-light".
  return theme === "latte" ? "vs" : "vs-dark";
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
