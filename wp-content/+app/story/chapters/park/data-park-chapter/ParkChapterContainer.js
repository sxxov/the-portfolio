import { Group } from 'three';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
/** @import { ChapterContainer } from "../../../chapter/ChapterContainer.js" */
/** @import { CameraAnimation } from "/+app/model/CameraAnimation.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */

/** @implements {ChapterContainer} */
export class ParkChapterContainer {
	/** @readonly */
	slug = 'park';

	/** @readonly */
	group = new Group();

	/** @protected @readonly */
	progress = new SmoothingSignal(
		/** @type {Ranged<0 | 1>} */ (0),
		{ smoothingFactor: 0.03, speedPerSecond: 3000 },
		({ subscribe: sub }) => sub((it) => { this.animation.seek(it); }),
	);

	constructor(/** @type {CameraAnimation} */ animation) {
		this.animation = animation;
		this.duration = animation.duration;
		this.camera = animation.camera;
		this.camera.near = 0.01;
		this.group.add(animation.rig);
	}

	seek(/** @type {Ranged<0 | 1>} */ progress) {
		this.progress.set(progress);
	}
}
