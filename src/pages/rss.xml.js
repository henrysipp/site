import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getBlogPosts } from '../lib/notion';

export const prerender = false;

export async function GET(context) {
	const posts = await getBlogPosts();

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.title,
			description: post.excerpt ?? post.title,
			pubDate: post.pubDate,
			link: `/blog/${post.slug}/`,
		})),
	});
}
