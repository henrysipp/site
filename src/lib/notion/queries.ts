import {
	collectPaginatedAPI,
	isFullPage,
	type PageObjectResponse,
} from '@notionhq/client';
import { getAllBlocks } from './blocks';
import { CACHE_TTLS, cachedNotionQuery } from './cache';
import {
	getBlogDatabaseId,
	getGearDatabaseId,
	getNotionClient,
	getRootPageId,
	getWorkDatabaseId,
} from './client';
import {
	isPublishedBlog,
	mapBlogPage,
	mapGearPage,
	mapWorkPage,
	type BlogPost,
	type BlogPostWithBody,
	type GearItem,
	type GearItemWithBody,
	type WorkItem,
} from './map';
import type { ProcessedBlock } from './types';

async function getDataSourceId(databaseId: string): Promise<string> {
	return cachedNotionQuery(
		`notion:datasource:${databaseId}`,
		async () => {
			const notion = getNotionClient();
			const database = await notion.databases.retrieve({
				database_id: databaseId,
			});
			const id =
				'data_sources' in database
					? database.data_sources[0]?.id
					: undefined;
			if (!id) {
				throw new Error(`No data source for database ${databaseId}`);
			}
			return id;
		},
		{ ttl: CACHE_TTLS.DATA_SOURCE },
	);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
	const databaseId = getBlogDatabaseId();
	if (!databaseId) return [];

	return cachedNotionQuery(
		'notion:blog:list',
		async () => {
			const notion = getNotionClient();
			const dataSourceId = await getDataSourceId(databaseId);
			const rows = await collectPaginatedAPI(
				(args) => notion.dataSources.query(args),
				{
					data_source_id: dataSourceId,
					filter: {
						property: 'Publish date',
						date: { is_not_empty: true },
					},
					sorts: [
						{
							property: 'Publish date',
							direction: 'descending',
						},
					],
				},
			);

			return rows
				.filter(isFullPage)
				.map((page) => mapBlogPage(page as PageObjectResponse))
				.filter((post): post is BlogPost => post != null)
				.filter(isPublishedBlog);
		},
		{ ttl: CACHE_TTLS.LIST },
	);
}

export async function getBlogPostBySlug(
	slug: string,
): Promise<BlogPostWithBody | null> {
	return cachedNotionQuery(
		`notion:blog:content:${slug}`,
		async () => {
			const posts = await getBlogPosts();
			const match = posts.find((post) => post.slug === slug);
			if (!match) return null;

			const blocks = await getAllBlocks(match.id);
			return { ...match, blocks };
		},
		{ ttl: CACHE_TTLS.CONTENT },
	);
}

export async function getGearItems(): Promise<GearItem[]> {
	const databaseId = getGearDatabaseId();
	if (!databaseId) return [];

	return cachedNotionQuery(
		'notion:gear:list',
		async () => {
			const notion = getNotionClient();
			const dataSourceId = await getDataSourceId(databaseId);
			const rows = await collectPaginatedAPI(
				(args) => notion.dataSources.query(args),
				{
					data_source_id: dataSourceId,
					sorts: [
						{
							property: 'Name',
							direction: 'ascending',
						},
					],
				},
			);

			return rows
				.filter(isFullPage)
				.map((page) => mapGearPage(page as PageObjectResponse))
				.filter((item): item is GearItem => item != null)
				.sort((a, b) => a.title.localeCompare(b.title));
		},
		{ ttl: CACHE_TTLS.LIST },
	);
}

export async function getGearItemBySlug(
	slug: string,
): Promise<GearItemWithBody | null> {
	return cachedNotionQuery(
		`notion:gear:content:${slug}`,
		async () => {
			const items = await getGearItems();
			const match = items.find((item) => item.slug === slug);
			if (!match) return null;

			const blocks = await getAllBlocks(match.id);
			return { ...match, blocks };
		},
		{ ttl: CACHE_TTLS.CONTENT },
	);
}

/** Root site page: Notion page title + body blocks (skips child DBs / empty paragraphs). */
export async function getRootPage(): Promise<{
	title: string;
	blocks: ProcessedBlock[];
}> {
	const pageId = getRootPageId();
	if (!pageId) return { title: '', blocks: [] };

	return cachedNotionQuery(
		'notion:root:page',
		async () => {
			const notion = getNotionClient();
			const page = await notion.pages.retrieve({ page_id: pageId });
			let title = '';
			if (isFullPage(page)) {
				const titleProp = Object.values(page.properties).find(
					(prop) => prop.type === 'title',
				);
				if (titleProp?.type === 'title') {
					title = titleProp.title.map((t) => t.plain_text).join('').trim();
				}
			}

			const blocks = (await getAllBlocks(pageId)).filter((block) => {
				if (
					block.type === 'divider' ||
					block.type === 'image' ||
					block.type === 'video'
				) {
					return true;
				}
				return block.content.some((rt) => rt.text.content.trim().length > 0);
			});

			return { title, blocks };
		},
		{ ttl: CACHE_TTLS.CONTENT },
	);
}

export async function getWorkItems(): Promise<WorkItem[]> {
	const databaseId = getWorkDatabaseId();
	if (!databaseId) return [];

	return cachedNotionQuery(
		'notion:work:list',
		async () => {
			const notion = getNotionClient();
			const dataSourceId = await getDataSourceId(databaseId);
			const rows = await collectPaginatedAPI(
				(args) => notion.dataSources.query(args),
				{
					data_source_id: dataSourceId,
					sorts: [
						{
							property: 'Order',
							direction: 'ascending',
						},
					],
				},
			);

			return rows
				.filter(isFullPage)
				.map((page) => mapWorkPage(page as PageObjectResponse))
				.filter((item): item is WorkItem => item != null)
				.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
		},
		{ ttl: CACHE_TTLS.LIST },
	);
}
