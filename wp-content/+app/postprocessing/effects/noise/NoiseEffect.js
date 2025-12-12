import { BlendFunction, Effect } from 'postprocessing';
import noiseFrag from './shaders/noise.frag.js';

export class NoiseEffect extends Effect {
	constructor(
		/**
		 * @type {{
		 * 	blendFunction?: BlendFunction;
		 * 	static?: boolean;
		 * 	monochrome?: boolean;
		 * 	premultiply?: boolean;
		 * }}
		 */ {
			blendFunction = BlendFunction.SCREEN,
			static: static_ = false,
			monochrome = true,
			premultiply = false,
		} = {},
	) {
		super(NoiseEffect.name, noiseFrag, { blendFunction });

		if (static_) this.defines.set('static', '');
		if (monochrome) this.defines.set('monochrome', '');
		if (premultiply) this.defines.set('premultiply', '');
	}
}
