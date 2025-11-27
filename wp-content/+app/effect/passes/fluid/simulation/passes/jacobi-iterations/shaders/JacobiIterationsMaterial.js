import { GLSL3, ShaderMaterial, Texture } from 'three';
import jacobiIterationsVert from './jacobiIterations.vert.js';
import jacobiIterationsFrag from './jacobiIterations.frag.js';

export class JacobiIterationsMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		alpha: { value: -1 },
		beta: { value: 0.25 },
		valueMap: { value: new Texture() },
		divergenceMap: { value: new Texture() },
	};

	constructor() {
		super({
			name: JacobiIterationsMaterial.name,
			glslVersion: GLSL3,
			vertexShader: jacobiIterationsVert,
			fragmentShader: jacobiIterationsFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get valueMap() { return this.uniforms.valueMap.value; }
	set valueMap(value) { this.uniforms.valueMap.value = value; }

	get divergenceMap() { return this.uniforms.divergenceMap.value; }
	set divergenceMap(value) { this.uniforms.divergenceMap.value = value; }
}
