import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { LIFETIME_MS } from '@/consts';

interface Sandbox {
  name: string;
  /** Proves to /api/sandbox that this browser created the sandbox. */
  key: string;
  url: string;
  token: string;
  /** Estimated locally, and early, so a sandbox is never trusted for longer than it lives. */
  expiresAt: number;
}

/** A sandbox this close to expiring is replaced, not reused. */
const EXPIRY_MARGIN_MS = 5_000;
/** Keeps the code, passed as one argument, under Linux's 128 KB limit for a single argument. */
const MAX_CODE_BYTES = 64 * 1024;

const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;

// $1 is the code. The image has only a shell and flick, so the script sticks to builtins. flick exits
// non-zero when a compile fails, so a ./main left by an earlier run is never started.
const SCRIPT = `printf %s "$1" > main.fl && printf '${dim('Compiling…')}\\n' && flick main.fl && printf '${dim('Running…')}\\n' && ./main`;

// ANSI colours tuned for each background; xterm's defaults assume a dark one.
const ANSI = {
  light: {
    black: '#0f172a',
    red: '#dc2626',
    green: '#15803d',
    yellow: '#a16207',
    blue: '#2563eb',
    magenta: '#9333ea',
    cyan: '#0e7490',
    white: '#64748b',
    brightBlack: '#475569',
    brightRed: '#ef4444',
    brightGreen: '#16a34a',
    brightYellow: '#ca8a04',
    brightBlue: '#3b82f6',
    brightMagenta: '#a855f7',
    brightCyan: '#0891b2',
    brightWhite: '#94a3b8',
  },
  dark: {
    black: '#2a2a2a',
    red: '#f87171',
    green: '#4ade80',
    yellow: '#facc15',
    blue: '#60a5fa',
    magenta: '#c084fc',
    cyan: '#22d3ee',
    white: '#d4d4d4',
    brightBlack: '#737373',
    brightRed: '#fca5a5',
    brightGreen: '#86efac',
    brightYellow: '#fde047',
    brightBlue: '#93c5fd',
    brightMagenta: '#d8b4fe',
    brightCyan: '#67e8f9',
    brightWhite: '#f5f5f5',
  },
};

const darkMode = matchMedia('(prefers-color-scheme: dark)');

/** The terminal's colours for the current theme, with the surfaces taken from global.css. */
function terminalTheme() {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string) => style.getPropertyValue(name).trim();
  return {
    ...ANSI[darkMode.matches ? 'dark' : 'light'],
    background: color('--color-sunken'),
    foreground: color('--color-fg'),
    cursor: color('--color-muted'),
    cursorAccent: color('--color-sunken'),
    selectionBackground: color('--selection'),
  };
}

/**
 * Runs code in a sandbox and connects the terminal straight to its PTY. The sandbox is
 * reused by later runs and expires a minute after the last one. At most one run is
 * active: starting a new one stops the previous.
 */
export function createRunner(container: HTMLElement, onRunningChange: (running: boolean) => void) {
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
  darkMode.addEventListener('change', () => (terminal.options.theme = terminalTheme()));

  const encoder = new TextEncoder();
  let sandbox: Sandbox | undefined;
  let active: { socket?: WebSocket } | undefined;

  const send = (data: string | Uint8Array<ArrayBuffer>) => {
    if (active?.socket?.readyState === WebSocket.OPEN) active.socket.send(data);
  };
  terminal.onData((data) => send(encoder.encode(data)));
  terminal.onResize(({ cols, rows }) => send(JSON.stringify({ type: 'resize', cols, rows })));

  /** Writes a dim line, starting a new line first if the program left the cursor mid-line. */
  const status = (text: string) =>
    terminal.write('', () => terminal.writeln((terminal.buffer.active.cursorX ? '\r\n' : '') + dim(text)));

  status('Press Run to compile and run your program');

  const finish = (run: typeof active, message: string) => {
    if (run !== active) return;
    active = undefined;
    // Closing the socket kills the program.
    run?.socket?.close();
    status(message);
    onRunningChange(false);
  };

  const stop = () => active && finish(active, 'Stopped');

  async function request(body: object) {
    const response = await fetch('/api/sandbox', { method: 'POST', body: JSON.stringify(body) });
    if (response.status === 429) throw new Error('too many runs, try again in a minute');
    if (!response.ok) throw new Error(await response.text());
    return response;
  }

  /** Returns a sandbox with a full lifetime ahead of it, creating one if the last has expired. */
  async function acquire(): Promise<Sandbox> {
    const expiresAt = Date.now() + LIFETIME_MS;
    if (sandbox && Date.now() < sandbox.expiresAt - EXPIRY_MARGIN_MS) {
      const { name, key } = sandbox;
      // Not awaited: the sandbox is already running, so the program starts while its timeout is extended.
      request({ name, key }).catch(() => sandbox?.name === name && (sandbox = undefined));
      return (sandbox = { ...sandbox, expiresAt });
    }
    status('Starting sandbox…');
    sandbox = undefined;
    return (sandbox = { ...(await (await request({})).json()), expiresAt });
  }

  async function start(code: string) {
    // Ends the previous run without a status line, which would land in the freshly cleared terminal.
    active?.socket?.close();
    terminal.reset();
    if (encoder.encode(code).length > MAX_CODE_BYTES) return status('The code is larger than 64 KB, the most a run accepts');

    const run: NonNullable<typeof active> = (active = {});
    onRunningChange(true);
    terminal.focus();

    try {
      const { url, token } = await acquire();
      // Stopped while the sandbox was being created. It stays available for the next run.
      if (run !== active) return;

      const socket = (run.socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`));
      socket.binaryType = 'arraybuffer';
      socket.onopen = () =>
        socket.send(
          JSON.stringify({
            type: 'start',
            command: 'sh',
            args: ['-c', SCRIPT, 'sh', code],
            env: ['TERM=xterm-256color'],
            cols: terminal.cols,
            rows: terminal.rows,
          }),
        );
      socket.onmessage = ({ data }) => {
        if (typeof data !== 'string') return terminal.write(new Uint8Array(data));
        const message = JSON.parse(data);
        // The code is omitted when it is 0.
        if (message.type === 'exit') finish(run, `exited with code ${message.code ?? 0}`);
      };
      socket.onclose = () => {
        if (run !== active) return;
        // Closing without an exit message means the sandbox itself went away.
        sandbox = undefined;
        finish(run, `Connection lost. Runs are limited to ${LIFETIME_MS / 1000} seconds.`);
      };
    } catch (error) {
      finish(run, `Couldn't start the sandbox: ${error instanceof Error ? error.message : error}`);
    }
  }

  return { start, stop };
}
