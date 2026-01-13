import { type EffectComposer } from 'postprocessing';
import {
	type Group,
	type PerspectiveCamera,
	type Scene,
	type WebGLRenderTarget,
} from 'three';

export type ParkChapterAuxContext = {
	scene: Scene;
	cameraRig: Group;
	camera: PerspectiveCamera;
	composer: EffectComposer;
	renderTarget: WebGLRenderTarget;
};
