import { type Group, type Camera } from 'three';

export type ChapterContainer = {
	readonly slug: string;
	readonly duration: number;

	readonly camera: Camera;
	readonly group: Group;

	seek(progress: number): void;
};
