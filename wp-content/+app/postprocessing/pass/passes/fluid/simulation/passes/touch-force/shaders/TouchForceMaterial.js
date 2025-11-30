import { GLSL3, ShaderMaterial, Texture, Vector2, Vector4 } from 'three';
import touchForceVert from './touchForce.vert.js';
import touchForceFrag from './touchForce.frag.js';

export class TouchForceMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		aspect: { value: new Vector2(1, 1) },
		touches: { value: Array.from({ length: 10 }, () => new Vector4()) },
		radius: { value: 0.25 },
		velocityMap: { value: new Texture() },
	};

	constructor() {
		super({
			name: TouchForceMaterial.name,
			glslVersion: GLSL3,
			vertexShader: touchForceVert,
			fragmentShader: touchForceFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get aspect() { return this.uniforms.aspect.value.x; }
	set aspect(value) { this.uniforms.aspect.value.x = value; }

	get touches() { return this.uniforms.touches.value; }
	set touches(value) { this.uniforms.touches.value = value; }

	get radius() { return this.uniforms.radius.value; }
	set radius(value) { this.uniforms.radius.value = value; }

	get velocityMap() { return this.uniforms.velocityMap.value; }
	set velocityMap(value) { this.uniforms.velocityMap.value = value; }
}
