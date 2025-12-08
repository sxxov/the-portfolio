import { GLSL3, ShaderMaterial, Texture } from 'three';
import gradientSubtractionVert from './gradientSubtraction.vert.js';
import gradientSubtractionFrag from './gradientSubtraction.frag.js';

export class GradientSubtractionMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		velocityMap: { value: new Texture() },
		pressureMap: { value: new Texture() },
	};

	constructor() {
		super({
			name: GradientSubtractionMaterial.name,
			glslVersion: GLSL3,
			vertexShader: gradientSubtractionVert,
			fragmentShader: gradientSubtractionFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get velocityMap() { return this.uniforms.velocityMap.value; }
	set velocityMap(value) { this.uniforms.velocityMap.value = value; }

	get pressureMap() { return this.uniforms.pressureMap.value; }
	set pressureMap(value) { this.uniforms.pressureMap.value = value; }
}
