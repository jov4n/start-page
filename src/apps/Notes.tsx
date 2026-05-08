import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Columns2, Eye, Plus, Trash2, Type } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store";

type PaneMode = "split" | "edit" | "preview";

/** Rough plaintext for sidebar snippets (not rendered markdown). */
function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^(\s*[-*+]|\s*\d+\.)\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold text-text mt-4 mb-2 pb-2 border-b border-white/10 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-text mt-4 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-text mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-subtext mt-3 mb-1 first:mt-0">{children}</h4>
  ),
  p: ({ children }) => <p className="my-2 text-text/95 leading-relaxed">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:brightness-110 transition"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc pl-5 space-y-1 text-text/95">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal pl-5 space-y-1 text-text/95">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-[3px] border-accent/50 pl-3 text-muted italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-white/10" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-text">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-subtext">{children}</em>,
  code: ({ className, children, ...props }) => {
    const isBlock = /\blanguage-/.test(className ?? "");
    if (!isBlock) {
      return (
        <code
          className="rounded bg-mantle/90 px-1.5 py-0.5 font-mono text-[0.8125rem] text-accent3"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={clsx("block whitespace-pre text-[0.8125rem] leading-relaxed", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl bg-mantle/85 border border-white/8 p-3 font-mono text-[0.8125rem] leading-relaxed">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-mantle/60">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-white/10 px-2 py-1.5 text-left font-semibold text-text">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-2 py-1.5 text-subtext">{children}</td>
  ),
  input: ({ type, checked, disabled, ...props }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled ?? true}
          className="mr-2 align-middle accent-accent rounded border-white/20"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};

function MarkdownPreview({ source }: { source: string }) {
  const plugins = useMemo(() => [remarkGfm], []);
  return (
    <div className="h-full overflow-auto px-5 py-4">
      {source.trim() === "" ? (
        <p className="text-sm text-muted italic">Nothing to preview yet.</p>
      ) : (
        <ReactMarkdown remarkPlugins={plugins} components={markdownComponents}>
          {source}
        </ReactMarkdown>
      )}
    </div>
  );
}

export function NotesApp() {
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const removeNote = useStore((s) => s.removeNote);

  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);
  const [pane, setPane] = useState<PaneMode>("split");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!notes.find((n) => n.id === activeId)) {
      setActiveId(notes[0]?.id ?? null);
    }
  }, [notes, activeId]);

  useEffect(() => {
    setPendingDeleteId(null);
  }, [activeId]);

  useEffect(() => {
    if (!pendingDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingDeleteId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDeleteId]);

  const active = notes.find((n) => n.id === activeId);

  return (
    <div className="h-full flex">
      <div className="w-56 shrink-0 border-r border-white/5 bg-panel/40 flex flex-col">
        <div className="p-2 border-b border-white/5">
          <button
            onClick={() => setActiveId(addNote())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/20 hover:bg-accent/30 text-accent text-sm transition"
          >
            <Plus size={14} /> New note
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {notes.map((n) => (
            <div
              key={n.id}
              className={clsx(
                "w-full border-b border-white/5 group flex items-stretch gap-0",
                activeId === n.id ? "bg-white/5" : "hover:bg-white/5"
              )}
            >
              <button
                type="button"
                onClick={() => setActiveId(n.id)}
                className="flex-1 min-w-0 text-left px-3 py-2"
              >
                <div className="text-sm truncate">{n.title || "Untitled"}</div>
                <div className="text-[11px] text-muted truncate">
                  {stripMarkdown(n.body).slice(0, 44) || "No content"}
                </div>
                <div className="text-[10px] text-muted/70 mt-0.5">
                  {new Date(n.updatedAt).toLocaleString()}
                </div>
              </button>
              <div className="shrink-0 py-2 pr-2 flex flex-col justify-start items-end gap-1">
                {pendingDeleteId === n.id ? (
                  <div className="flex flex-col items-end gap-1 max-w-[7.5rem]">
                    <span className="text-[10px] text-muted leading-tight text-right">
                      Delete this note?
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="text-[10px] px-2 py-1 rounded-md bg-white/10 text-muted hover:bg-white/15 hover:text-text transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeNote(n.id);
                          setPendingDeleteId(null);
                        }}
                        className="text-[10px] px-2 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    title="Delete note"
                    onClick={() => setPendingDeleteId(n.id)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            <input
              value={active.title}
              onChange={(e) => updateNote(active.id, { title: e.target.value })}
              className="bg-transparent outline-none text-lg font-medium px-5 py-3 border-b border-white/5 shrink-0"
              placeholder="Title"
            />

            <div className="flex items-center gap-1 px-5 py-2 border-b border-white/5 shrink-0 bg-base/20">
              <span className="text-[10px] uppercase tracking-widest text-muted mr-2">View</span>
              {(
                [
                  { mode: "split" as const, icon: Columns2, label: "Split" },
                  { mode: "edit" as const, icon: Type, label: "Edit" },
                  { mode: "preview" as const, icon: Eye, label: "Preview" },
                ] as const
              ).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  title={label}
                  onClick={() => setPane(mode)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition",
                    pane === mode
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:bg-white/5 hover:text-text"
                  )}
                >
                  <Icon size={13} strokeWidth={2} />
                  {label}
                </button>
              ))}
              <span className="text-[10px] text-muted/80 ml-auto hidden sm:inline">
                Markdown · live preview
              </span>
            </div>

            <div className="flex-1 flex min-h-0">
              {(pane === "split" || pane === "edit") && (
                <div
                  className={clsx(
                    "flex flex-col min-w-0 min-h-0 bg-transparent",
                    pane === "split" ? "flex-1 border-r border-white/5" : "flex-1"
                  )}
                >
                  <textarea
                    value={active.body}
                    onChange={(e) => updateNote(active.id, { body: e.target.value })}
                    className="flex-1 bg-transparent outline-none p-5 text-sm leading-6 resize-none font-mono text-text/90 placeholder:text-muted/60 min-h-[120px]"
                    placeholder={
                      "Write Markdown…\n\n**bold**, *italic*, `code`\n\n- lists\n- [x] tasks\n\n```js\nconsole.log('hi')\n```"
                    }
                    spellCheck
                  />
                </div>
              )}
              {(pane === "split" || pane === "preview") && (
                <div
                  className={clsx(
                    "flex flex-col min-w-0 min-h-0 bg-base/25",
                    pane === "split" ? "flex-1" : "flex-1"
                  )}
                >
                  <MarkdownPreview source={active.body} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            No note selected.
          </div>
        )}
      </div>
    </div>
  );
}
