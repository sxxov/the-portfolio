import { MeshTransmissionMaterial } from '@pmndrs/vanilla/materials/MeshTransmissionMaterial.js';
import {
	EffectComposer,
	RenderPass,
	EffectPass,
	BloomEffect,
	BlendFunction,
	NoiseEffect,
	CopyPass,
} from 'postprocessing';
import {
	Scene,
	Group,
	PerspectiveCamera,
	EquirectangularReflectionMapping,
	PMREMGenerator,
	RectAreaLight,
	Mesh,
	Material,
	MeshPhysicalMaterial,
	HalfFloatType,
	WebGLRenderTarget,
} from 'three';
import { degToRad } from '/+std/math/degToRad.js';
import { ParkChapterBehavior } from '../../ParkChapterBehavior.js';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
import { FollowPointerControls } from '/+app/controls/follow-pointer/FollowPointerControls.js';
import { PointersSignal } from '/+app/human/pointers.js';
import { DitheringEffect } from '/+app/postprocessing/effects/dithering/DitheringEffect.js';
import { FluidDisplacementDelegatePass } from '/+app/postprocessing/passes/fluid/FluidDisplacementDelegatePass.js';
import { ThreeTransformTheatreSchema } from '/+app/theatre/schemas/three/ThreeTransformTheatreSchema.js';
import {
	bezierQuintOut,
	bezierQuintInOut,
} from '/+std/animation/bezier/beziers.js';
import { Tween } from '/+std/animation/Tween.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { TaskSignal } from '/+std/signal/TaskSignal.js';
import { cast } from '/+std/type/utilities/cast.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { AssetPriority } from '/+app/delivery/asset/AssetPriority.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import photoStudio011kExr from '../../assets/environments/photo-studio-01-1k.exr.js';
import computerGlb from '../../assets/models/auxiliaries/computer.glb.js';
import easelGlb from '../../assets/models/auxiliaries/easel.glb.js';
import headGlb from '../../assets/models/auxiliaries/head.glb.js';
import phoneGlb from '../../assets/models/auxiliaries/phone.glb.js';
import thinkingGlb from '../../assets/models/auxiliaries/thinking.glb.js';
import { hasMouse } from '/+app/human/hasMouse.js';
import { requestExr } from '/+app/model/exr.js';
import { requestGltf } from '/+app/model/gltf.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
/** @import { ParkChapterAuxContext } from "./ParkChapterAuxContext.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { Starter } from "/+std/signal/Signal.js" */

const auxQuality = derive({ viewportSize }, () =>
	devicePixelRatio <= 1 ? 1 : 0.5,
).readonly;

const auxEnabled = hasMouse;

RectAreaLightUniformsLib.init();

const { asset: photoStudio011kAsset } = requestExr(photoStudio011kExr, {
	priority: AssetPriority.High,
});

const { asset: headAsset } = requestGltf(headGlb, {
	priority: AssetPriority.Deferred,
});
const { asset: computerAsset } = requestGltf(computerGlb, {
	priority: AssetPriority.Deferred,
});
const { asset: phoneAsset } = requestGltf(phoneGlb, {
	priority: AssetPriority.Deferred,
});
const { asset: thinkingAsset } = requestGltf(thinkingGlb, {
	priority: AssetPriority.Deferred,
});
const { asset: easelAsset } = requestGltf(easelGlb, {
	priority: AssetPriority.Deferred,
});

