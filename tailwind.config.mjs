import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['"HW Cigars"', 'serif'],
			},
			colors: {
				mist: {
					50: 'oklch(98.7% 0.002 197.1)',
					100: 'oklch(96.3% 0.002 197.1)',
					200: 'oklch(92.5% 0.005 214.3)',
					300: 'oklch(87.2% 0.007 219.6)',
					400: 'oklch(72.3% 0.014 214.4)',
					500: 'oklch(56% 0.021 213.5)',
					600: 'oklch(45% 0.017 213.2)',
					700: 'oklch(37.8% 0.015 216)',
					800: 'oklch(27.5% 0.011 216.9)',
					900: 'oklch(21.8% 0.008 223.9)',
					950: 'oklch(14.8% 0.004 228.8)',
				},
			},
			textColor: {
				primary: 'var(--text-primary)',
				secondary: 'var(--text-secondary)',
				tertiary: 'var(--text-tertiary)',
			},
			typography: ({ theme }) => ({
				mist: {
					css: {
						'--tw-prose-body': theme('colors.mist.700'),
						'--tw-prose-headings': theme('colors.mist.900'),
						'--tw-prose-links': theme('colors.mist.900'),
						'--tw-prose-bold': theme('colors.mist.900'),
						'--tw-prose-counters': theme('colors.mist.500'),
						'--tw-prose-bullets': theme('colors.mist.300'),
						'--tw-prose-hr': theme('colors.mist.200'),
						'--tw-prose-quotes': theme('colors.mist.900'),
						'--tw-prose-quote-borders': theme('colors.mist.200'),
						'--tw-prose-captions': theme('colors.mist.500'),
						'--tw-prose-code': theme('colors.mist.900'),
						'--tw-prose-pre-code': theme('colors.mist.200'),
						'--tw-prose-pre-bg': theme('colors.mist.900'),
						'--tw-prose-th-borders': theme('colors.mist.300'),
						'--tw-prose-td-borders': theme('colors.mist.200'),
						'--tw-prose-invert-body': theme('colors.mist.300'),
						'--tw-prose-invert-headings': theme('colors.mist.50'),
						'--tw-prose-invert-links': theme('colors.mist.50'),
						'--tw-prose-invert-bold': theme('colors.mist.50'),
						'--tw-prose-invert-counters': theme('colors.mist.400'),
						'--tw-prose-invert-bullets': theme('colors.mist.600'),
						'--tw-prose-invert-hr': theme('colors.mist.700'),
						'--tw-prose-invert-quotes': theme('colors.mist.100'),
						'--tw-prose-invert-quote-borders': theme('colors.mist.700'),
						'--tw-prose-invert-captions': theme('colors.mist.400'),
						'--tw-prose-invert-code': theme('colors.mist.50'),
						'--tw-prose-invert-pre-code': theme('colors.mist.200'),
						'--tw-prose-invert-pre-bg': theme('colors.mist.900'),
						'--tw-prose-invert-th-borders': theme('colors.mist.600'),
						'--tw-prose-invert-td-borders': theme('colors.mist.700'),
					},
				},
			}),
		},
	},
	plugins: [typography],
};
