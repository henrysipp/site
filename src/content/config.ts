import { z, defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

const post = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    date: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
  }),
})

const page= defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
  }),
})

// Expose your defined collection to Astro
// with the `collections` export
export const collections = { page, post }
