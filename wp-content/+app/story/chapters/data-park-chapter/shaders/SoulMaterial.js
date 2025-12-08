import {
	AddEquation,
	Color,
	CustomBlending,
	DoubleSide,
	GLSL3,
	ShaderMaterial,
	Vector4,
} from 'three';
import soulFrag from './soul.frag.js';
import soulVert from './soul.vert.js';
import { bin } from '/+std/signal/Signal.js';
import { subscribeFrame } from '/+std/animation/subscribeFrame.js';

export class SoulMaterial extends ShaderMaterial {
	/** @override */
	uniforms = {
		time: { value: 0 },
		seed: { value: Math.random() * 1000 },
		color: { value: new Color(0xffffff) },
	};

	/** @private @readonly */
	_ = bin();

	constructor() {
		super({
			name: SoulMaterial.name,
			side: DoubleSide,
			vertexShader: soulVert,
			fragmentShader: soulFrag,
			glslVersion: GLSL3,

			blending: CustomBlending,
			blendEquation: AddEquation,
		});

		const { _ } = this;
		_._ = subscribeFrame((deltaTime) => {
			this.uniforms.time.value += deltaTime / 1_000;
		});
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}

	get color() { return this.uniforms.color.value; }
	set color(value) { this.uniforms.color.value = value; }
}
