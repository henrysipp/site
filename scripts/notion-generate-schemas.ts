/**
 * Pull Notion database schemas → Zod types (briOS-style).
 *
 * Usage: yarn notion:generate-schemas
 *
 * Reads NOTION_*_DATABASE_ID env vars, fetches each data source's properties,
 * and writes schemas/notionSchemas.ts (plus raw JSON dumps).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
	Client,
	extractNotionId,
	type DataSourceObjectResponse,
} from '@notionhq/client';

type DatabaseProperty = DataSourceObjectResponse['properties'][string];

function loadDotEnv() {
	const envPath = resolve(process.cwd(), '.env');
	if (!existsSync(envPath)) return;
	for (const line of readFileSync(envPath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) process.env[key] = value;
	}
}

function escapeForTypeScript(str: string): string {
	return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Map Notion property types to Zod type strings. */
function notionPropToZod(prop: DatabaseProperty): string {
	switch (prop.type) {
		case 'title':
		case 'rich_text':
		case 'url':
		case 'email':
		case 'phone_number':
			return 'z.string().optional()';
		case 'checkbox':
			return 'z.boolean().optional()';
		case 'number':
			return 'z.number().optional()';
		case 'date':
			return 'z.string().optional()';
		case 'select': {
			const optionsArr = prop.select.options;
			if (optionsArr.length) {
				const options = optionsArr
					.map((o) => `"${escapeForTypeScript(o.name)}"`)
					.join(', ');
				return `z.enum([${options}]).optional()`;
			}
			return 'z.string().optional()';
		}
		case 'multi_select': {
			const optionsArr = prop.multi_select.options;
			if (optionsArr.length) {
				const options = optionsArr
					.map((o) => `"${escapeForTypeScript(o.name)}"`)
					.join(', ');
				return `z.array(z.enum([${options}])).optional()`;
			}
			return 'z.array(z.string()).optional()';
		}
		case 'status': {
			const optionsArr = prop.status.options;
			if (optionsArr.length) {
				const options = optionsArr
					.map((o) => `"${escapeForTypeScript(o.name)}"`)
					.join(', ');
				return `z.enum([${options}]).optional()`;
			}
			return 'z.string().optional()';
		}
		case 'people':
			return 'z.array(z.object({ id: z.string() })).optional()';
		case 'files':
			return 'z.array(z.any()).optional()';
		case 'created_time':
		case 'last_edited_time':
			return 'z.string().optional()';
		case 'created_by':
		case 'last_edited_by':
			return 'z.object({ id: z.string() }).optional()';
		case 'formula': {
			const expr = prop.formula.expression ?? '';
			const lower = expr.toLowerCase();
			if (lower.includes('formatdate') || lower.includes('format')) {
				return 'z.string().optional()';
			}
			if (
				lower.includes('sum(') ||
				lower.includes('count(') ||
				lower.includes('number(') ||
				/[0-9+\-*/]/.test(lower)
			) {
				return 'z.number().optional()';
			}
			if (lower.includes('true') || lower.includes('false')) {
				return 'z.boolean().optional()';
			}
			return 'z.any().optional()';
		}
		case 'rollup':
			return 'z.any().optional()';
		case 'relation':
			return 'z.array(z.object({ id: z.string() })).optional()';
		case 'unique_id':
			return 'z.object({ number: z.number(), prefix: z.string().nullable() }).optional()';
		case 'button':
		case 'place':
		case 'verification':
		case 'location':
		case 'last_visited_time':
			return 'z.any().optional()';
		default: {
			const _exhaustive: never = prop;
			void _exhaustive;
			return 'z.any().optional()';
		}
	}
}

type DatabaseConfig = {
	varName: string;
	id: string | undefined;
};

function normalizeId(raw: string | undefined): string | undefined {
	if (!raw?.trim()) return undefined;
	return extractNotionId(raw) ?? raw.replaceAll('-', '');
}

async function generateSchemas() {
	loadDotEnv();

	const token = process.env.NOTION_TOKEN || '';
	if (!token) {
		console.error('NOTION_TOKEN missing. Set it in .env');
		process.exit(1);
	}

	const databases: DatabaseConfig[] = [
		{ varName: 'Blog', id: normalizeId(process.env.NOTION_BLOG_DATABASE_ID) },
		{ varName: 'Gear', id: normalizeId(process.env.NOTION_GEAR_DATABASE_ID) },
		{ varName: 'Work', id: normalizeId(process.env.NOTION_WORK_DATABASE_ID) },
	];

	const configured = databases.filter((db) => db.id);
	if (configured.length === 0) {
		console.log(
			'No NOTION_*_DATABASE_ID set. Skipping.',
		);
		return;
	}

	const notion = new Client({ auth: token });
	const outDir = join(process.cwd(), 'schemas');
	mkdirSync(outDir, { recursive: true });

	const schemaLines: string[] = [
		'// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT MANUALLY',
		'// Run `yarn notion:generate-schemas` to regenerate.',
		'',
		"import { z } from 'astro/zod';",
		'',
	];

	for (let i = 0; i < databases.length; i++) {
		const db = databases[i]!;
		if (!db.id) {
			console.warn(`Skipping ${db.varName} — no ID provided`);
			continue;
		}

		if (i > 0) await new Promise((r) => setTimeout(r, 500));

		const database = await notion.databases.retrieve({ database_id: db.id });
		const dataSourceId =
			'data_sources' in database ? database.data_sources[0]?.id : undefined;
		if (!dataSourceId) {
			console.warn(`Skipping ${db.varName} — no data source found`);
			continue;
		}

		await new Promise((r) => setTimeout(r, 500));

		const dataSource = await notion.dataSources.retrieve({
			data_source_id: dataSourceId,
		});
		const props = dataSource.properties;

		writeFileSync(
			join(outDir, `${db.varName}Schema.json`),
			JSON.stringify({ props }, null, 2) + '\n',
		);

		const propLines: string[] = [];
		for (const [name, prop] of Object.entries(props)) {
			const key =
				name.includes(' ') || name.includes('-') ? `"${name}"` : name;
			propLines.push(`  ${key}: ${notionPropToZod(prop)},`);
		}

		schemaLines.push(`export const ${db.varName}Schema = z.object({`);
		schemaLines.push(...propLines);
		schemaLines.push('});');
		schemaLines.push('');
		schemaLines.push(
			`export type ${db.varName} = z.infer<typeof ${db.varName}Schema>;`,
		);
		schemaLines.push('');

		console.log(`✓ ${db.varName} (${Object.keys(props).length} properties)`);
	}

	const outPath = join(outDir, 'notionSchemas.ts');
	writeFileSync(outPath, schemaLines.join('\n') + '\n');
	console.log(`Generated ${outPath}`);
}

generateSchemas().catch((err) => {
	console.error('Failed to generate schemas', err);
	process.exit(1);
});
