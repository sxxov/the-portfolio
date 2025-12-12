import { AnimationMixer, Object3D, PerspectiveCamera } from 'three';
/** @import { GLTF } from "three/addons/loaders/GLTFLoader.js" */

export class CameraAnimation {
	constructor(/** @type {GLTF} */ gltf) {
		const { cameras, animations } = gltf;

		const [camera] = cameras;
		if (!(camera instanceof PerspectiveCamera))
			throw new Error(
				`Attempted to create CameraAnimation with GLTF that has no PerspectiveCamera.`,
			);
		this.camera = camera;

		const rig = new Object3D();
		rig.name = camera.name;
		rig.add(camera);
		this.rig = rig;

		const mixer = new AnimationMixer(rig);
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
			mixer.update(progress * (duration / 1_000));
		};

		this.mixer = mixer;
		this.duration = duration;
		this.seek = seek;
	}
}
