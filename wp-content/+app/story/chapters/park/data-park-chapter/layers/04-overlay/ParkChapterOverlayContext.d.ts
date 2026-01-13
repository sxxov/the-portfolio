import { type EffectComposer } from 'postprocessing';
import { type WebGLRenderTarget } from 'three';

export type ParkChapterOverlayContext = {
	composer: EffectComposer;
	renderTarget: WebGLRenderTarget;
};
