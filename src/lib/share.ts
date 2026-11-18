const HASH_PREFIX = '#code=';

async function transform(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const transformed = new Blob([bytes]).stream().pipeThrough(stream);
  const buffer = await new Response(transformed).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function shareUrl(code: string) {
  const bytes = new TextEncoder().encode(code);
  const compressed = await transform(bytes, new CompressionStream('deflate-raw'));
  const url = new URL(location.href);
  url.hash = HASH_PREFIX + compressed.toBase64({ alphabet: 'base64url', omitPadding: true });
  return url.href;
}

/** The code in the URL hash, or null if there is none or it doesn't decode. */
export async function sharedCode() {
  if (!location.hash.startsWith(HASH_PREFIX)) return null;
  try {
    const encoded = location.hash.slice(HASH_PREFIX.length);
    const compressed = Uint8Array.fromBase64(encoded, { alphabet: 'base64url' });
    const bytes = await transform(compressed, new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
