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
} from './client';
import {
	isPublishedBlog,
	mapBlogPage,
	mapGearPage,
	type BlogPost,
	type BlogPostWithBody,
	type GearItem,
	type GearItemWithBody,
} from './map';

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
