import { DoubleSide, GLSL3, ShaderMaterial } from 'three';
import whiteFrag from './white.frag.js';

export class WhiteMaterial extends ShaderMaterial {
	constructor() {
		super({
			fragmentShader: whiteFrag,
			side: DoubleSide,
			glslVersion: GLSL3,
		});
	}
}
