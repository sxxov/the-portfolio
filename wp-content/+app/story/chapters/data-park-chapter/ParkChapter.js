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
		this.duration = animation.duration;
		this.camera = animation.camera;
		this.camera.near = 0.01;
		this.group.add(animation.rig);
	}

	seek(/** @type {number} */ progress) {
		this.animation.seek(progress);
	}
}
