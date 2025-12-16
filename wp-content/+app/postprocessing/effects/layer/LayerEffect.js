import { BlendFunction, Effect } from 'postprocessing';
import layerFrag from './shaders/layer.frag.js';
import { Uniform } from 'three';
/** @import { Texture } from "three" */

export class LayerEffect extends Effect {
	constructor(
		/**
		 * @type {{
		 * 	map?: Texture;
		 * 	blendFunction?: BlendFunction;
		 * }}
		 */ { map, blendFunction = BlendFunction.NORMAL } = {},
	) {
		super(LayerEffect.name, layerFrag, { blendFunction });

		this.uniforms.set('map', new Uniform(map));
	}
}
