import { DoubleSide, ShaderMaterial } from 'three';
import invisibleFrag from './invisible.frag.js';

export class InvisibleMaterial extends ShaderMaterial {
	constructor() {
		super({
			fragmentShader: invisibleFrag,
			side: DoubleSide,
		});
	}
}