export const ParkChapterAuxLayerBehavior = behavior(
	'park-chapter-aux-layer',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				theatreSheet: getContext(TheatreSheetBehavior),
				parkChapter: getContext(ParkChapterBehavior),
			},
			({ $orchestrator, $theatreSheet, $parkChapter }) => {
				if (!$orchestrator || !$theatreSheet || !$parkChapter) return;

				const _ = bin();
				const { render, renderer, eventsContainer } = $orchestrator;
				const { waypointContexts, layers } = $parkChapter;
				const { attach } = $theatreSheet;

				const park = layers.derive(({ park }) => park);
				const fluidDisplacement = layers.derive(
					({ fluidDisplacement }) => fluidDisplacement,
				);

				/**
				 * @type {Starter<
				 * 	Signal<ParkChapterAuxContext | undefined>
				 * >}
				 */
				const startAux = ({ set }) => {
					const _ = bin();

					const controller = new AbortController();
					_._ = () => { controller.abort(); };
					const { signal } = controller;

					const scene = new Scene();
					const cameraRig = (() => {
						const it = new Group();
						const value = attach('aux/camera', {
							...new ThreeTransformTheatreSchema(),
						});
						_._ = value.subscribe(($value) => {
							if (!$value) return;

							const { writeMesh } = ThreeTransformTheatreSchema;
							writeMesh($value, it);
						});

						return it;
					})();
					scene.add(cameraRig);

					const camera = (() => {
						const it = new PerspectiveCamera(30, 1, 0.01, 1_000);
						_._ = subscribe(
							{ viewportSize },
							({ $viewportSize: { width: vw, height: vh } }) => {
								if (!some(vw) || !some(vh)) return;

								it.aspect = vw / vh;
								it.updateProjectionMatrix();
							},
						);
						it.position.set(0, 0, 10);
						it.lookAt(0, 0, 0);

						return it;
					})();
					cameraRig.add(camera);

					environment: void (async () => {
						const asset = await photoStudio011kAsset;
						if (!asset || signal.aborted) return;
						asset.mapping = EquirectangularReflectionMapping;

						_._ = subscribe({ renderer }, ({ $renderer }) => {
							const pmremGenerator = new PMREMGenerator(
								$renderer,
							);
							pmremGenerator.compileEquirectangularShader();

							const hdriRenderTarget =
								pmremGenerator.fromEquirectangular(asset);

							return render.subscribe(() => {
								const { texture: hdriTexture } =
									hdriRenderTarget;
								scene.environment = hdriTexture;
							});
						});
					})();

					const followRig = new Group();
					scene.add(followRig);

					follow: {
						const pointer = new Signal(
							/** @type {Point | undefined} */ (undefined),
							({ set, trigger }) =>
								subscribe(
									{ eventsContainer },
									({ $eventsContainer }) => {
										if (!$eventsContainer) return;

										const pointers = new PointersSignal(
											$eventsContainer,
										);
										return pointers.subscribe(
											([pointer]) => {
												set(pointer);
												trigger();
											},
										);
									},
								),
						);
						const smoothedPointer = new TaskSignal(
							/** @type {Point | undefined} */ (undefined),
							({ set }) => {
								const x = new SmoothingSignal(
									0,
									{
										smoothingFactor: 0.02,
										speedPerSecond: 60000,
									},
									({ set }) =>
										pointer.subscribe(($pointer) => {
											if (!$pointer) return;
											set($pointer.x);
										}),
								);
								const y = new SmoothingSignal(
									0,
									{
										smoothingFactor: 0.02,
										speedPerSecond: 60000,
									},
									({ set }) =>
										pointer.subscribe(($pointer) => {
											if (!$pointer) return;
											set($pointer.y);
										}),
								);
								return render.subscribe(() => {
									set({ x: x.get(), y: y.get() });
								});
							},
						);

						const followControls = derive(
							{ eventsContainer },
							({ $eventsContainer }) => {
								if (!$eventsContainer) return;

								return new FollowPointerControls(
									followRig,
									camera,
									$eventsContainer,
									smoothedPointer,
								);
							},
						);
						_._ = followControls.subscribe((it) => () => {
							it?.dispose();
						});
					}

					const group = new Group();
					group.name = 'aux';
					followRig.add(group);

					lights: for (const light of [
						.../** @type {const} */ ([
							[1, 1, 1],
							[-1, 1, 1],
							[1, -1, 1],
							[1, 1, -1],
							[-1, -1, 1],
							[-1, 1, -1],
							[1, -1, -1],
							[-1, -1, -1],
						]).map(([x, y, z]) => {
							const it = new RectAreaLight(0xffffff, 0.2, 10, 10);
							it.position.set(x * 5, y * 5, z * 5);
							return it;
						}),

						(() => {
							const it = new RectAreaLight(0xffffff, 0.2, 20, 20);
							it.position.set(0, 0, -5);
							return it;
						})(),
					]) {
						light.lookAt(0, 0, 0);
						group.add(light);
					}

					models: for (const [
						name,
						modelAsset,
					] of /** @type {const} */ ([
						['phone', phoneAsset],
						['thinking', thinkingAsset],
						['easel', easelAsset],
						['computer', computerAsset],
						['head', headAsset],
					]))
						void (async () => {
							const gltf = await modelAsset;
							if (!gltf || signal.aborted) return;

							const root = new Group();
							root.name = `aux/${name}`;
							group.add(root);

							const peekRig = new Group();
							root.add(peekRig);

							const spinRig = new Group();
							peekRig.add(spinRig);
							spin: {
								_._ = render.subscribe((it) => {
									if (!it) return;
									const { deltaTime } = it;
									spinRig.rotation.y +=
										degToRad(360) * (deltaTime / 6 / 1_000);
								});
							}

							const spawnRig = new Group();
							spinRig.add(spawnRig);
							spawn: {
								const visible = new Signal(false, ({ set }) =>
									subscribe(
										{ waypointContexts },
										({ $waypointContexts }) => {
											const context = $waypointContexts
												.values()
												.find(
													({ model }) =>
														model === name,
												);
											if (!context) return;

											const { hovering } = context;
											return hovering.subscribe(set);
										},
									),
								);
								_._ = subscribe({ visible }, ({ $visible }) => {
									const _ = bin();
									if ($visible) {
										const tween = new Tween(
											spawnRig.scale.x,
											1,
											500,
											bezierQuintOut,
										);
										void tween.play();
										add: {
											tween.subscribe((it) => {
												spawnRig.scale.setScalar(it);
											});
										}
										remove: _._ = () => {
											tween.pause();
										};
									} else {
										const tween = new Tween(
											spawnRig.scale.x,
											0,
											500,
											bezierQuintInOut,
										);
										void tween.play();
										add: {
											tween.subscribe((it) => {
												spawnRig.scale.setScalar(it);
											});
										}
										remove: _._ = () => {
											tween.pause();
										};
									}
									return _;
								});
							}

							const { scene: model } = gltf;
							spawnRig.add(model);

							const modelOriginalMaterials = new Map();
							materials: _._ = subscribe(
								{ park },
								({ $park }) => {
									if (!$park) return;

									const _ = bin();

									override: model.traverse((it) => {
										if (
											!(it instanceof Mesh) ||
											!(it.material instanceof Material)
										)
											return;
										/** @type {typeof cast<MeshPhysicalMaterial>} */ (
											cast
										)(it.material);

										modelOriginalMaterials.set(
											it,
											it.material,
										);
										const material =
											new MeshTransmissionMaterial({
												_transmission: 1,
												thickness: 0.6,
												chromaticAberration: 0.1,
												anisotropicBlur: 0.5,
												distortion: 1,
												temporalDistortion: 0.3,
												// the type for `buffer` is wrong with this release of @pmndrs/vanilla
												buffer: /** @type {any} */ (
													$park.renderTarget.texture
												),
											});
										material.emissiveIntensity = 1;

										material.transparent = false;
										material.reflectivity = 0.2;
										material.roughness = 0.1;

										material.transmissionMap =
											it.material.transmissionMap;
										material.normalMap =
											it.material.normalMap;
										material.bumpMap = it.material.bumpMap;

										it.material = material;
									});
									revert: _._ = () => {
										for (const [
											model,
											material,
										] of modelOriginalMaterials)
											model.material = material;
										modelOriginalMaterials.clear();
									};

									return _;
								},
							);

							const value = attach(`aux/${name}`, {
								...new ThreeTransformTheatreSchema(),
							});
							_._ = value.subscribe((it) => {
								if (!it) return;

								const { writeMesh } =
									ThreeTransformTheatreSchema;
								writeMesh(it, model);
							});
						})();

					const renderTarget = (() => {
						const it = new WebGLRenderTarget(1, 1, {
							depthBuffer: false,
							stencilBuffer: false,
						});
						_._ = () => { it.dispose(); };
						_._ = subscribe(
							{ viewportSize },
							({ $viewportSize: { width, height } }) => {
								if (!some(width) || !some(height)) return;

								it.setSize(width, height);
							},
						);
						return it;
					})();
					const passes = derive(
						{ viewportSize, fluidDisplacement },
						({ $fluidDisplacement }) => {
							if (!$fluidDisplacement) return;

							return [
								(() => {
									const it = new RenderPass(scene, camera);
									it.clearPass.overrideClearAlpha = 0;

									return it;
								})(),
								...($fluidDisplacement.pass ?
									[
										new FluidDisplacementDelegatePass(
											$fluidDisplacement.pass,
										),
									]
								:	[]),
								new EffectPass(
									camera,
									new BloomEffect({
										blendFunction:
											BlendFunction.COLOR_DODGE,
										mipmapBlur: true,
										radius: 0.9,
										levels: 8,
										luminanceThreshold: 0.1,
										luminanceSmoothing: 0.6,
										intensity: 3,
									}),
									(() => {
										const it = new NoiseEffect({
											blendFunction: BlendFunction.SCREEN,
											premultiply: true,
										});
										it.blendMode.opacity.value = 0.5;

										return it;
									})(),
									new DitheringEffect({ luminanceCount: 4 }),
								),
								new CopyPass(renderTarget),
							];
						},
					);
					_._ = passes.subscribe(($passes) => () => {
						if (!$passes) return;

						for (const pass of $passes) pass.dispose();
					});
					const composer = derive(
						{ renderer, passes },
						({ $renderer, $passes }) => {
							if (!$passes) return;

							const it = new EffectComposer($renderer, {
								frameBufferType: HalfFloatType,
							});
							it.autoRenderToScreen = false;
							for (const pass of $passes) it.addPass(pass);

							return it;
						},
					);
					_._ = composer.subscribe((it) => () => { it?.dispose(); });
					_._ = subscribe(
						{ auxQuality, viewportSize, composer },
						({
							$auxQuality,
							$viewportSize: { width: vw, height: vh },
							$composer,
						}) => {
							if (!$composer || !some(vw) || !some(vh)) return;

							$composer.setSize(
								vw * $auxQuality,
								vh * $auxQuality,
								false,
							);
						},
					);

					result: _._ = subscribe({ composer }, ({ $composer }) => {
						if (!$composer) return;

						set({
							scene,
							cameraRig,
							camera,
							composer: $composer,
							renderTarget,
						});
						return () => { set(undefined); };
					});

					return _;
				};
				const aux = new Signal(
					/** @type {ParkChapterAuxContext | undefined} */ (
						undefined
					),
					(context) =>
						auxEnabled.subscribe(($enabled) => {
							if (!$enabled) return;

							return startAux(context);
						}),
				);
				_._ = subscribe({ aux }, ({ $aux }) => {
					layers.update((layers) => ({
						...layers,
						aux: $aux,
					}));
				});

				_._ = subscribe(
					{ render, aux }, //
					({ $render, $aux }) => {
						if (!$render) return;

						const { deltaTime } = $render;
						$aux?.composer.render(deltaTime);
					},
				);

				return _;
			},
		),
);
