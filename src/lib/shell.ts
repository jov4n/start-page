import type { Terminal } from "@xterm/xterm";

/**
 * Minimal POSIX-like line-editing shell on top of xterm.js.
 * Handles: cursor left/right, home/end, backspace, ctrl+c, ctrl+l,
 * history (up/down), ctrl+w (delete word).
 */
export class Shell {
  private term: Terminal;
  private onCommand: (cmd: string) => void | Promise<void>;
  private getPrompt: () => string;
  private buffer = "";
  private cursor = 0;
  private history: string[] = [];
  private histIdx = -1;
  private busy = false;
  private disposeFn: (() => void) | null = null;

  constructor(
    term: Terminal,
    onCommand: (cmd: string) => void | Promise<void>,
    getPrompt: () => string
  ) {
    this.term = term;
    this.onCommand = onCommand;
    this.getPrompt = getPrompt;
  }

  attach() {
    const sub = this.term.onData((data) => this.handleData(data));
    this.disposeFn = () => sub.dispose();
  }

  detach() {
    this.disposeFn?.();
    this.disposeFn = null;
  }

  prompt() {
    this.term.write(this.getPrompt());
  }

  setBusy(b: boolean) {
    this.busy = b;
  }

  private async handleData(data: string) {
    if (this.busy && data !== "\u0003") return; // accept ^C while busy
    // Match known control sequences, then fall back to inserting printable chars.
    switch (data) {
      case "\r":
        return this.executeLine();
      case "\u007f": // backspace
      case "\b":
        return this.backspace();
      case "\u0003": // Ctrl-C
        return this.cancel();
      case "\u000c": // Ctrl-L
        this.term.clear();
        this.term.write("\r");
        this.prompt();
        this.term.write(this.buffer);
        return;
      case "\u0017": // Ctrl-W (delete word)
        return this.deleteWord();
      case "\u0001": // Ctrl-A (home)
        return this.toStart();
      case "\u0005": // Ctrl-E (end)
        return this.toEnd();
      case "\u001b[A": // Up
        return this.historyPrev();
      case "\u001b[B": // Down
        return this.historyNext();
      case "\u001b[C": // Right
        return this.cursorRight();
      case "\u001b[D": // Left
        return this.cursorLeft();
      case "\u001b[H": // Home
        return this.toStart();
      case "\u001b[F": // End
        return this.toEnd();
      case "\u001b[3~": // Delete
        return this.deleteForward();
      default:
        for (const ch of data) {
          const code = ch.charCodeAt(0);
          if (code >= 32 && code !== 127) this.insert(ch);
        }
    }
  }

  private insert(ch: string) {
    if (this.cursor === this.buffer.length) {
      this.buffer += ch;
      this.cursor++;
      this.term.write(ch);
    } else {
      const tail = this.buffer.slice(this.cursor);
      this.buffer = this.buffer.slice(0, this.cursor) + ch + tail;
      this.cursor++;
      // Write inserted char + tail, then move cursor back over tail
      this.term.write(ch + tail + "\b".repeat(tail.length));
    }
  }

  private backspace() {
    if (this.cursor === 0) return;
    if (this.cursor === this.buffer.length) {
      this.buffer = this.buffer.slice(0, -1);
      this.cursor--;
      this.term.write("\b \b");
    } else {
      const tail = this.buffer.slice(this.cursor);
      this.buffer = this.buffer.slice(0, this.cursor - 1) + tail;
      this.cursor--;
      // back one, redraw tail, blank the trailing char, return cursor.
      this.term.write("\b" + tail + " " + "\b".repeat(tail.length + 1));
    }
  }

  private deleteForward() {
    if (this.cursor === this.buffer.length) return;
    const tail = this.buffer.slice(this.cursor + 1);
    this.buffer = this.buffer.slice(0, this.cursor) + tail;
    this.term.write(tail + " " + "\b".repeat(tail.length + 1));
  }

  private deleteWord() {
    if (this.cursor === 0) return;
    let i = this.cursor;
    while (i > 0 && this.buffer[i - 1] === " ") i--;
    while (i > 0 && this.buffer[i - 1] !== " ") i--;
    const removed = this.cursor - i;
    const tail = this.buffer.slice(this.cursor);
    this.buffer = this.buffer.slice(0, i) + tail;
    this.cursor = i;
    this.term.write(
      "\b".repeat(removed) +
        tail +
        " ".repeat(removed) +
        "\b".repeat(tail.length + removed)
    );
  }

  private cursorLeft() {
    if (this.cursor > 0) {
      this.cursor--;
      this.term.write("\b");
    }
  }

  private cursorRight() {
    if (this.cursor < this.buffer.length) {
      this.term.write(this.buffer[this.cursor]);
      this.cursor++;
    }
  }

  private toStart() {
    if (this.cursor > 0) {
      this.term.write("\b".repeat(this.cursor));
      this.cursor = 0;
    }
  }

  private toEnd() {
    if (this.cursor < this.buffer.length) {
      this.term.write(this.buffer.slice(this.cursor));
      this.cursor = this.buffer.length;
    }
  }

  private historyPrev() {
    if (this.history.length === 0) return;
    const idx =
      this.histIdx === -1
        ? this.history.length - 1
        : Math.max(0, this.histIdx - 1);
    this.histIdx = idx;
    this.replaceLine(this.history[idx]);
  }

  private historyNext() {
    if (this.histIdx === -1) return;
    const idx = this.histIdx + 1;
    if (idx >= this.history.length) {
      this.histIdx = -1;
      this.replaceLine("");
    } else {
      this.histIdx = idx;
      this.replaceLine(this.history[idx]);
    }
  }

  private replaceLine(text: string) {
    // Move cursor to end of current buffer
    if (this.cursor < this.buffer.length) {
      this.term.write(this.buffer.slice(this.cursor));
      this.cursor = this.buffer.length;
    }
    // Erase backward
    this.term.write("\b \b".repeat(this.buffer.length));
    this.buffer = text;
    this.cursor = text.length;
    this.term.write(text);
  }

  private async executeLine() {
    this.term.write("\r\n");
    const cmd = this.buffer;
    if (cmd.trim()) {
      this.history.push(cmd);
      if (this.history.length > 500) this.history.shift();
    }
    this.histIdx = -1;
    this.buffer = "";
    this.cursor = 0;
    this.busy = true;
    try {
      await this.onCommand(cmd);
    } catch (e) {
      this.term.writeln(`\x1b[31merror: ${(e as Error).message}\x1b[0m`);
    } finally {
      this.busy = false;
      this.prompt();
    }
  }

  private cancel() {
    if (this.busy) {
      this.term.write("\r\n\x1b[33m^C interrupted\x1b[0m\r\n");
      this.busy = false;
    } else {
      this.term.write("^C\r\n");
    }
    this.buffer = "";
    this.cursor = 0;
    this.histIdx = -1;
    this.prompt();
  }
}
