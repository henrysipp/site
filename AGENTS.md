# Agent conventions

## Prefer Astro SSR over client-built markup

Page structure and content must be rendered with Astro’s server APIs (`.astro` components, slots, `getStaticPaths`, content collections, frontmatter). Do **not** build or rebuild navigable page chrome or content in client JavaScript (`innerHTML`, string HTML templates, JSON payloads hydrated into DOM, etc.).

**Why:** Client-assembled markup is not reliably SEO-compatible, duplicates templates that already exist in Astro, and fights View Transitions / `transition:persist` instead of using them correctly.

**Do:**
- Render lists, nav, and body content in `.astro` with slots and props
- Use Astro’s transition APIs (`transition:persist`, `transition:name`, etc.) on real server-rendered DOM
- Limit `<script>` to behavior only (focus, active-state toggles, animation classes)—never to invent page structure

**Don’t:**
- Ship JSON (or similar) and re-render the same UI in a client `render*` helper
- Duplicate Astro component markup as HTML strings in scripts
- Use `transition:persist` in a way that forces client-side re-rendering of persisted chrome

If a transition or persist edge case seems to require client HTML, fix the Astro/transition approach first. Client-built pages are a last resort and need an explicit justification—not the default.

## Use Heroicons

Use Heroicons for every interface icon. Do not mix in Tabler, Lucide, or other icon sets.
Store each Heroicon as a reusable Astro component under `src/components/icons/`; do not embed SVG markup directly at usage sites.
