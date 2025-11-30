import { GLSL3, ShaderMaterial, Texture, Vector2, Vector4 } from 'three';
import touchValueVert from './touchValue.vert.js';
import touchValueFrag from './touchValue.frag.js';

export class TouchValueMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		aspect: { value: new Vector2(1, 1) },
		touches: { value: Array.from({ length: 10 }, () => new Vector4()) },
		radius: { value: 0.25 },
		valueMap: { value: new Texture() },
	};

	constructor() {
		super({
			name: TouchValueMaterial.name,
			glslVersion: GLSL3,
			vertexShader: touchValueVert,
			fragmentShader: touchValueFrag,
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

	get valueMap() { return this.uniforms.valueMap.value; }
	set valueMap(value) { this.uniforms.valueMap.value = value; }
}
