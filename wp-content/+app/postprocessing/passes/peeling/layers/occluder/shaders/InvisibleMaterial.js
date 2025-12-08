import { DoubleSide, GLSL3, ShaderMaterial } from 'three';
import invisibleFrag from './invisible.frag.js';

export class InvisibleMaterial extends ShaderMaterial {
	constructor() {
		super({
			fragmentShader: invisibleFrag,
			side: DoubleSide,
			glslVersion: GLSL3,
		});
	}
}
