import {
	collectPaginatedAPI,
	isFullBlock,
	type BlockObjectResponse,
	type RichTextItemResponse,
} from '@notionhq/client';
import { getNotionClient } from './client';
import type { ProcessedBlock, RichTextContent } from './types';

function processRichText(richText: RichTextItemResponse[]): RichTextContent[] {
	return richText.map((text) => ({
		type: text.type,
		text: {
			content: text.plain_text,
			link: text.href ?? undefined,
		},
		annotations: {
			bold: text.annotations.bold,
			italic: text.annotations.italic,
			strikethrough: text.annotations.strikethrough,
			underline: text.annotations.underline,
			code: text.annotations.code,
			color: text.annotations.color,
		},
	}));
}

export function processBlockFromResponse(
	block: BlockObjectResponse,
): ProcessedBlock | null {
	try {
		switch (block.type) {
			case 'paragraph':
				return {
					id: block.id,
					type: 'paragraph',
					content: processRichText(block.paragraph.rich_text),
				};
			case 'heading_1':
				return {
					id: block.id,
					type: 'heading_1',
					content: processRichText(block.heading_1.rich_text),
				};
			case 'heading_2':
				return {
					id: block.id,
					type: 'heading_2',
					content: processRichText(block.heading_2.rich_text),
				};
			case 'heading_3':
				return {
					id: block.id,
					type: 'heading_3',
					content: processRichText(block.heading_3.rich_text),
				};
			case 'bulleted_list_item':
				return {
					id: block.id,
					type: 'bulleted_list_item',
					content: processRichText(block.bulleted_list_item.rich_text),
				};
			case 'numbered_list_item':
				return {
					id: block.id,
					type: 'numbered_list_item',
					content: processRichText(block.numbered_list_item.rich_text),
				};
			case 'to_do':
				return {
					id: block.id,
					type: 'to_do',
					content: processRichText(block.to_do.rich_text),
				};
			case 'toggle':
				return {
					id: block.id,
					type: 'toggle',
					content: processRichText(block.toggle.rich_text),
				};
			case 'code':
				return {
					id: block.id,
					type: 'code',
					language: block.code.language || 'plaintext',
					content: processRichText(block.code.rich_text),
				};
			case 'quote':
				return {
					id: block.id,
					type: 'quote',
					content: processRichText(block.quote.rich_text),
				};
			case 'callout':
				return {
					id: block.id,
					type: 'callout',
					content: processRichText(block.callout.rich_text),
				};
			case 'divider':
				return { id: block.id, type: 'divider', content: [] };
			case 'image': {
				const imageUrl =
					block.image.type === 'external'
						? block.image.external.url
						: block.image.file.url;
				return {
					id: block.id,
					type: 'image',
					content: [
						{
							type: 'text',
							text: { content: imageUrl },
							annotations: {
								bold: false,
								italic: false,
								strikethrough: false,
								underline: false,
								code: false,
								color: 'default',
							},
						},
					],
				};
			}
			case 'video': {
				const videoUrl =
					block.video.type === 'external'
						? block.video.external.url
						: block.video.file.url;
				return {
					id: block.id,
					type: 'video',
					content: [],
					videoUrl,
				};
			}
			case 'table':
				return {
					id: block.id,
					type: 'table',
					content: [],
					tableWidth: block.table.table_width,
					hasColumnHeader: block.table.has_column_header,
					hasRowHeader: block.table.has_row_header,
				};
			case 'table_row':
				return {
					id: block.id,
					type: 'table_row',
					content: [],
					cells: block.table_row.cells,
				};
			default:
				return null;
		}
	} catch (error) {
		console.error(`Error processing block ${block.id}:`, error);
		return null;
	}
}

/** Fetch and process all blocks for a Notion page (including nested toggle/list children). */
export async function getAllBlocks(pageId: string): Promise<ProcessedBlock[]> {
	const notion = getNotionClient();

	async function fetchChildren(blockId: string): Promise<ProcessedBlock[]> {
		const raw = await collectPaginatedAPI(
			(args) => notion.blocks.children.list(args),
			{ block_id: blockId },
		);

		const out: ProcessedBlock[] = [];

		for (const block of raw) {
			if (!isFullBlock(block) || block.in_trash) continue;
			const processedBlock = processBlockFromResponse(block);
			if (!processedBlock) continue;

			if (block.has_children) {
				if (block.type === 'table') {
					try {
						const rows = await collectPaginatedAPI(
							(args) => notion.blocks.children.list(args),
							{ block_id: block.id },
						);
						processedBlock.tableRows = rows
							.filter(isFullBlock)
							.map((child) => processBlockFromResponse(child))
							.filter(
								(row): row is ProcessedBlock =>
									row != null && row.type === 'table_row',
							);
					} catch (error) {
						console.error(
							`Error fetching table children for ${block.id}:`,
							error,
						);
					}
				} else {
					try {
						processedBlock.children = await fetchChildren(block.id);
					} catch (error) {
						console.error(
							`Error fetching children for ${block.id}:`,
							error,
						);
					}
				}
			}

			out.push(processedBlock);
		}

		return out;
	}

	try {
		return await fetchChildren(pageId);
	} catch (error) {
		console.error(`Error fetching blocks for page ${pageId}:`, error);
		return [];
	}
}
