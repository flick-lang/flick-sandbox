// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import vercel from '@astrojs/vercel';
import { cacheVercel } from '@astrojs/vercel/cache';

import tailwindcss from '@tailwindcss/vite';

import { existsSync } from 'node:fs';

// The Sandbox SDK reads VERCEL_OIDC_TOKEN from process.env, which Vite doesn't populate from .env files.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

// https://astro.build/config
export default defineConfig({
  site: 'https://flick-lang.com',

  session: false,
  adapter: vercel(),
  cache: {
    provider: cacheVercel()
  },

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['100 900'],
      styles: ['normal'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: ['100 800'],
      fallbacks: ['monospace'],
    },
  ],
});
