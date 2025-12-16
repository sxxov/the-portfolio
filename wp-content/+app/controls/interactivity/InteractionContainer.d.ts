import { type Object3D } from 'three';
import { type InteractionKind } from './InteractionKind.js';
import { type Point } from '/+std/unit/Point.js';

export type InteractionContainer = {
	kind: InteractionKind;
	pointer: Point;
	object: Object3D;
};
