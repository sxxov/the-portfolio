import { type Camera, type Scene, type WebGLRenderer } from 'three';
import { type OrchestratorBehavior } from './OrchestratorBehavior.js';
import { type ChapterContainer } from '../../chapter/ChapterContainer.js';
import { type BehaviorInstance } from '/+std/behavioral/factory/BehaviorInstance.js';

export type OrchestratorRenderContext = {
	time: number;
	deltaTime: number;

	renderer: WebGLRenderer;
	scene: Scene;
	camera: Camera;
	chapter: ChapterContainer;
	context: BehaviorInstance<typeof OrchestratorBehavior>;
};
