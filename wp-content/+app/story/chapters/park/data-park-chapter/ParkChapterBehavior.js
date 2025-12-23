import { MeshTransmissionMaterial } from '@pmndrs/vanilla/materials/MeshTransmissionMaterial.js';
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
	Color,
	EquirectangularReflectionMapping,
	Group,
	HalfFloatType,
	Material,
	Mesh,
	PerspectiveCamera,
	PMREMGenerator,
	RectAreaLight,
	Scene,
	WebGLRenderTarget,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ParkMapBehavior } from '../data-park-map/ParkMapBehavior.js';
import photoStudio011kExr from './environments/photo-studio-01-1k.exr.js';
import dataJson from './lottie/data.json.js';
import djangoCube from './luts/django.cube.js';
import computerGlb from './models/auxiliaries/computer.glb.js';
import easelGlb from './models/auxiliaries/easel.glb.js';
import headGlb from './models/auxiliaries/head.glb.js';
import phoneGlb from './models/auxiliaries/phone.glb.js';
import thinkingGlb from './models/auxiliaries/thinking.glb.js';
import cameraGlb from './models/camera.glb.js';
import sceneSog from './models/scene.sog.js';
import soul0Glb from './models/souls/soul-0.glb.js';
import soul1Glb from './models/souls/soul-1.glb.js';
import soul2Glb from './models/souls/soul-2.glb.js';
import soul3Glb from './models/souls/soul-3.glb.js';
import soul4Glb from './models/souls/soul-4.glb.js';
import { ParkChapterContainer } from './ParkChapterContainer.js';
import { SoulMaterial } from './shaders/SoulMaterial.js';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
import { FollowPointerControls } from '/+app/controls/follow-pointer/FollowPointerControls.js';
import { HoverOrbitControls } from '/+app/controls/hover-orbit/HoverOrbitControls.js';
import { HoverOrbitTheatreSchema } from '/+app/controls/hover-orbit/HoverOrbitTheatreSchema.js';
import { requestAsset } from '/+app/delivery/asset/asset.js';
import { pipeChunksIntoJson } from '/+app/delivery/pipes/pipeChunksIntoJson.js';
import { pipeChunksIntoUint8Array } from '/+app/delivery/pipes/pipeChunksIntoUint8Array.js';
import { trackProgressPromise } from '/+app/delivery/progress/progress.js';
import { LinearGradientSkybox } from '/+app/environment/linear-gradient/LinearGradientSkybox.js';
import { PointersSignal } from '/+app/human/pointers.js';
import { CameraAnimation } from '/+app/model/CameraAnimation.js';
import { requestExr } from '/+app/model/exr.js';
import { requestGltf } from '/+app/model/gltf.js';
import { requestLutCube } from '/+app/model/lutCube.js';
import { AsciiEffect } from '/+app/postprocessing/effects/ascii/AsciiEffect.js';
import { DitheringEffect } from '/+app/postprocessing/effects/dithering/DitheringEffect.js';
import { LayerEffect } from '/+app/postprocessing/effects/layer/LayerEffect.js';
import { NoiseEffect } from '/+app/postprocessing/effects/noise/NoiseEffect.js';
import { FluidDisplacementDelegatePass } from '/+app/postprocessing/passes/fluid/FluidDisplacementDelegatePass.js';
import { FluidDisplacementPass } from '/+app/postprocessing/passes/fluid/FluidDisplacementPass.js';
import { PeelingRenderPass } from '/+app/postprocessing/passes/peeling/PeelingRenderPass.js';
import { OrchestratorChapterBehavior } from '/+app/story/orchestrator/data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { DotLottieTexture } from '/+app/texture/lottie/DotLottieTexture.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { ThreeTransformTheatreSchema } from '/+app/theatre/schemas/three/ThreeTransformTheatreSchema.js';
import {
	bezierQuintInOut,
	bezierQuintOut,
} from '/+std/animation/bezier/beziers.js';
import { Tween } from '/+std/animation/Tween.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { degToRad } from '/+std/math/degToRad.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { TaskSignal } from '/+std/signal/TaskSignal.js';
import { cast } from '/+std/type/utilities/cast.js';
import { hasMouse } from '/+app/human/hasMouse.js';
import { AssetPriority } from '/+app/delivery/asset/AssetPriority.js';
/** @import { MeshPhysicalMaterial, Object3D, Texture } from "three" */
/** @import { Effect, EffectMaterial, Pass } from "postprocessing" */
/** @import { ArrayOfLength } from "/+std/type/array/ArrayOfLength.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { ReadableSignal, Starter } from "/+std/signal/Signal.js" */
/** @import { BehaviorInstance } from "/+std/behavioral/factory/BehaviorInstance.js" */

