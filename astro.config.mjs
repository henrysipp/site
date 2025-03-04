// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

import mdx from "@astrojs/mdx";

export default defineConfig({
  integrations: [
    mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    // imageService: 'cloudflare',
  }),
});