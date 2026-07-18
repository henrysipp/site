import type { RichTextItemResponse } from '@notionhq/client';

export type RichTextContent = {
	type: string;
	text: {
		content: string;
		link?: string;
	};
	annotations: {
		bold: boolean;
		italic: boolean;
		strikethrough: boolean;
		underline: boolean;
		code: boolean;
		color: string;
	};
};

export type ProcessedBlock = {
	id: string;
	type: string;
	content: RichTextContent[];
	language?: string;
	videoUrl?: string;
	tableWidth?: number;
	hasColumnHeader?: boolean;
	hasRowHeader?: boolean;
	cells?: RichTextItemResponse[][];
	tableRows?: ProcessedBlock[];
	children?: ProcessedBlock[];
};
