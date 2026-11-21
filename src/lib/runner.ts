import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import posthog from "posthog-js";
import { LIFETIME_MS } from "@/consts";

interface Sandbox {
  name: string;
  /** Proves to /api/sandbox that this browser created the sandbox. */
  key: string;
  url: string;
  token: string;
  /** Estimated locally, and early, so a sandbox is never trusted for longer than it lives. */
  expiresAt: number;
}

type Run = {
  socket?: WebSocket;
  /** How long creating a sandbox took, or null when a running one was reused. */
  sandboxStartMs: number | null;
  /** How long compiling took, or null if it didn't finish. */
  compileMs: number | null;
  /** When the code had compiled and the program started, or null if it hasn't. */
  programStartedAt: number | null;
};

type Outcome =
  | "exited"
  | "compile_error"
  | "stopped"
  | "restarted"
  | "connection_lost"
  | "start_failed";

/** A sandbox this close to expiring is replaced, not reused. */
const EXPIRY_MARGIN_MS = 5_000;
/** Linux caps a single argument at 128 KB, and the code is passed as one. */
const MAX_CODE_BYTES = 64 * 1024;

const ansiDim = (text: string) => `\x1b[2m${text}\x1b[0m`;

// Printed by the script before and after compiling, so their arrival in the output times the compile.
const COMPILING_LINE = ansiDim("Compiling…");
const RUNNING_LINE = ansiDim("Running…");

// $1 is the code. The image has only a shell and flick, so the script sticks to builtins. flick exits
// non-zero when a compile fails, so a ./main left by an earlier run is never started.
const SCRIPT = [
  'printf %s "$1" > main.fl',
  `printf '${COMPILING_LINE}\\n'`,
  "flick main.fl",
  `printf '${RUNNING_LINE}\\n'`,
  "./main",
].join(" && ");

// ANSI colours tuned for each background; xterm's defaults assume a dark one.
const ANSI = {
  light: {
    black: "#0f172a",
    red: "#dc2626",
    green: "#15803d",
    yellow: "#a16207",
    blue: "#2563eb",
    magenta: "#9333ea",
    cyan: "#0e7490",
    white: "#64748b",
    brightBlack: "#475569",
    brightRed: "#ef4444",
    brightGreen: "#16a34a",
    brightYellow: "#ca8a04",
    brightBlue: "#3b82f6",
    brightMagenta: "#a855f7",
    brightCyan: "#0891b2",
    brightWhite: "#94a3b8",
  },
  dark: {
    black: "#2a2a2a",
    red: "#f87171",
    green: "#4ade80",
    yellow: "#facc15",
    blue: "#60a5fa",
    magenta: "#c084fc",
    cyan: "#22d3ee",
    white: "#d4d4d4",
    brightBlack: "#737373",
    brightRed: "#fca5a5",
    brightGreen: "#86efac",
    brightYellow: "#fde047",
    brightBlue: "#93c5fd",
    brightMagenta: "#d8b4fe",
    brightCyan: "#67e8f9",
    brightWhite: "#f5f5f5",
  },
};

const darkMode = matchMedia("(prefers-color-scheme: dark)");

/** The terminal's colours for the current theme, with the surfaces taken from global.css. */
function terminalTheme() {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string) => style.getPropertyValue(name).trim();
  const ansiColors = darkMode.matches ? ANSI.dark : ANSI.light;
  return {
    ...ansiColors,
    background: color("--color-sunken"),
    foreground: color("--color-fg"),
    cursor: color("--color-muted"),
    cursorAccent: color("--color-sunken"),
    selectionBackground: color("--selection"),
  };
}

/**
 * Runs code in a sandbox and connects the terminal straight to its PTY. The sandbox is
 * reused by later runs and expires LIFETIME_MS after the last one. At most one run is
 * active: starting a new one stops the previous.
 */
