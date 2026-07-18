export type NavItem = {
	href: string;
	label: string;
};

/** Primary site nav — markdown sections. */
export const primaryNav: NavItem[] = [
	{ href: '/blog', label: 'Blog' },
	{ href: '/gear', label: 'Gear' },
	{ href: '/about', label: 'About' },
];
