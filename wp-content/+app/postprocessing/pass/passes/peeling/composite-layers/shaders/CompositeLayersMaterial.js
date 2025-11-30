import { ShaderMaterial, Vector4 } from 'three';
import compositeLayersVert from './compositeLayers.vert.js';
import compositeLayersFrag from './compositeLayers.frag.js';
import { declare } from '/+std/type/utilities/declare.js';
/** @import { Blending, Texture } from "three" */

export class CompositeLayersMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		occluder: { value: /** @type {Texture} */ (declare) },
		background: { value: /** @type {Texture} */ (declare) },
		foreground: { value: /** @type {Texture} */ (declare) },

		clearColor: { value: new Vector4(0, 0, 0, 0) },
	};

	constructor(
		/** @type {Texture} */ occluder,
		/** @type {Texture} */ background,
		/** @type {Texture} */ foreground,
	) {
		super({
			name: CompositeLayersMaterial.name,
			vertexShader: compositeLayersVert,
			fragmentShader: compositeLayersFrag,
			depthWrite: false,
			depthTest: false,
		});

		this.uniforms.occluder.value = occluder;
		this.uniforms.background.value = background;
		this.uniforms.foreground.value = foreground;
	}

	get clearColor() { return this.uniforms.clearColor.value; }
	set clearColor(value) { this.uniforms.clearColor.value = value; }
}
