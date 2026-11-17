// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';
import { cacheVercel } from '@astrojs/vercel/cache';

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  cache: {
    provider: cacheVercel()
  }
});
