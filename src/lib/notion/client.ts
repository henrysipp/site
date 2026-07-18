import { Client, extractNotionId } from '@notionhq/client';

function env(name: string): string {
	return (
		(typeof import.meta !== 'undefined'
			? (import.meta.env?.[name] as string | undefined)
			: undefined) ||
		process.env[name] ||
		''
	);
}

export function getNotionToken(): string {
	return env('NOTION_TOKEN');
}

export function getBlogDatabaseId(): string {
	const raw = env('NOTION_BLOG_DATABASE_ID');
	return extractNotionId(raw) ?? raw.replaceAll('-', '');
}

export function getGearDatabaseId(): string {
	const raw = env('NOTION_GEAR_DATABASE_ID');
	return extractNotionId(raw) ?? raw.replaceAll('-', '');
}

let client: Client | null = null;

export function getNotionClient(): Client {
	const token = getNotionToken();
	if (!token) {
		throw new Error('NOTION_TOKEN is missing. Set it in .env');
	}
	if (!client) {
		client = new Client({ auth: token });
	}
	return client;
}
