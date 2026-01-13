import { type EffectComposer } from 'postprocessing';
import { type Scene, type WebGLRenderTarget } from 'three';

export type ParkChapterParkContext = {
	scene: Scene;
	composer: EffectComposer;
	renderTarget: WebGLRenderTarget;
};
