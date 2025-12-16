import { Raycaster, Vector2 } from 'three';
import { InteractionKind } from './InteractionKind.js';
import { PointersSignal } from '/+app/human/pointers.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { some } from '/+std/functional/some.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { isParentInteracted } from './isParentInteracted.js';
/** @import { Camera, Object3D, Scene } from "three" */
/** @import { InteractionContainer } from "./InteractionContainer.js" */
/** @import { Point } from "/+std/unit/Point.js" */

/** @extends {Signal<Map<Point, Set<InteractionContainer>>>} */
export class InteractionsSignal extends Signal {
	constructor(
		/** @type {Object3D} */ root,
		/** @type {Camera} */ camera,
		/** @type {HTMLElement} */ element,
	) {
		super(new Map(), ({ get, update, trigger }) => {
			const _ = bin();

			const controller = new AbortController();
			_._ = () => { controller.abort(); };
			const { signal } = controller;

			const rect = watchElementRect(element);
			const pointers = new PointersSignal(element);
			const raycaster = new Raycaster();

			/** @type {Map<number, InteractionContainer>} */
			const pointerIdToInteraction = new Map();
			element.addEventListener(
				'pointerdown',
				(event) => {
					const { pointerId } = event;
					const $interactions = get();

					const closestInteraction = $interactions.values().reduce(
						(prev, curr) => {
							const closest = curr.values().reduce((p, c) => {
								const currDistance = Math.hypot(
									c.pointer.x - event.offsetX,
									c.pointer.y - event.offsetY,
								);

								if (
									(p && currDistance >= p.distance) ||
									(prev && currDistance >= prev.distance)
								)
									return p;

								return {
									selected: c,
									distance: currDistance,
								};
							}, /** @type {typeof prev} */ (undefined));

							return closest ?? prev;
						},
						/**
						 * @type {{
						 * 			selected: InteractionContainer;
						 * 			distance: number;
						 * 	  }
						 * 	| undefined}
						 */ (undefined),
					)?.selected;
					if (!closestInteraction) return;

					// console.log('capturing', pointerId, closestInteraction);
					pointerIdToInteraction.set(pointerId, closestInteraction);
					closestInteraction.kind = InteractionKind.Active;
					trigger();
				},
				{ passive: true, signal },
			);
			element.addEventListener(
				'pointerup',
				(event) => {
					const { pointerId } = event;
					const $interactions = get();

					const interaction = pointerIdToInteraction.get(pointerId);
					if (!interaction) return;

					if (!$interactions.has(interaction.pointer)) return;

					// console.log('releasing', pointerId, interaction);
					pointerIdToInteraction.delete(pointerId);
					interaction.kind = InteractionKind.Hover;
					trigger();
				},
				{ passive: true, signal },
			);

			_._ = subscribe(
				{ pointers, rect },
				({ $pointers, $rect: { width, height } }) => {
					if (!some(width) || !some(height)) return;

					update((interactions) => {
						let changed = false;
						const workingNdc = new Vector2();

						unpointed: for (const [p] of interactions)
							if (!$pointers.has(p)) {
								changed = true;
								// console.log(
								// 	'removing unpointed interaction',
								// 	interactions.get(p),
								// );
								interactions.delete(p);
							}

						// always change, assume pointers have moved
						changed = true;
						for (const pointer of $pointers) {
							const ndcX = (pointer.x / width) * 2 - 1;
							const ndcY = -(pointer.y / height) * 2 + 1;
							workingNdc.set(ndcX, ndcY);
							raycaster.setFromCamera(workingNdc, camera);

							const intersections = raycaster.intersectObjects(
								root.children,
								true,
							);
							const currentInteractions =
								new /** @type {typeof Set<InteractionContainer>} */ (
									Set
								)();
							create: for (const intersection of intersections) {
								let interactionSet = interactions.get(pointer);
								if (!interactionSet) {
									interactionSet = new Set();
									changed = true;
									interactions.set(pointer, interactionSet);
								}

								let interaction = interactionSet
									.values()
									.find((it) =>
										isParentInteracted(
											intersection.object,
											it.object,
										),
									);
								if (!interaction) {
									// console.log('creating new interaction', [
									// 	...interactionSet.values(),
									// ]);
									interaction = {
										kind: InteractionKind.Hover,
										pointer,
										object: intersection.object,
									};
									changed = true;
									interactionSet.add(interaction);
								}

								currentInteractions.add(interaction);
							}

							stale: for (const [
								,
								interactionSet,
							] of interactions) {
								for (const interaction of interactionSet) {
									if (
										interaction.kind ===
											InteractionKind.Active ||
										currentInteractions.has(interaction)
									)
										continue;
									// console.log(
									// 	'removing stale interaction',
									// 	interaction,
									// );
									changed = true;
									interactionSet.delete(interaction);
								}
							}
						}

						if (changed) trigger();
						return interactions;
					});
				},
			);

			return _;
		});
	}
}
