import { DoubleSide, ShaderMaterial } from 'three';
import { declare } from '/+std/type/utilities/declare.js';
import alphaOpaqueMaskVert from './alphaOpaqueMask.vert.js';
import alphaOpaqueMaskFrag from './alphaOpaqueMask.frag.js';
/** @import {Texture} from 'three' */

export class AlphaOpaqueMaskMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		source: { value: /** @type {Texture} */ (declare) },
	};

	constructor(/** @type {Texture} */ source) {
		super({
			name: AlphaOpaqueMaskMaterial.name,
			vertexShader: alphaOpaqueMaskVert,
			fragmentShader: alphaOpaqueMaskFrag,
			side: DoubleSide,
			toneMapped: false,
			depthWrite: false,
			depthTest: false,
		});

		this.uniforms.source.value = source;
	}
}