const parkQuality = 0.5;
const overlayQuality = 0.5;
const auxQuality = 0.5;
const compositeQuality = 1;

const parkEnabled = new Signal(true);
const orbitEnabled = hasMouse;
const splatEnabled = new Signal(true);
const soulsEnabled = hasMouse;
const skyboxEnabled = new Signal(true);
const overlayEnabled = hasMouse;
const auxEnabled = hasMouse;
const fluidDisplacementEnabled = hasMouse;
const compositeEnabled = new Signal(true);

RectAreaLightUniformsLib.init();

const { asset: cameraAsset } = requestGltf(cameraGlb, {
	priority: AssetPriority.High,
});

const { asset: sceneAsset } = requestAsset(sceneSog, pipeChunksIntoUint8Array, {
	priority: AssetPriority.High,
});

const { asset: djangoAsset } = requestLutCube(djangoCube, {
	priority: AssetPriority.Normal,
});

const { asset: photoStudio011kAsset } = requestExr(photoStudio011kExr, {
	priority: AssetPriority.High,
});

const { asset: lottieDataAsset } = requestAsset(dataJson, pipeChunksIntoJson, {
	priority:
		overlayEnabled.get() ? AssetPriority.High : AssetPriority.Deferred,
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

const asciiCharSet = AsciiEffect.defaultCharSet;
const spaceMonoFont = new PromiseSignal(
	/** @type {FontFace | undefined} */ (undefined),
	async ({ resolve }) => {
		resolve(
			(await document.fonts.load('1rem Space Mono', asciiCharSet))[0],
		);
	},
);

/**
 * @typedef {{
 * 	name: string;
 * 	model: string;
 * 	hovering: ReadableSignal<boolean>;
 * }} ParkWaypointContext
 */
export const ParkChapterBehavior = behavior(
	'park-chapter',
	class {
		waypointContexts = new Signal(
			new /** @type {typeof Set<ParkWaypointContext>} */ (Set)(),
		);
	},
	(element, { waypointContexts }, { getContext, registerLocalBehaviors }) => {
		registerLocalBehaviors(ParkMapBehavior);

		const chapter = derive({ cameraAsset }, ({ $cameraAsset }) => {
			if (!$cameraAsset) return;

			return new ParkChapterContainer(new CameraAnimation($cameraAsset));
		});
		const group = derive({ chapter }, ({ $chapter }) => {
			if (!$chapter) return;

			return $chapter.group;
		});
		const attachGroup = (/** @type {Object3D} */ object) => {
			return subscribe({ group }, ({ $group }) => {
				if (!$group) return;

				$group.add(object);
				return () => { $group.remove(object); };
			});
		};
		const attach = (
			/** @type {BehaviorInstance<typeof OrchestratorBehavior>} */ $orchestrator,
			/** @type {BehaviorInstance<typeof OrchestratorChapterBehavior>} */ $orchestratorChapter,
			/** @type {BehaviorInstance<typeof TheatreSheetBehavior>} */ $theatreSheet,
		) => {
			const _ = bin();
			const { attach, seek } = $theatreSheet;
			const {
				eventsContainer,
				render,
				renderer,
				scene,
				camera,
				viewportSize,
			} = $orchestrator;
			const { progress } = $orchestratorChapter;

			const createResizingRenderTarget = () => {
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
			};

			chapter: {
				$orchestratorChapter.chapterContainer.in(chapter);
			}

			theatre: {
				_._ = progress.subscribe(seek);
			}

			orbit: _._ = orbitEnabled.subscribe(($enabled) => {
				if (!$enabled) return;

				const _ = bin();

				const value = attach('orbit', {
					...new HoverOrbitTheatreSchema(),
				});
				const controls = derive(
					{ camera, eventsContainer },
					({ $camera, $eventsContainer }) => {
						if (!$camera || !$eventsContainer) return;

						return new HoverOrbitControls(
							$camera,
							$eventsContainer,
						);
					},
				);
				_._ = controls.subscribe((it) => () => { it?.dispose(); });
				_._ = subscribe(
					{ controls, render, value },
					({ $controls, $value }) => {
						if (!$controls || !$value) return;

						const { writeControls } = HoverOrbitTheatreSchema;
						writeControls($value, $controls);
					},
				);
				_._ = subscribe(
					{ render, value, controls },
					({ $render, $controls }) => {
						if (!$render || !$controls) return;

						const { deltaTime } = $render;
						$controls.update(deltaTime);
					},
				);

				return _;
			});

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
				_._ = attachGroup(mesh);

				const splatRenderer = derive({ renderer }, ({ $renderer }) => {
					const it = new SparkRenderer({
						renderer: $renderer,
						maxStdDev: Math.sqrt(6),
					});
					// it.defaultView.encodeLinear = true;
					return it;
				});
				_._ = splatRenderer.subscribe(attachGroup);

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
						_._ = attachGroup(model);

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

							const { writeMesh } = ThreeTransformTheatreSchema;
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
				_._ = attachGroup(skybox);

				return _;
			});

			/**
			 * @typedef {{
			 * 	pass: FluidDisplacementPass;
			 * }} FluidDisplacementContext
			 */
			/**
			 * @type {Starter<
			 * 	Signal<FluidDisplacementContext | undefined>
			 * >}
			 */
			const startFluidDisplacement = ({ set }) => {
				const _ = bin();

				const pass = derive(
					{ eventsContainer },
					({ $eventsContainer }) => {
						if (!$eventsContainer) return;

						return new FluidDisplacementPass(
							new PointersSignal($eventsContainer),
						);
					},
				);

				result: _._ = subscribe({ pass }, ({ $pass }) => {
					if (!$pass) return;

					set({ pass: $pass });
					return () => { set(undefined); };
				});

				return _;
			};
			const fluidDisplacement = new Signal(
				/** @type {FluidDisplacementContext | undefined} */ (undefined),
				(context) =>
					fluidDisplacementEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						return startFluidDisplacement(context);
					}),
			);

			/**
			 * @typedef {{
			 * 	composer: EffectComposer;
			 * 	renderTarget: WebGLRenderTarget;
			 * }} ParkContext
			 */
			/** @type {Starter<Signal<ParkContext | undefined>>} */
			const startPark = ({ set }) => {
				const _ = bin();

				const renderTarget = createResizingRenderTarget();
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
											blendFunction: BlendFunction.SCREEN,
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
					{ viewportSize, composer },
					({
						$viewportSize: { width: vw, height: vh },
						$composer,
					}) => {
						if (!$composer || !some(vw) || !some(vh)) return;

						$composer.setSize(
							vw * parkQuality,
							vh * parkQuality,
							false,
						);
					},
				);

				result: _._ = subscribe({ composer }, ({ $composer }) => {
					if (!$composer) return;

					set({ composer: $composer, renderTarget });
					return () => { set(undefined); };
				});

				return _;
			};
			const park = new Signal(
				/** @type {ParkContext | undefined} */ (undefined),
				(context) =>
					parkEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						return startPark(context);
					}),
			);

			/**
			 * @typedef {{
			 * 	composer: EffectComposer;
			 * 	renderTarget: WebGLRenderTarget;
			 * }} OverlayContext
			 */
			/** @type {Starter<Signal<OverlayContext | undefined>>} */
			const startOverlay = ({ set }) => {
				const _ = bin();

				const lottieTexture = derive(
					{ overlayEnabled, viewportSize, lottieDataAsset },
					({
						$overlayEnabled,
						$viewportSize: { width: vw, height: vh },
						$lottieDataAsset,
					}) => {
						if (
							!$overlayEnabled ||
							!$lottieDataAsset ||
							!some(vw) ||
							!some(vh)
						)
							return;

						/** @type {typeof cast<Record<string, unknown>>} */ (
							cast
						)($lottieDataAsset);

						const it = new DotLottieTexture({
							data: $lottieDataAsset,
							layout: { fit: 'cover' },
						});
						it.resize(vw * overlayQuality, vh * overlayQuality);

						return it;
					},
				);
				_._ = lottieTexture.subscribe((it) => () => {
					it?.dispose();
				});
				_._ = subscribe(
					{ progress, lottieTexture },
					({ $progress, $lottieTexture }) => {
						if (!$lottieTexture) return;

						$lottieTexture.seek($progress);
					},
				);

				const renderTarget = createResizingRenderTarget();
				const passes = derive(
					{
						camera,
						viewportSize,
						spaceMonoFont,
						fluidDisplacement,
						lottieTexture,
					},
					({
						$camera,
						$spaceMonoFont,
						$fluidDisplacement,
						$lottieTexture,
					}) => {
						if (!$camera || !$lottieTexture) return;

						return [
							new EffectPass(
								$camera,
								new LayerEffect({
									map: $lottieTexture,
								}),
								(() => {
									const it = new NoiseEffect({
										blendFunction:
											BlendFunction.COLOR_DODGE,
										static: true,
									});
									it.blendMode.opacity.value = 0.2;

									return it;
								})(),
							),
							...($fluidDisplacement ?
								[
									new FluidDisplacementDelegatePass(
										$fluidDisplacement.pass,
									),
								]
							:	[]),
							new EffectPass(
								$camera,
								...($spaceMonoFont ?
									[
										new AsciiEffect({
											fontFamily: $spaceMonoFont.family,
											fontSize: 16 * devicePixelRatio,
										}),
									]
								:	[]),
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
					{ viewportSize, composer },
					({
						$viewportSize: { width: vw, height: vh },
						$composer,
					}) => {
						if (!$composer || !some(vw) || !some(vh)) return;

						$composer.setSize(vw, vh, false);
					},
				);

				result: _._ = subscribe({ composer }, ({ $composer }) => {
					if (!$composer) return;

					set({ composer: $composer, renderTarget });
					return () => { set(undefined); };
				});

				return _;
			};
			const overlay = new Signal(
				/** @type {OverlayContext | undefined} */ (undefined),
				(context) =>
					overlayEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						return startOverlay(context);
					}),
			);

			/**
			 * @typedef {{
			 * 	scene: Scene;
			 * 	cameraRig: Group;
			 * 	camera: PerspectiveCamera;
			 * 	composer: EffectComposer;
			 * 	renderTarget: WebGLRenderTarget;
			 * }} AuxContext
			 */
			/** @type {Starter<Signal<AuxContext | undefined>>} */
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
					scene.add(it);

					return it;
				})();
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
					cameraRig.add(it);

					return it;
				})();

				environment: void (async () => {
					const asset = await photoStudio011kAsset;
					if (!asset || signal.aborted) return;
					asset.mapping = EquirectangularReflectionMapping;

					_._ = subscribe({ renderer }, ({ $renderer }) => {
						const pmremGenerator = new PMREMGenerator($renderer);
						pmremGenerator.compileEquirectangularShader();

						const hdriRenderTarget =
							pmremGenerator.fromEquirectangular(asset);

						return render.subscribe(() => {
							const { texture: hdriTexture } = hdriRenderTarget;
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
									return pointers.subscribe(([pointer]) => {
										set(pointer);
										trigger();
									});
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

				models: for (const [name, modelAsset] of /** @type {const} */ ([
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
												({ model }) => model === name,
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
						materials: _._ = subscribe({ park }, ({ $park }) => {
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

								modelOriginalMaterials.set(it, it.material);
								const material = new MeshTransmissionMaterial({
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
								material.normalMap = it.material.normalMap;
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
						});

						const value = attach(`aux/${name}`, {
							...new ThreeTransformTheatreSchema(),
						});
						_._ = value.subscribe((it) => {
							if (!it) return;

							const { writeMesh } = ThreeTransformTheatreSchema;
							writeMesh(it, model);
						});
					})();

				const renderTarget = createResizingRenderTarget();
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
									blendFunction: BlendFunction.COLOR_DODGE,
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
					{ viewportSize, composer },
					({
						$viewportSize: { width: vw, height: vh },
						$composer,
					}) => {
						if (!$composer || !some(vw) || !some(vh)) return;

						$composer.setSize(
							vw * auxQuality,
							vh * auxQuality,
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
				/** @type {AuxContext | undefined} */ (undefined),
				(context) =>
					auxEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						return startAux(context);
					}),
			);

			/** @typedef {{ composer: EffectComposer }} CompositeContext */
			/** @type {Starter<Signal<CompositeContext | undefined>>} */
			const startComposite = ({ set }) => {
				const _ = bin();

				const passes = derive(
					{ camera, park, overlay, aux },
					({ $camera, $park, $overlay, $aux }) => {
						if (!$camera) return;

						const pass = new EffectPass(
							$camera,
							...($park ?
								[
									new LayerEffect({
										map: $park.renderTarget.texture,
									}),
								]
							:	[]),
							...($overlay ?
								[
									new LayerEffect({
										map: $overlay.renderTarget.texture,
									}),
								]
							:	[]),
							...($aux ?
								[
									new LayerEffect({
										map: $aux.renderTarget.texture,
									}),
								]
							:	[]),
						);
						/** @type {typeof cast<EffectMaterial>} */ (cast)(
							pass.fullscreenMaterial,
						);
						pass.fullscreenMaterial.encodeOutput = false;

						return [pass];
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

						const it = new EffectComposer($renderer);
						for (const pass of $passes) it.addPass(pass);

						return it;
					},
				);
				_._ = composer.subscribe((it) => () => { it?.dispose(); });
				_._ = subscribe(
					{ viewportSize, composer },
					({
						$viewportSize: { width: vw, height: vh },
						$composer,
					}) => {
						if (!$composer || !some(vw) || !some(vh)) return;

						$composer.setSize(
							vw * compositeQuality,
							vh * compositeQuality,
							false,
						);
					},
				);

				result: _._ = subscribe({ composer }, ({ $composer }) => {
					if (!$composer) return;

					set({ composer: $composer });
					return () => { set(undefined); };
				});

				return _;
			};
			const composite = new Signal(
				/** @type {CompositeContext | undefined} */ (undefined),
				(context) =>
					compositeEnabled.subscribe(($enabled) => {
						if (!$enabled) return;

						return startComposite(context);
					}),
			);

			render: {
				_._ = subscribe(
					{ render, park, overlay, aux, composite },
					({ $render, $park, $overlay, $aux, $composite }) => {
						if (!$render) return;

						const { deltaTime } = $render;
						$park?.composer.render(deltaTime);
						$overlay?.composer.render(deltaTime);
						$aux?.composer.render(deltaTime);
						$composite?.composer.render(deltaTime);
					},
				);
			}

			return _;
		};

		return subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				orchestratorChapter: getContext(OrchestratorChapterBehavior),
				theatreSheet: getContext(TheatreSheetBehavior),
			},
			({ $orchestrator, $orchestratorChapter, $theatreSheet }) => {
				if (!$orchestrator || !$orchestratorChapter || !$theatreSheet)
					return;

				return attach(
					$orchestrator,
					$orchestratorChapter,
					$theatreSheet,
				);
			},
		);
	},
);
