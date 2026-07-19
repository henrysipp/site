import type { PageObjectResponse } from '@notionhq/client';
import {
	BlogSchema,
	GearSchema,
	WorkSchema,
} from '../../../schemas/notionSchemas';
import { slugify } from './slug';
import type { ProcessedBlock } from './types';

export type BlogPost = {
	id: string;
	title: string;
	slug: string;
	excerpt?: string;
	pubDate?: Date;
	lastEdited?: Date;
	tags: string[];
	featured: boolean;
	status?: string;
};

export type BlogPostWithBody = BlogPost & {
	blocks: ProcessedBlock[];
};

export type GearItem = {
	id: string;
	title: string;
	slug: string;
	description?: string;
	type?: string;
	tags: string[];
	link?: string;
	usingSince?: Date;
	lastEdited?: Date;
	imageUrl?: string;
};

export type GearItemWithBody = GearItem & {
	blocks: ProcessedBlock[];
};

export type WorkItem = {
	id: string;
	name: string;
	slug: string;
	url?: string;
	period?: string;
	order: number;
	external: boolean;
	invert: boolean;
	/** Notion page icon URL (file/external), if set. */
	iconUrl?: string;
};

function richTextPlain(
	prop: PageObjectResponse['properties'][string] | undefined,
): string {
	if (!prop) return '';
	if (prop.type === 'title') {
		return prop.title.map((t) => t.plain_text).join('').trim();
	}
	if (prop.type === 'rich_text') {
		return prop.rich_text.map((t) => t.plain_text).join('').trim();
	}
	return '';
}

function parseDate(start: string | undefined | null): Date | undefined {
	if (!start) return undefined;
	if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
		return new Date(`${start}T12:00:00.000Z`);
	}
	return new Date(start);
}

function firstFileUrl(
	prop: PageObjectResponse['properties'][string] | undefined,
): string | undefined {
	if (!prop || prop.type !== 'files' || prop.files.length === 0) return undefined;
	const file = prop.files[0];
	if (!file) return undefined;
	if (file.type === 'external') return file.external.url;
	if (file.type === 'file') return file.file.url;
	return undefined;
}

/** Flatten Notion page properties into a plain record for Zod. */
export function flattenProperties(
	page: PageObjectResponse,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const [name, prop] of Object.entries(page.properties)) {
		switch (prop.type) {
			case 'title':
				out[name] = richTextPlain(prop);
				break;
			case 'rich_text':
				out[name] = richTextPlain(prop);
				break;
			case 'checkbox':
				out[name] = prop.checkbox;
				break;
			case 'number':
				out[name] = prop.number ?? undefined;
				break;
			case 'url':
				out[name] = prop.url ?? undefined;
				break;
			case 'date':
				out[name] = prop.date?.start ?? undefined;
				break;
			case 'select':
				out[name] = prop.select?.name;
				break;
			case 'multi_select':
				out[name] = prop.multi_select.map((t) => t.name);
				break;
			case 'status':
				out[name] = prop.status?.name;
				break;
			case 'created_time':
				out[name] = prop.created_time;
				break;
			case 'last_edited_time':
				out[name] = prop.last_edited_time;
				break;
			case 'files':
				out[name] = prop.files;
				break;
			default:
				out[name] = undefined;
		}
	}

	return out;
}

export function mapBlogPage(page: PageObjectResponse): BlogPost | null {
	if (page.in_trash) return null;

	const flat = flattenProperties(page);
	const parsed = BlogSchema.safeParse(flat);
	const data = parsed.success ? parsed.data : flat;

	const title =
		(typeof data.Title === 'string' && data.Title) ||
		richTextPlain(page.properties.Title) ||
		'Untitled';
	const slugRaw =
		(typeof data.Slug === 'string' && data.Slug.trim()) || title;
	const status =
		typeof data.Status === 'string' ? data.Status : undefined;

	const pubDate = parseDate(
		typeof data['Publish date'] === 'string'
			? data['Publish date']
			: undefined,
	);
	const lastEdited = parseDate(
		typeof data['Last edited'] === 'string'
			? data['Last edited']
			: page.last_edited_time,
	);

	const tags = Array.isArray(data.Tags)
		? data.Tags.filter((t): t is string => typeof t === 'string')
		: [];

	return {
		id: page.id,
		title,
		slug: slugify(slugRaw),
		pubDate,
		lastEdited,
		tags,
		featured: data.Featured === true,
		status,
	};
}

export function mapGearPage(page: PageObjectResponse): GearItem | null {
	if (page.in_trash) return null;

	const flat = flattenProperties(page);
	const parsed = GearSchema.safeParse(flat);
	const data = parsed.success ? parsed.data : flat;

	const title =
		(typeof data.Name === 'string' && data.Name) ||
		richTextPlain(page.properties.Name) ||
		'Untitled';

	const tags = Array.isArray(data.Tags)
		? data.Tags.filter((t): t is string => typeof t === 'string')
		: [];

	return {
		id: page.id,
		title,
		slug: slugify(title),
		description:
			typeof data.Notes === 'string' && data.Notes
				? data.Notes
				: undefined,
		type: typeof data.Type === 'string' ? data.Type : undefined,
		tags,
		link: typeof data.Link === 'string' && data.Link ? data.Link : undefined,
		usingSince: parseDate(
			typeof data['Using since'] === 'string'
				? data['Using since']
				: undefined,
		),
		lastEdited: parseDate(
			typeof data.Updated === 'string'
				? data.Updated
				: page.last_edited_time,
		),
		imageUrl: firstFileUrl(page.properties.Image),
	};
}

export function isPublishedBlog(post: BlogPost): boolean {
	if (post.status && post.status !== 'Published') return false;
	return post.pubDate != null;
}

function pageIconUrl(page: PageObjectResponse): string | undefined {
	const icon = page.icon;
	if (!icon) return undefined;
	if (icon.type === 'external') return icon.external.url;
	if (icon.type === 'file') return icon.file.url;
	return undefined;
}

export function mapWorkPage(page: PageObjectResponse): WorkItem | null {
	if (page.in_trash) return null;

	const flat = flattenProperties(page);
	const parsed = WorkSchema.safeParse(flat);
	const data = parsed.success ? parsed.data : flat;

	const name =
		(typeof data.Name === 'string' && data.Name) ||
		richTextPlain(page.properties.Name) ||
		'Untitled';

	return {
		id: page.id,
		name,
		slug: slugify(name),
		url: typeof data.URL === 'string' && data.URL ? data.URL : undefined,
		period:
			typeof data.Period === 'string' && data.Period
				? data.Period
				: undefined,
		order: typeof data.Order === 'number' ? data.Order : Number.POSITIVE_INFINITY,
		external: data.External === true,
		invert: data.Invert === true,
		iconUrl: pageIconUrl(page),
	};
}
