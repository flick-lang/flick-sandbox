import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { Sandbox } from '@vercel/sandbox';
import { LIFETIME_MS } from '@/consts';

export const prerender = false;

async function create() {
  // Only the browser that created a sandbox learns its key, so nobody else can keep it alive.
  const key = randomBytes(16).toString('hex');

  // The code runs as its author's shell, so the microVM plus these limits are the security boundary.
  const sandbox = await Sandbox.create({
    image: 'sandbox:latest',
    resources: { vcpus: 1 },
    timeout: LIFETIME_MS,
    networkPolicy: 'deny-all',
    persistent: false,
    tags: { key },
  });
  const { url, token } = await sandbox.openInteractive();
  return Response.json({ name: sandbox.name, key, url, token });
}

/** Compares in constant time, so response timing doesn't reveal how much of a guessed key was right. */
function keysMatch(given: string, expected: string) {
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Pushes the sandbox's expiry out to a full lifetime from now. */
async function extend(name: string, key: string) {
  const sandbox = await Sandbox.get({ name }).catch(() => undefined);
  const expected = sandbox?.tags?.key;
  if (!expected || !keysMatch(key, expected)) {
    return new Response('Unknown sandbox', { status: 404 });
  }
  // A stopped sandbox can't be resumed because it isn't persistent, so the client creates a new one.
  if (sandbox.status !== 'running' || !sandbox.expiresAt) {
    return new Response('Sandbox has stopped', { status: 410 });
  }

  // The API rejects extensions shorter than a second, which quick reruns would otherwise request.
  const remaining = sandbox.expiresAt.getTime() - Date.now();
  const shortfall = LIFETIME_MS - remaining;
  if (shortfall >= 1000) await sandbox.extendTimeout(shortfall);
  return new Response(null, { status: 204 });
}

/** Creates a sandbox, or extends the one named in the body. */
export const POST: APIRoute = async ({ request }) => {
  const { name, key } = await request.json();
  if (name === undefined) return create();
  if (typeof name !== 'string' || typeof key !== 'string') {
    return new Response('Invalid sandbox', { status: 400 });
  }
  return extend(name, key);
};
