import { AnimationMixer, Object3D, PerspectiveCamera } from 'three';
/** @import { GLTF } from "three/addons/loaders/GLTFLoader.js" */

export class CameraAnimation {
	constructor(/** @type {GLTF} */ gltf) {
		const { scene: model, animations } = gltf;

		/** @type {PerspectiveCamera | undefined} */
		let camera;
		model.traverse((object) => {
			if (camera) return;

			if (object instanceof PerspectiveCamera) camera = object;
		});
		camera ??= new PerspectiveCamera();
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
			console.log(mixer.getRoot(), animations);
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
