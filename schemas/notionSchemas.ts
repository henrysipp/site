// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
// Run `yarn notion:generate-schemas` to regenerate.

import { z } from 'astro/zod';

export const BlogSchema = z.object({
  Featured: z.boolean().optional(),
  Slug: z.string().optional(),
  Status: z.enum(["Draft", "In review", "Published"]).optional(),
  Tags: z.array(z.enum(["Tech", "Personal", "Writing"])).optional(),
  Created: z.string().optional(),
  "Last edited": z.string().optional(),
  "Publish date": z.string().optional(),
  Title: z.string().optional(),
});

export type Blog = z.infer<typeof BlogSchema>;

export const GearSchema = z.object({
  Tags: z.array(z.enum(["Daily", "Work", "Personal", "Travel"])).optional(),
  Updated: z.string().optional(),
  Image: z.array(z.any()).optional(),
  "Using since": z.string().optional(),
  Notes: z.string().optional(),
  Link: z.string().optional(),
  Type: z.enum(["Software", "Hardware", "Camera", "Car", "Service", "Other"]).optional(),
  Name: z.string().optional(),
});

export type Gear = z.infer<typeof GearSchema>;

export const WorkSchema = z.object({
  Period: z.string().optional(),
  Order: z.number().optional(),
  URL: z.string().optional(),
  External: z.boolean().optional(),
  Invert: z.boolean().optional(),
  Name: z.string().optional(),
});

export type Work = z.infer<typeof WorkSchema>;

