import { Object3D, Vector2, Vector3 } from 'three';
import { OrchestratorBehavior } from '../../orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { ParkMapBehavior } from '../data-park-map/ParkMapBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { ThreeTransformTheatreSchema } from '/+app/theatre/schemas/three/ThreeTransformTheatreSchema.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { setStyles } from '/+std/dom/setStyles.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { some } from '/+std/functional/some.js';
import { clamp01 } from '/+std/math/clamp01.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { ParkChapterBehavior } from '../data-park-chapter/ParkChapterBehavior.js';
import { watchElementHovering } from '/+app/dom/watchElementHovering.js';
/** @import { Rect } from "/+std/unit/Rect.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { ParkWaypointContext } from "../data-park-chapter/ParkChapterBehavior.js" */

export const ParkWaypointBehavior = behavior(
	'park-waypoint',
	class {
		'' = t.string;
		model = t.string;
		signX = t.number.transient.attributing.styling
			.choices(-1, 0, 1)
			.default(0);
		signY = t.number.transient.attributing.styling
			.choices(-1, 0, 1)
			.default(0);
	},
	(element, { '': name, model, signX, signY }, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				theatreSheet: getContext(TheatreSheetBehavior),
				parkChapter: getContext(ParkChapterBehavior),
				parkMap: getContext(ParkMapBehavior),
			},
			({ $orchestrator, $theatreSheet, $parkChapter, $parkMap }) => {
				if (
					!$orchestrator ||
					!$theatreSheet ||
					!$parkChapter ||
					!$parkMap
				)
					return;

				const { canvas, render, camera } = $orchestrator;
				const { attach } = $theatreSheet;
				const { waypointContexts } = $parkChapter;
				const { rect: mapRect, group: mapGroup } = $parkMap;

				const _ = bin();

				const canvasRect = new Signal(
					/** @type {Rect<number> | Rect<undefined>} */ ({
						x: undefined,
						y: undefined,
						width: undefined,
						height: undefined,
					}),
					({ set }) =>
						subscribe({ canvas }, ({ $canvas }) => {
							if (!$canvas) return;

							return watchElementRect($canvas).subscribe(set);
						}),
				);

				const hovering = watchElementHovering(element);

				const context = derive(
					{ name, model },
					({ $name, $model }) => ({
						hovering,
						name: $name ?? '',
						model: $model ?? '',
					}),
				);
				_._ = subscribe({ context }, ({ $context }) => {
					const _ = bin();
					add: {
						waypointContexts.update((it) => {
							it.add($context);
							waypointContexts.trigger();
							return it;
						});
					}
					remove: _._ = () => {
						waypointContexts.update((it) => {
							it.delete($context);
							waypointContexts.trigger();
							return it;
						});
					};
					return _;
				});

				const waypoint = new Signal(
					/** @type {Object3D | undefined} */ (undefined),
					({ set }) =>
						subscribe({ name }, ({ $name }) => {
							const _ = bin();

							const it = new Object3D();
							it.name = `waypoint/${$name}`;

							const value = attach(`waypoint/${$name}`, {
								...new ThreeTransformTheatreSchema(),
							});
							_._ = value.subscribe(($value) => {
								if (!$value) return;

								const { writeMesh } =
									ThreeTransformTheatreSchema;
								writeMesh($value, it);
							});

							set(it);

							add: { mapGroup.add(it); }
							remove: _._ = () => { mapGroup.remove(it); };

							return _;
						}),
				);

				const workingWorldPosition = new Vector3();
				const workingProjectedPosition = new Vector3();
				const workingCameraPosition = new Vector3();
				const workingCameraDirection = new Vector3();
				const workingToPoint = new Vector3();
				const uv = new Signal(
					/** @type {Point<number> | Point<undefined>} */ ({
						x: undefined,
						y: undefined,
					}),
					({ update, trigger }) =>
						subscribe(
							{ waypoint, camera, render },
							({ $waypoint, $camera }) => {
								if (!$waypoint || !$camera) return;

								const o = $waypoint;

								o.updateWorldMatrix(true, false);

								// true world-space position (do NOT mutate this when projecting)
								const worldPosition =
									o.getWorldPosition(workingWorldPosition);

								// camera forward test in world-space (stable)
								$camera.getWorldPosition(workingCameraPosition);
								$camera.getWorldDirection(
									workingCameraDirection,
								);
								workingToPoint
									.copy(worldPosition)
									.sub(workingCameraPosition);
								const isBehindCamera =
									workingCameraDirection.dot(workingToPoint) <
									0;

								// project a COPY into NDC
								const screenPosition = workingProjectedPosition
									.copy(worldPosition)
									.project($camera);

								// if behind, flip direction so indicators stay continuous around the edge
								// (do NOT do this using worldPosition.project(), it breaks the behind test)
								const ndcX =
									isBehindCamera ?
										-screenPosition.x
									:	screenPosition.x;
								const ndcY =
									isBehindCamera ?
										-screenPosition.y
									:	screenPosition.y;

								// map NDC (-1..1) to UV (0..1). Note: UV here is intentionally unclamped.
								const x = (ndcX + 1) / 2;
								const y = (1 - ndcY) / 2;

								// guard against NaN/Infinity (can happen if projection becomes invalid)
								if (!Number.isFinite(x) || !Number.isFinite(y))
									return;

								update((it) => {
									if (it.x === x && it.y === y) return it;

									it.x = x;
									it.y = y;
									trigger();
									return it;
								});
							},
						),
				);
				const mapUv = new Signal(
					/** @type {Point<number> | Point<undefined>} */ ({
						x: undefined,
						y: undefined,
					}),
					({ update, trigger }) =>
						subscribe(
							{ uv, canvasRect, mapRect },
							({
								$uv: { x: uvX, y: uvY },
								$canvasRect: {
									x: sx,
									y: sy,
									width: sw,
									height: sh,
								},
								$mapRect: {
									x: dx,
									y: dy,
									width: dw,
									height: dh,
								},
							}) => {
								if (
									!some(uvX) ||
									!some(uvY) ||
									!some(sx) ||
									!some(sy) ||
									!some(sw) ||
									!some(sh) ||
									!some(dx) ||
									!some(dy) ||
									!some(dw) ||
									!some(dh)
								)
									return;

								const offsetX = (dx - sx) / sw;
								const offsetY = (dy - sy) / sh;
								const scaleX = dw / sw;
								const scaleY = dh / sh;

								const mapUvX = uvX * scaleX + offsetX;
								const mapUvY = uvY * scaleY + offsetY;

								update((it) => {
									if (it.x === mapUvX && it.y === mapUvY)
										return it;

									it.x = mapUvX;
									it.y = mapUvY;
									trigger();
									return it;
								});
							},
						),
				);
				const workingDirection = new Vector2();
				const workingNormalizedMapUv = new Vector2();
				const normalizedMapUv = new Signal(
					/** @type {Point<number> | Point<undefined>} */ ({
						x: undefined,
						y: undefined,
					}),
					({ update, trigger }) =>
						subscribe(
							{ mapUv },
							({ $mapUv: { x: uvX, y: uvY } }) => {
								if (!some(uvX) || !some(uvY)) return;

								clamp: {
									// fast path: already inside
									if (
										uvX >= 0 &&
										uvX <= 1 &&
										uvY >= 0 &&
										uvY <= 1
									) {
										workingNormalizedMapUv.set(uvX, uvY);
										break clamp;
									}

									// vector from center (un-normalized on purpose)
									const dx = uvX - 0.5;
									const dy = uvY - 0.5;

									// degenerate: exactly at center; pick center
									if (dx === 0 && dy === 0) {
										workingNormalizedMapUv.set(0.5, 0.5);
										break clamp;
									}

									// 1) direction vector based on center (normalized), if you still want it
									workingDirection.set(dx, dy).normalize();

									// 2) Project to the edge by scaling (dx,dy) so the first component hits +/-0.5
									//    This is equivalent to intersecting the ray with the box, but more numerically stable.
									const sx =
										dx === 0 ? Infinity : (
											0.5 / Math.abs(dx)
										);
									const sy =
										dy === 0 ? Infinity : (
											0.5 / Math.abs(dy)
										);
									const s = Math.min(sx, sy);

									workingNormalizedMapUv.set(
										0.5 + dx * s,
										0.5 + dy * s,
									);

									// numerical safety: keep it in bounds after float error
									workingNormalizedMapUv.x = clamp01(
										workingNormalizedMapUv.x,
									);
									workingNormalizedMapUv.y = clamp01(
										workingNormalizedMapUv.y,
									);
								}

								const { x: normX, y: normY } =
									workingNormalizedMapUv;

								update((it) => {
									if (it.x === normX && it.y === normY)
										return it;

									it.x = normX;
									it.y = normY;
									trigger();
									return it;
								});
							},
						),
				);

				_._ = subscribe(
					{ normalizedMapUv, mapRect },
					({
						$mapRect: { width: vw, height: vh },
						$normalizedMapUv: { x: uvX, y: uvY },
					}) => {
						if (!some(uvX) || !some(uvY) || !some(vw) || !some(vh))
							return;

						setStyles(element, {
							translate: `${uvX * vw}px ${uvY * vh}px`,
						});
					},
				);

				_._ = subscribe(
					{ normalizedMapUv },
					({ $normalizedMapUv: { x: uvX, y: uvY } }) => {
						if (!some(uvX) || !some(uvY)) return;

						const epsilon = 0.001;
						signX.set(
							uvX <= epsilon ? -1
							: uvX >= 1 - epsilon ? 1
							: uvX * 2 - 1,
						);
						signY.set(
							uvY <= epsilon ? -1
							: uvY >= 1 - epsilon ? 1
							: uvY * 2 - 1,
						);
					},
				);

				return _;
			},
		),
);
