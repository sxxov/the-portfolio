import { BackSide, Mesh, SphereGeometry } from 'three';
import { LinearGradientMaterial } from './shaders/LinearGradientMaterial.js';
import { degToRad } from '/+std/math/degToRad.js';

export class LinearGradientSkybox extends Mesh {
	constructor(
		/** @type {ConstructorParameters<typeof LinearGradientMaterial>} */ ...colors
	) {
		super(
			new SphereGeometry(900, 32, 32),
			(() => {
				const it = new LinearGradientMaterial(...colors);
				it.side = BackSide;
				return it;
			})(),
		);
		this.renderOrder = Number.MAX_SAFE_INTEGER;
	}
}
