import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

const gear = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/gear' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		image: z.string(),
		tags: z.array(z.enum(['workspace', 'daily carry', 'tech', 'home', 'software'])),
		link: z.string().optional(),
		addedDate: z.coerce.date().optional(),
	}),
});

export const collections = { blog, gear };
