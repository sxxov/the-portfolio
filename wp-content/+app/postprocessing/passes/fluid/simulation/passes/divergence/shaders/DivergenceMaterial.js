import { GLSL3, ShaderMaterial, Texture } from 'three';
import divergenceVert from './divergence.vert.js';
import divergenceFrag from './divergence.frag.js';

export class DivergenceMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		velocityMap: { value: new Texture() },
	};

	constructor() {
		super({
			name: DivergenceMaterial.name,
			glslVersion: GLSL3,
			vertexShader: divergenceVert,
			fragmentShader: divergenceFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get velocityMap() { return this.uniforms.velocityMap.value; }
	set velocityMap(value) { this.uniforms.velocityMap.value = value; }
}
