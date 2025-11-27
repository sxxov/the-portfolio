import { getFocalLengthFov } from '/+app/model/getFocalLengthFov.js';
import { Group, PerspectiveCamera } from 'three';
/** @import { Chapter } from "/+app/story/chapter/Chapter.js" */
/** @import { CameraAnimation } from "/+app/model/CameraAnimation.js" */

/** @implements {Chapter} */
export class ParkChapter {
	/** @readonly */
	slug = 'park';

	/** @readonly */
	group = new Group();

	constructor(/** @type {CameraAnimation} */ animation) {
		this.animation = animation;
		this.camera = new PerspectiveCamera(
			getFocalLengthFov(35),
			1,
			0.01,
			1000,
		);
		this.duration = animation.duration;

		// this.group.add(animation.cameraRig);
		animation.cameraRig.add(this.camera);
	}

	seek(/** @type {number} */ progress) {
		this.animation.seek(progress);
	}
}
