# Text config

Pulled from `kmk360-mobile-app` (`src/design-system/Typography/textConfig.ts` + size/weight tokens in `Theme/font.ts`).

Use via `<Text variant="body1" />` — see `Text.astro` for Tailwind mappings.

## Size tokens (px)

| Token | Size |
| ----- | ---- |
| `2xs` | 10 |
| `xs`  | 12 |
| `sm`  | 14 |
| `base` / `md` | 16 |
| `lg`  | 18 |
| `xl`  | 20 |
| `2xl` | 22 |
| `3xl` | 26 |
| `4xl` | 32 |
| `5xl` | 40 |

## Weight tokens

| Token | CSS weight | Notes |
| ----- | ---------- | ----- |
| `normal` / `regular` | 400 | |
| `bold` | 600 | Maps to semibold faces |
| `heavy` | 800 | |

Default family is Inter. Headlines use Poppins.

## Semantic styles

| Name | Size | Weight | Family | Line height |
| ---- | ---- | ------ | ------ | ----------- |
| `headline1` | `4xl` (32) | normal | display (serif) | 1.2 |
| `headline2` | `3xl` (26) | normal | display (serif) | 1.25 |
| `title` | `2xl` (22) | normal | inter | 1.25 |
| `titleEmphasized` | `2xl` (22) | bold | inter | 1.25 |
| `label` | `lg` (18) | normal | inter | 1.25 |
| `labelEmphasized` | `lg` (18) | bold | inter | 1.25 |
| `body1` | `base` (16) | normal | inter | 1.25 |
| `body1Emphasized` | `base` (16) | bold | inter | 1.25 |
| `body2` | `sm` (14) | normal | inter | 1.25 |
| `body2Emphasized` | `sm` (14) | bold | inter | 1.25 |

## Semantic colors (names only)

`primaryText` · `secondaryText` · `textOnColor` · `primaryButton` · `secondaryButton` · `link` · `linkOnColor`
