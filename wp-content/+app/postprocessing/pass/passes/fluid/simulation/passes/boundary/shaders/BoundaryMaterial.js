import { GLSL3, ShaderMaterial, Texture } from 'three';
import boundaryVert from './boundary.vert.js';
import boundaryFrag from './boundary.frag.js';

export class BoundaryMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		velocityMap: { value: new Texture() },
	};

	constructor() {
		super({
			name: BoundaryMaterial.name,
			glslVersion: GLSL3,
			vertexShader: boundaryVert,
			fragmentShader: boundaryFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get velocityMap() { return this.uniforms.velocityMap.value; }
	set velocityMap(value) { this.uniforms.velocityMap.value = value; }
}
