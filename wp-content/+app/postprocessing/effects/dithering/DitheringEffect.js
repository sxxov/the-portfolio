import { Effect } from 'postprocessing';
import ditheringFrag from './shaders/dithering.frag.js';
import { Uniform } from 'three';

export class DitheringEffect extends Effect {
	constructor(
		/**
		 * @type {{
		 * 	luminanceCount?: number;
		 * }}
		 */ { luminanceCount = 4 } = {},
	) {
		super(DitheringEffect.name, ditheringFrag);

		this.uniforms.set('luminanceCount', new Uniform(luminanceCount));
	}
}
