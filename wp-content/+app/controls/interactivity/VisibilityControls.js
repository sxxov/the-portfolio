import { Box3, Controls, Frustum, Matrix4, Mesh } from 'three';
import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
import { bin } from '/+std/signal/Signal.js';
import { cast } from '/+std/type/utilities/cast.js';
/** @import { BufferGeometry, Camera, Object3D, PerspectiveCamera, Scene } from "three" */

/** @extends {Controls<{}>} */
export class VisibilityControls extends Controls {
	/** @protected @readonly */
	_ = bin();

	constructor(
		/** @type {Object3D} */ root,
		/** @type {Camera} */ camera,
		/** @type {HTMLElement} */ element,
	) {
		super(root, element);

		const { _ } = this;

		const frustum = new Frustum();
		const projScreenMatrix = new Matrix4();
		const box = new Box3();
		const visibleClasses = new /** @type {typeof Set<string>} */ (Set)();
		_._ = subscribeFrame(() => {
			projScreenMatrix.multiplyMatrices(
				camera.projectionMatrix,
				camera.matrixWorldInverse,
			);
			frustum.setFromProjectionMatrix(projScreenMatrix);

			const currentVisibleClasses =
				new /** @type {typeof Set<string>} */ (Set)();

			root.traverse((object) => {
				if (!(object instanceof Mesh)) return;
				/** @type {typeof cast<BufferGeometry>} */ (cast)(
					object.geometry,
				);

				object.geometry.computeBoundingBox();
				/** @type {typeof cast<Box3>} */ (cast)(
					object.geometry.boundingBox,
				);

				box.copy(object.geometry.boundingBox);

				object.updateWorldMatrix(true, false);
				box.applyMatrix4(object.matrixWorld);

				const intersects = frustum.intersectsBox(box);
				if (!intersects) return;

				/** @type {Object3D | null} */
				let ancestor = object;
				do {
					const name = ancestor.name
						.toLowerCase()
						.replace(/[^\w-]+/g, '-');
					if (!name) continue;

					const className = `${name}:visible`;
					currentVisibleClasses.add(className);
				} while ((ancestor = ancestor.parent));
			});

			const removedVisibleClasses = visibleClasses.difference(
				currentVisibleClasses,
			);
			for (const className of removedVisibleClasses) {
				visibleClasses.delete(className);
				element.classList.remove(className);
			}

			const addedVisibleClasses =
				currentVisibleClasses.difference(visibleClasses);
			for (const className of addedVisibleClasses) {
				visibleClasses.add(className);
				element.classList.add(className);
			}
		});
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}
}
