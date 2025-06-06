// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import cloudflare from '@astrojs/cloudflare'
import node from '@astrojs/node'

export default defineConfig({
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },

  adapter:
    process.env.NODE_ENV === 'development'
      ? node({ mode: 'standalone' })
      : cloudflare({
          // imageService: 'cloudflare',
        }),
})
