import { SparkRenderer, SplatFileType, SplatMesh } from '@sparkjsdev/spark';
import {
	BlendFunction,
	BloomEffect,
	CopyPass,
	EffectComposer,
	EffectPass,
	LUT3DEffect,
	RenderPass,
	ToneMappingEffect,
} from 'postprocessing';
import {
	BoxGeometry,
	Color,
	HalfFloatType,
	Material,
	Mesh,
	MeshBasicMaterial,
	Scene,
	WebGLRenderTarget,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import djangoCube from '../../assets/luts/django.cube.js';
import sceneSog from '../../assets/models/scene.sog.js';
import soul0Glb from '../../assets/models/souls/soul-0.glb.js';
import soul1Glb from '../../assets/models/souls/soul-1.glb.js';
import soul2Glb from '../../assets/models/souls/soul-2.glb.js';
import soul3Glb from '../../assets/models/souls/soul-3.glb.js';
import soul4Glb from '../../assets/models/souls/soul-4.glb.js';
import { ParkChapterBehavior } from '../../ParkChapterBehavior.js';
import { SoulMaterial } from '../../shaders/SoulMaterial.js';
import { requestAsset } from '/+app/delivery/asset/asset.js';
import { AssetPriority } from '/+app/delivery/asset/AssetPriority.js';
import { pipeChunksIntoUint8Array } from '/+app/delivery/pipes/pipeChunksIntoUint8Array.js';
import { trackProgressPromise } from '/+app/delivery/progress/progress.js';
import { LinearGradientSkybox } from '/+app/environment/linear-gradient/LinearGradientSkybox.js';
import { hasMouse } from '/+app/human/hasMouse.js';
import { requestGltf } from '/+app/model/gltf.js';
import { requestLutCube } from '/+app/model/lutCube.js';
import { DitheringEffect } from '/+app/postprocessing/effects/dithering/DitheringEffect.js';
import { NoiseEffect } from '/+app/postprocessing/effects/noise/NoiseEffect.js';
import { PeelingRenderPass } from '/+app/postprocessing/passes/peeling/PeelingRenderPass.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { ThreeTransformTheatreSchema } from '/+app/theatre/schemas/three/ThreeTransformTheatreSchema.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
/** @import { MeshPhysicalMaterial, Object3D, Texture } from "three" */
/** @import { Effect, EffectMaterial, Pass } from "postprocessing" */
/** @import { ArrayOfLength } from "/+std/type/array/ArrayOfLength.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { ReadableSignal, Starter } from "/+std/signal/Signal.js" */
/** @import { BehaviorInstance } from "/+std/behavioral/factory/BehaviorInstance.js" */
/** @import { ParkChapterParkContext } from "./ParkChapterParkContext.js" */

// rendering park with 100% quality messes up the colour encoding for some reason
const parkQuality = derive({ viewportSize }, () =>
	devicePixelRatio <= 1 ? 0.999 : 0.5,
).readonly;

const parkEnabled = new Signal(true).readonly;
const splatEnabled = new Signal(true).readonly;
const soulsEnabled = hasMouse;
const skyboxEnabled = new Signal(true).readonly;
const screenEnabled = new Signal(true).readonly;

RectAreaLightUniformsLib.init();

const { asset: sceneAsset } = requestAsset(sceneSog, pipeChunksIntoUint8Array, {
	priority: AssetPriority.High,
});

const { asset: djangoAsset } = requestLutCube(djangoCube, {
	priority: AssetPriority.Normal,
});

const { asset: soul0Asset } = requestGltf(soul0Glb, {
	priority:
		soulsEnabled.get() ? AssetPriority.Normal : AssetPriority.Deferred,
});
const { asset: soul1Asset } = requestGltf(soul1Glb, {
	priority:
		soulsEnabled.get() ? AssetPriority.Normal : AssetPriority.Deferred,
});
const { asset: soul2Asset } = requestGltf(soul2Glb, {
	priority:
		soulsEnabled.get() ? AssetPriority.Normal : AssetPriority.Deferred,
});
const { asset: soul3Asset } = requestGltf(soul3Glb, {
	priority:
		soulsEnabled.get() ? AssetPriority.Normal : AssetPriority.Deferred,
});
const { asset: soul4Asset } = requestGltf(soul4Glb, {
	priority:
		soulsEnabled.get() ? AssetPriority.Normal : AssetPriority.Deferred,
});

export const ParkChapterParkLayerBehavior = behavior(
	'park-chapter-park-layer',
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
				const { render, renderer, camera } = $orchestrator;
				const { attach } = $theatreSheet;
				const { layers } = $parkChapter;

				const fluidDisplacement = layers.derive(
					({ fluidDisplacement }) => fluidDisplacement,
				);

				/**
				 * @type {Starter<
				 * 	Signal<ParkChapterParkContext | undefined>
				 * >}
				 */
				const startPark = ({ set }) => {
					const _ = bin();

					const scene = new Scene();

					splat: _._ = splatEnabled.subscribe(async ($enabled) => {
						if (!$enabled) return;

						const _ = bin();

						const meshLoaded = new PromiseSignal(false);
						trackProgressPromise(meshLoaded);

						const fileBytes = await sceneAsset;
						if (!fileBytes) return;

						const mesh = new SplatMesh({
							fileBytes,
							fileName: sceneSog,
							fileType: SplatFileType.PCSOGSZIP,
							onLoad: () => { meshLoaded.resolve(true); },
						});
						add: { scene.add(mesh); }
						remove: _._ = () => { mesh.removeFromParent(); };

						const splatRenderer = derive(
							{ renderer },
							({ $renderer }) => {
								const it = new SparkRenderer({
									renderer: $renderer,
									maxStdDev: Math.sqrt(6),
								});
								// it.defaultView.encodeLinear = true;
								return it;
							},
						);
						_._ = splatRenderer.subscribe(($splatRenderer) => {
							const _ = bin();

							add: {
								scene.add($splatRenderer);
							}
							remove: _._ = () => {
								$splatRenderer.removeFromParent();
							};

							return _;
						});

						const value = attach('splat', {
							...new ThreeTransformTheatreSchema(),
						});
						_._ = value.subscribe((it) => {
							if (!it) return;

							const { writeMesh } = ThreeTransformTheatreSchema;
							writeMesh(it, mesh);
						});

						return _;
					});

					souls: _._ = soulsEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						const _ = bin();

						const controller = new AbortController();
						_._ = () => { controller.abort(); };
						const { signal } = controller;

						for (const [index, soulAsset] of [
							soul0Asset,
							soul1Asset,
							soul2Asset,
							soul3Asset,
							soul4Asset,
						].entries())
							void (async () => {
								const gltf = await soulAsset;
								if (!gltf) return;

								if (signal.aborted) return;

								const { scene: model } = gltf;
								add: {
									scene.add(model);
								}
								remove: _._ = () => {
									model.removeFromParent();
								};

								const modelOriginalMaterials = new Map();
								override: model.traverse((it) => {
									if (
										!(it instanceof Mesh) ||
										!(it.material instanceof Material)
									)
										return;

									modelOriginalMaterials.set(it, it.material);
									const material = new SoulMaterial();
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

								const value = attach(`soul/${index}`, {
									...new ThreeTransformTheatreSchema(),
								});
								_._ = value.subscribe((it) => {
									if (!it) return;

									const { writeMesh } =
										ThreeTransformTheatreSchema;
									writeMesh(it, model);
								});
							})();

						return _;
					});

					skybox: _._ = skyboxEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						const _ = bin();

						const skybox = new LinearGradientSkybox(
							{ color: new Color(0x000000), at: 0.2 },
							{ color: new Color(0xfefefe), at: 0.3 },
							{ color: new Color(0x000000), at: 0.6 },
						);
						add: { scene.add(skybox); }
						remove: _._ = () => { skybox.removeFromParent(); };

						return _;
					});

					screen: _._ = screenEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						const _ = bin();

						const mesh = new Mesh(
							new BoxGeometry(1, 1, 0.01),
							new MeshBasicMaterial({ color: 0x000000 }),
						);
						const value = attach('screen', {
							...new ThreeTransformTheatreSchema({
								scaleNonUniform: true,
							}),
						});
						_._ = value.subscribe((it) => {
							if (!it) return;

							const { writeMesh } = ThreeTransformTheatreSchema;
							writeMesh(it, mesh);
						});
						add: { scene.add(mesh); }
						remove: _._ = () => { mesh.removeFromParent(); };

						return _;
					});

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
						{
							camera,
							djangoAsset,
							soulsEnabled,
							fluidDisplacement,
						},
						({
							$camera,
							$djangoAsset,
							$soulsEnabled,
							$fluidDisplacement,
						}) => {
							if (!$camera) return;

							return /** @type {const} @satisfies {Pass[]} */ ([
								$soulsEnabled ?
									new PeelingRenderPass(scene, $camera)
								:	new RenderPass(scene, $camera),
								...($fluidDisplacement ?
									[$fluidDisplacement.pass]
								:	[]),
								(() => {
									const it = new EffectPass(
										$camera,
										new BloomEffect({
											blendFunction: BlendFunction.SCREEN,
											mipmapBlur: true,
											luminanceThreshold: 0.4,
											luminanceSmoothing: 0.8,
											intensity: 4.0,
											resolutionScale: 0.25,
										}),
										...($djangoAsset ?
											[
												new LUT3DEffect(
													$djangoAsset.texture3D,
												),
											]
										:	[]),
										(() => {
											const it = new NoiseEffect({
												blendFunction:
													BlendFunction.SCREEN,
												premultiply: true,
											});
											it.blendMode.opacity.value = 0.5;

											return it;
										})(),
										new ToneMappingEffect(),
										new DitheringEffect(),
									);
									// this is needed due to `SplatRenderer` emitting non-linear colors.
									// even if we were to force it to use linear, its render starts to
									// have major banding, i think due to some internal render targets it's
									// using (for read-backs?) that use 8-bit buffers.
									/** @type {EffectMaterial} */ (
										it.fullscreenMaterial
									).encodeOutput = false;
									return it;
								})(),
								new CopyPass(renderTarget),
							]);
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
								stencilBuffer: true,
								frameBufferType: HalfFloatType,
							});
							it.autoRenderToScreen = false;
							for (const pass of $passes) it.addPass(pass);

							return it;
						},
					);
					_._ = composer.subscribe((it) => () => { it?.dispose(); });
					_._ = subscribe(
						{ parkQuality, viewportSize, composer },
						({
							$parkQuality,
							$viewportSize: { width: vw, height: vh },
							$composer,
						}) => {
							if (!$composer || !some(vw) || !some(vh)) return;

							$composer.setSize(
								vw * $parkQuality,
								vh * $parkQuality,
								false,
							);
						},
					);

					result: _._ = subscribe({ composer }, ({ $composer }) => {
						if (!$composer) return;

						set({ scene, composer: $composer, renderTarget });
						return () => { set(undefined); };
					});

					return _;
				};
				const park = new Signal(
					/** @type {ParkChapterParkContext | undefined} */ (
						undefined
					),
					(context) =>
						parkEnabled.subscribe(($enabled) => {
							if (!$enabled) return;

							return startPark(context);
						}),
				);
				_._ = subscribe({ park }, ({ $park }) => {
					layers.update((layers) => ({
						...layers,
						park: $park,
					}));
				});

				_._ = subscribe(
					{ render, park }, //
					({ $render, $park }) => {
						if (!$render) return;

						const { deltaTime } = $render;
						$park?.composer.render(deltaTime);
					},
				);

				return _;
			},
		),
);
