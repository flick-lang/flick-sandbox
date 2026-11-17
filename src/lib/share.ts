import { CODE_KEY } from '@/consts';

const HASH_PREFIX = '#code=';

async function transform(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function shareUrl(code: string) {
  const compressed = await transform(new TextEncoder().encode(code), new CompressionStream('deflate-raw'));
  const url = new URL(location.href);
  url.hash = HASH_PREFIX + compressed.toBase64({ alphabet: 'base64url', omitPadding: true });
  return url.href;
}

/** The code in the URL hash, or null if there is none or it doesn't decode. */
export async function sharedCode() {
  if (!location.hash.startsWith(HASH_PREFIX)) return null;
  try {
    const compressed = Uint8Array.fromBase64(location.hash.slice(HASH_PREFIX.length), { alphabet: 'base64url' });
    return new TextDecoder().decode(await transform(compressed, new DecompressionStream('deflate-raw')));
  } catch {
    return null;
  }
}

// Storage access throws when it is blocked, e.g. in some private windows.
export function savedCode() {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function saveCode(code: string) {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {}
}
