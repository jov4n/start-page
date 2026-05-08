/** Browser-safe stand-in for Win/Cmd "Super": Ctrl+Alt (Meta is unreliable when swallowed). */
export function chordSuper(e: KeyboardEvent): boolean {
  return e.ctrlKey && e.altKey && !e.metaKey;
}