export function createRunner(
  container: HTMLElement,
  onRunningChange: (running: boolean) => void,
) {
  const terminal = new Terminal({
    fontFamily: getComputedStyle(container).fontFamily,
    fontSize: 13,
    lineHeight: 1.35,
    theme: terminalTheme(),
  });
  const fit = new FitAddon();
  terminal.loadAddon(fit);
  terminal.open(container);
  new ResizeObserver(() => fit.fit()).observe(container);
  darkMode.addEventListener("change", () => {
    terminal.options.theme = terminalTheme();
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let sandbox: Sandbox | undefined;
  let currentRun: Run | undefined;

  // Binary frames carry terminal input and output; text frames carry JSON control messages.
  function send(data: string | Uint8Array<ArrayBuffer>) {
    const socket = currentRun?.socket;
    if (socket?.readyState === WebSocket.OPEN) socket.send(data);
  }

  terminal.onData((data) => send(encoder.encode(data)));
  terminal.onResize(({ cols, rows }) => {
    const resizeMessage = JSON.stringify({ type: "resize", cols, rows });
    send(resizeMessage);
  });

  /**
   * Writes a dim line, starting a new line first if the program left the cursor mid-line.
   * The empty write waits for pending output, so the cursor position is up to date.
   */
  function status(text: string) {
    terminal.write("", () => {
      const isMidLine = terminal.buffer.active.cursorX > 0;
      const prefix = isMidLine ? "\r\n" : "";
      terminal.writeln(prefix + ansiDim(text));
    });
  }

  status("Press Run to compile and run your program");

  /** Ends the run. Without a message, no status line is written. */
  function finish(
    run: Run,
    outcome: Outcome,
    message?: string,
    details?: object,
  ) {
    if (run !== currentRun) return;
    currentRun = undefined;
    // Closing the socket kills the program.
    run.socket?.close();
    if (message) status(message);
    onRunningChange(false);
    const { programStartedAt } = run;
    posthog.capture("run_finished", {
      outcome,
      // How long the program itself ran, or null if it never started.
      duration_ms:
        programStartedAt === null
          ? null
          : Math.round(performance.now() - programStartedAt),
      sandbox_start_ms: run.sandboxStartMs,
      compile_ms: run.compileMs,
      ...details,
    });
  }

  function stop() {
    if (currentRun) finish(currentRun, "stopped", "Stopped");
  }

  async function request(body: object) {
    const init = { method: "POST", body: JSON.stringify(body) };
    const response = await fetch("/api/sandbox", init);
    if (response.status === 429)
      throw new Error("too many runs, try again in a minute");
    if (!response.ok) throw new Error(await response.text());
    return response;
  }

  /** Pushes the sandbox's timeout out to a full lifetime. If that fails, the sandbox has stopped. */
  function extend({ name, key }: Sandbox) {
    request({ name, key }).catch(() => {
      // Only forget it if a newer sandbox hasn't replaced it in the meantime.
      if (sandbox?.name === name) sandbox = undefined;
    });
  }

  /** Returns a sandbox with a full lifetime ahead of it, creating one if the last has expired. */
  async function acquire(run: Run): Promise<Sandbox> {
    const expiresAt = Date.now() + LIFETIME_MS;

    const last = sandbox;
    if (last && Date.now() < last.expiresAt - EXPIRY_MARGIN_MS) {
      // Not awaited: the sandbox is already running, so the program starts while its timeout is extended.
      extend(last);
      sandbox = { ...last, expiresAt };
      return sandbox;
    }

    status("Starting sandbox…");
    const requestedAt = performance.now();
    const response = await request({});
    const created: Omit<Sandbox, "expiresAt"> = await response.json();
    run.sandboxStartMs = Math.round(performance.now() - requestedAt);
    sandbox = { ...created, expiresAt };
    return sandbox;
  }

  /** Opens the sandbox's terminal socket and runs the code there. */
  function connect(run: Run, { url, token }: Sandbox, code: string) {
    const socketUrl = `${url}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(socketUrl);
    socket.binaryType = "arraybuffer";
    run.socket = socket;

    // Replaced when the Compiling line arrives, so connecting doesn't count as compiling.
    let compileStartedAt = performance.now();
    const compileMs = () => Math.round(performance.now() - compileStartedAt);

    socket.onopen = () => {
      const startMessage = JSON.stringify({
        type: "start",
        command: "sh",
        args: ["-c", SCRIPT, "sh", code],
        env: ["TERM=xterm-256color"],
        cols: terminal.cols,
        rows: terminal.rows,
      });
      socket.send(startMessage);
    };

    socket.onmessage = ({ data }) => {
      const isOutput = typeof data !== "string";
      if (isOutput) {
        const output = new Uint8Array(data);
        terminal.write(output);
        if (run.programStartedAt === null) {
          // Each line is written by a single printf, so it arrives within a single frame.
          const text = decoder.decode(output);
          if (text.includes(COMPILING_LINE))
            compileStartedAt = performance.now();
          if (text.includes(RUNNING_LINE)) {
            run.compileMs = compileMs();
            run.programStartedAt = performance.now();
          }
        }
        return;
      }

      const message = JSON.parse(data);
      if (message.type === "exit") {
        // The code is omitted when it is 0.
        const exitCode = message.code ?? 0;
        const compiled = run.programStartedAt !== null;
        // With no program started, the exit is the compiler's.
        if (!compiled) run.compileMs = compileMs();
        const outcome =
          exitCode !== 0 && !compiled ? "compile_error" : "exited";
        finish(run, outcome, `exited with code ${exitCode}`, {
          exit_code: exitCode,
        });
      }
    };

    socket.onclose = () => {
      if (run !== currentRun) return;
      // Closing without an exit message means the sandbox itself went away.
      sandbox = undefined;
      finish(
        run,
        "connection_lost",
        `Connection lost. Runs are limited to ${LIFETIME_MS / 1000} seconds.`,
      );
    };
  }

  async function start(code: string) {
    // Ends the previous run without a status line, which would land in the freshly cleared terminal.
    if (currentRun) finish(currentRun, "restarted");
    terminal.reset();

    const codeBytes = encoder.encode(code).length;
    if (codeBytes > MAX_CODE_BYTES) {
      status(
        `The code is larger than ${MAX_CODE_BYTES / 1024} KB, the most a run accepts`,
      );
      posthog.capture("run_finished", { outcome: "too_large" });
      return;
    }

    const run: Run = {
      sandboxStartMs: null,
      compileMs: null,
      programStartedAt: null,
    };
    currentRun = run;
    onRunningChange(true);
    terminal.focus();

    try {
      const runSandbox = await acquire(run);
      // Stopped while the sandbox was being created. It stays available for the next run.
      if (run !== currentRun) return;
      connect(run, runSandbox, code);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      finish(run, "start_failed", `Couldn't start the sandbox: ${reason}`, {
        error: reason,
      });
    }
  }

  return { start, stop };
}
