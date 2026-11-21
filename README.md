# Flick Sandbox

A web playground for the [Flick](https://github.com/flick-lang/flick) programming language. Edit code, press Run, and the compiler and your program run in a real terminal that also takes keyboard input.

## How it works

The site is an [Astro](https://astro.build) app, styled with [Tailwind CSS](https://tailwindcss.com) and deployed on Vercel. The pages are static; one server endpoint, `/api/sandbox`, manages sandboxes:

1. On the first Run, the browser asks `/api/sandbox` for a sandbox. The endpoint creates a [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) from the compiler image and returns its terminal URL and token, plus a key that only this browser knows.
2. The browser connects its terminal ([xterm.js](https://xtermjs.org)) straight to the sandbox over a WebSocket, writes the code to `main.fl` and runs `./flick main.fl && ./main`.
3. Later runs reuse the sandbox, so they start immediately. Each one sends the sandbox's name and key back to `/api/sandbox`, which pushes its expiry out to 2 minutes from that run.

Nothing stops a sandbox explicitly: it expires 2 minutes after its last run. An expired sandbox stays listed as stopped until Vercel removes it after 14 days of inactivity; it costs nothing in the meantime.

## Sandbox limits

Flick's `extern fn` can call any libc function, so running a program is the same as giving its author a shell. Each run is contained by:

- **Isolation**: a separate microVM per browser tab, deleted after it expires
- **Time**: 2 minutes per run, including time spent waiting for input
- **Network**: none
- **Resources**: 1 vCPU and 2 GB of memory
- **Code size**: 64 KB

The terminal token handed to the browser only works for that one sandbox and dies with it. Runs in the same tab share a sandbox, so files one run writes are visible to the next.

## Development

Node and pnpm come from `flake.nix` (`nix develop`, or direnv).

```sh
pnpm install
pnpm dlx vercel link      # once, to connect the directory to the Vercel project
pnpm dlx vercel env pull  # writes VERCEL_OIDC_TOKEN to .env.local; expires after a few hours
pnpm dev
```

`pnpm check` type-checks the project and `pnpm build` builds it.

## Deployment

### Compiler image

Sandboxes start from the `sandbox:latest` image in Vercel Container Registry, set in `src/pages/api/sandbox.ts`. Pushing a new compiler to `latest` ships it without a deploy, so check the examples still compile first. The image must:

- have `flick` on its `PATH` and a writable working directory, since runs execute `flick main.fl && ./main` there
- exit non-zero from `flick` when a compile fails; the run script uses only shell builtins, so it can't clear out an old `main` first
- not install `sudo`
- need no network access

### Rate limiting

`/api/sandbox` has no authentication, so it relies on the one WAF rate-limit rule the Hobby plan allows. Configure it in the Vercel dashboard under Firewall:

- **If**: request path equals `/api/sandbox`
- **Then**: rate limit by IP address, 10 requests per 60 seconds, responding with 429

### Quotas

The Hobby plan pauses sandboxes when a quota runs out; it doesn't bill. The relevant limits are 10 concurrent sandboxes, 5 hours of active CPU, 420 GB-hours of memory and 5,000 sandbox creations per month. Memory is billed per wall-clock minute with a one-minute minimum.
