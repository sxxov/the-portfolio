import { DoubleSide, ShaderMaterial } from 'three';
import whiteFrag from './white.frag.js';

export class WhiteMaterial extends ShaderMaterial {
	constructor() {
		super({
			fragmentShader: whiteFrag,
			side: DoubleSide,
		});
	}
}
