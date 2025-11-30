import { GLSL3, ShaderMaterial, Vector4 } from 'three';
import linearGradientVert from './linear-gradient.vert.js';
import linearGradientFrag from './linear-gradient.frag.js';
import { clamp01 } from '/+std/math/clamp01.js';
/** @import { Color } from "three" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */

export class LinearGradientMaterial extends ShaderMaterial {
	/** @typedef {{ color: Color; alpha?: number; at?: Ranged<0 | 1> }} GradientStop */

	/** @override */
	uniforms = {
		stopColors: { value: /** @type {Vector4[]} */ ([]) },
		stopPositions: { value: new Float32Array() },
	};

	/** @override */
	defines = {
		stopCount: 1,
	};

	constructor(/** @type {[GradientStop, ...GradientStop[]]} */ ...colors) {
		super({
			name: LinearGradientMaterial.name,
			vertexShader: linearGradientVert,
			fragmentShader: linearGradientFrag,
			glslVersion: GLSL3,
		});

		const stops = this.getNormalizedStops(colors);

		this.defines.stopCount = stops.length;

		const stopColors = stops.map(
			({ color, alpha }) => new Vector4(color.r, color.g, color.b, alpha),
		);
		this.uniforms.stopColors.value = stopColors;

		const stopPositions = new Float32Array(stops.map(({ at }) => at));
		this.uniforms.stopPositions.value = stopPositions;

		this.transparent = stops.some(({ alpha }) => alpha < 1);
	}

	/** @private */
	getNormalizedStops(/** @type {[GradientStop, ...GradientStop[]]} */ stops) {
		const normalized = stops
			.map((stop, index, { length }) => ({
				...stop,
				alpha: clamp01(stop.alpha ?? 1),
				at: clamp01(
					length === 1 ? 0 : (stop.at ?? index / (length - 1)),
				),
			}))
			.sort((a, b) => a.at - b.at);

		return normalized;
	}
}
