import { AnimationMixer, Object3D } from 'three';
import { cast } from '/+std/type/utilities/cast.js';
/** @import { GLTF } from "three/addons/loaders/GLTFLoader.js" */

export class CameraAnimation {
	constructor(/** @type {GLTF} */ gltf) {
		const { scene: model, animations } = gltf;

		/** @type {Object3D | undefined} */
		let cameraRig;
		model.traverse((object) => {
			if (cameraRig) return;

			if (object.name.toLowerCase().includes('camera')) {
				/** @type {typeof cast<Object3D>} */ (cast)(object);
				cameraRig = object;
			}
		});
		cameraRig ??= new Object3D();
		this.cameraRig = cameraRig;

		const mixer = new AnimationMixer(cameraRig);
		const duration = (() => {
			let it = -Infinity;
			for (const clip of animations)
				it = Math.max(it, clip.duration * 1_000);
			return it;
		})();
		const seek = (/** @type {number} */ progress) => {
			mixer.time = 0;
			for (const clip of animations) {
				const action = mixer.clipAction(clip);
				action.time = 0;
				action.play();
			}
			mixer.update(progress * (duration / 1000));
		};

		this.mixer = mixer;
		this.duration = duration;
		this.seek = seek;
	}
}
