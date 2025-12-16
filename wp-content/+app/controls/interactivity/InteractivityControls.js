import { Controls } from 'three';
import { InteractionsSignal } from './InteractionsSignal.js';
import { bin } from '/+std/signal/Signal.js';
/** @import { Camera, Object3D } from "three" */

/** @extends {Controls<{}>} */
export class InteractivityControls extends Controls {
	/** @protected @readonly */
	_ = bin();

	constructor(
		/** @type {Object3D} */ root,
		/** @type {Camera} */ camera,
		/** @type {HTMLElement} */ element,
	) {
		super(root, element);

		const { _ } = this;

		this.interactions = new InteractionsSignal(root, camera, element);
		_._ = () => { this.interactions.destroy(); };

		const interactionClasses = new /** @type {typeof Set<string>} */ (
			Set
		)();
		_._ = this.interactions.subscribe(($interactions) => {
			const currentInteractionClasses =
				new /** @type {typeof Set<string>} */ (Set)();

			for (const [, interactionsSet] of $interactions)
				for (const { kind, object } of interactionsSet) {
					/** @type {Object3D | null} */
					let ancestor = object;
					do {
						const name = ancestor.name
							.toLowerCase()
							.replace(/[^\w-]+/g, '-');
						if (!name) continue;

						const className = `${name}:${kind}`;
						currentInteractionClasses.add(className);
					} while ((ancestor = ancestor.parent));
				}

			const removedInteractionClasses = interactionClasses.difference(
				currentInteractionClasses,
			);
			for (const className of removedInteractionClasses) {
				interactionClasses.delete(className);
				element.classList.remove(className);
			}

			const addedInteractionClasses =
				currentInteractionClasses.difference(interactionClasses);
			for (const className of addedInteractionClasses) {
				interactionClasses.add(className);
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
