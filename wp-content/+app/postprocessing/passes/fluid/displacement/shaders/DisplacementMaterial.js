import { GLSL3, ShaderMaterial, Texture, Vector2 } from 'three';
import displacementVert from './displacement.vert.js';
import displacementFrag from './displacement.frag.js';

export class DisplacementMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		baseMap: { value: new Texture() },
		baseTiling: { value: new Vector2(1, 1) },
		displacementMap: { value: new Texture() },
		displacementTiling: { value: new Vector2(1, 1) },
		strength: { value: 0.1 },
	};

	constructor() {
		super({
			name: DisplacementMaterial.name,
			glslVersion: GLSL3,
			vertexShader: displacementVert,
			fragmentShader: displacementFrag,
			depthWrite: false,
			depthTest: false,
		});
	}

	get baseMap() { return this.uniforms.baseMap.value; }
	set baseMap(value) { this.uniforms.baseMap.value = value; }

	get baseTiling() { return this.uniforms.baseTiling.value; }
	set baseTiling(value) { this.uniforms.baseTiling.value = value; }

	get displacementMap() { return this.uniforms.displacementMap.value; }
	set displacementMap(value) { this.uniforms.displacementMap.value = value; }

	get displacementTiling() {
		return this.uniforms.displacementTiling.value;
	}
	set displacementTiling(value) {
		this.uniforms.displacementTiling.value = value;
	}

	get strength() { return this.uniforms.strength.value; }
	set strength(value) { this.uniforms.strength.value = value; }
}
