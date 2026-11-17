import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { Sandbox } from '@vercel/sandbox';
import { LIFETIME_MS } from '@/consts';

export const prerender = false;

/**
 * A sandbox that reaches its timeout stays listed as stopped until it is deleted,
 * so each new one clears out those left behind.
 */
async function deleteStoppedSandboxes() {
  const { sandboxes } = await Sandbox.list();
  const stopped = sandboxes.filter((sandbox) => sandbox.status === 'stopped');
  await Promise.all(stopped.map(async ({ name }) => (await Sandbox.get({ name })).delete()));
}

async function create() {
  const image = process.env.FLICK_SANDBOX_IMAGE;
  // Never fall back to the default image: it ships passwordless sudo.
  if (!image) return new Response('FLICK_SANDBOX_IMAGE is not set', { status: 500 });

  // Concurrent requests can race to delete the same sandbox; losing that race is harmless.
  const cleanup = deleteStoppedSandboxes().catch(console.error);

  // Only the browser that created a sandbox learns its key, so nobody else can keep it alive.
  const key = randomBytes(16).toString('hex');

  // The code runs as its author's shell, so the microVM plus these limits are the security boundary.
  const sandbox = await Sandbox.create({
    image,
    resources: { vcpus: 1 },
    timeout: LIFETIME_MS,
    networkPolicy: 'deny-all',
    // A persistent sandbox would leave a snapshot behind on every stop.
    persistent: false,
    tags: { key },
  });
  const { url, token } = await sandbox.openInteractive();

  await cleanup;
  return Response.json({ name: sandbox.name, key, url, token });
}

/** Pushes the sandbox's expiry out to a full lifetime from now. */
async function extend(name: string, key: string) {
  const sandbox = await Sandbox.get({ name }).catch(() => undefined);
  const expected = sandbox?.tags?.key;
  if (!expected || key.length !== expected.length || !timingSafeEqual(Buffer.from(key), Buffer.from(expected))) {
    return new Response('Unknown sandbox', { status: 404 });
  }
  // extendTimeout would resume a stopped sandbox, so only a running one may be extended.
  if (sandbox.status !== 'running' || !sandbox.expiresAt) return new Response('Sandbox has stopped', { status: 410 });

  // The API rejects extensions shorter than a second, which quick reruns would otherwise request.
  const shortfall = LIFETIME_MS - (sandbox.expiresAt.getTime() - Date.now());
  if (shortfall >= 1000) await sandbox.extendTimeout(shortfall);
  return new Response(null, { status: 204 });
}

/** Creates a sandbox, or extends the one named in the body. */
export const POST: APIRoute = async ({ request }) => {
  const { name, key } = await request.json();
  if (name === undefined) return create();
  if (typeof name !== 'string' || typeof key !== 'string') return new Response('Invalid sandbox', { status: 400 });
  return extend(name, key);
};
