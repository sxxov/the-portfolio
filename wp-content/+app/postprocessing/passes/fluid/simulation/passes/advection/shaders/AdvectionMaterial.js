import { GLSL3, ShaderMaterial, Texture } from 'three';
import advectionVert from './advection.vert.js';
import advectionFrag from './advection.frag.js';

export class AdvectionMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		deltaTime: { value: 0 },
		velocityMap: { value: new Texture() },
		valueMap: { value: new Texture() },
		decay: { value: 0.01 },
	};

	constructor() {
		super({
			name: AdvectionMaterial.name,
			glslVersion: GLSL3,
			vertexShader: advectionVert,
			fragmentShader: advectionFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get deltaTime() { return this.uniforms.deltaTime.value; }
	set deltaTime(value) { this.uniforms.deltaTime.value = value; }

	get velocityMap() { return this.uniforms.velocityMap.value; }
	set velocityMap(value) { this.uniforms.velocityMap.value = value; }

	get valueMap() { return this.uniforms.valueMap.value; }
	set valueMap(value) { this.uniforms.valueMap.value = value; }

	get decay() { return this.uniforms.decay.value; }
	set decay(value) { this.uniforms.decay.value = value; }
}
