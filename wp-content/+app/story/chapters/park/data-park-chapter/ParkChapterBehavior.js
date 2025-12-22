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
/** @import { Object3D } from "three" */
/** @import { EffectMaterial, Pass } from "postprocessing" */
/** @import { ArrayOfLength } from "/+std/type/array/ArrayOfLength.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */

RectAreaLightUniformsLib.init();

const { asset: cameraAsset } = requestGltf(cameraGlb);
void cameraAsset.then();

const { asset: sceneAsset } = requestAsset(sceneSog, pipeChunksIntoUint8Array);
void sceneAsset.then();

const { asset: djangoAsset } = requestLutCube(djangoCube);

const { asset: photoStudio011kAsset } = requestExr(photoStudio011kExr);
void photoStudio011kAsset.then();

const { asset: lottieDataAsset } = requestAsset(dataJson, pipeChunksIntoJson);

const { asset: headAsset } = requestGltf(headGlb);
const { asset: computerAsset } = requestGltf(computerGlb);
const { asset: phoneAsset } = requestGltf(phoneGlb);
const { asset: thinkingAsset } = requestGltf(thinkingGlb);
const { asset: easelAsset } = requestGltf(easelGlb);

const { asset: soul0Asset } = requestGltf(soul0Glb);
const { asset: soul1Asset } = requestGltf(soul1Glb);
const { asset: soul2Asset } = requestGltf(soul2Glb);
const { asset: soul3Asset } = requestGltf(soul3Glb);
const { asset: soul4Asset } = requestGltf(soul4Glb);

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
		const subscribeGroup = (/** @type {Object3D} */ object) => {
			return subscribe({ group }, ({ $group }) => {
				if (!$group) return;

				$group.add(object);
				return () => {
					$group.remove(object);
				};
			});
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

				const [parkRenderTarget, overlayRenderTarget, auxRenderTarget] =
					/** @type {ArrayOfLength<3, WebGLRenderTarget[]>} */ (
						Array.from({ length: 3 }, () =>
							(() => {
								const it = new WebGLRenderTarget(1, 1, {
									depthBuffer: false,
									stencilBuffer: false,
								});
								_._ = () => { it.dispose(); };
								_._ = subscribe(
									{ viewportSize },
									({ $viewportSize: { width, height } }) => {
										if (!some(width) || !some(height))
											return;

										it.setSize(width, height);
									},
								);
								return it;
							})(),
						)
					);

				chapter: {
					$orchestratorChapter.chapterContainer.in(chapter);
				}

				theatre: {
					_._ = progress.subscribe(seek);
				}

				orbit: {
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
				}

				splat: void (async () => {
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
					_._ = subscribeGroup(mesh);

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
					_._ = subscribe({ splatRenderer }, ({ $splatRenderer }) => {
						scene.add($splatRenderer);
						return () => { $splatRenderer.remove(); };
					});

					const value = attach('splat', {
						...new ThreeTransformTheatreSchema(),
					});
					_._ = value.subscribe((it) => {
						if (!it) return;

						const { writeMesh } = ThreeTransformTheatreSchema;
						writeMesh(it, mesh);
					});
				})();

				souls: _._ = (() => {
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
							_._ = subscribeGroup(model);

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
				})();

				skybox: {
					const skybox = new LinearGradientSkybox(
						{ color: new Color(0x000000), at: 0.2 },
						{ color: new Color(0xfefefe), at: 0.3 },
						{ color: new Color(0x000000), at: 0.6 },
					);
					add: { scene.add(skybox); }
					remove: _._ = () => { scene.remove(skybox); };
				}

				const auxScene = new Scene();
				const auxCameraRig = (() => {
					const it = new Group();
					const value = attach('aux/camera', {
						...new ThreeTransformTheatreSchema(),
					});
					_._ = value.subscribe(($value) => {
						if (!$value) return;

						const { writeMesh } = ThreeTransformTheatreSchema;
						writeMesh($value, it);
					});
					auxScene.add(it);

					return it;
				})();
				const auxCamera = (() => {
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
					auxCameraRig.add(it);

					return it;
				})();

				auxEnvironment: void (async () => {
					const asset = await photoStudio011kAsset;
					if (!asset) return;
					asset.mapping = EquirectangularReflectionMapping;

					_._ = subscribe({ renderer }, ({ $renderer }) => {
						const pmremGenerator = new PMREMGenerator($renderer);
						pmremGenerator.compileEquirectangularShader();

						const hdriRenderTarget =
							pmremGenerator.fromEquirectangular(asset);

						return render.subscribe(() => {
							const { texture: hdriTexture } = hdriRenderTarget;
							auxScene.environment = hdriTexture;
						});
					});
				})();

				auxModels: _._ = (() => {
					const _ = bin();

					const controller = new AbortController();
					_._ = () => { controller.abort(); };
					const { signal } = controller;

					const followRig = new Group();
					auxScene.add(followRig);
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
									auxCamera,
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

					for (const light of [
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

					for (const [name, modelAsset] of /** @type {const} */ ([
						['phone', phoneAsset],
						['thinking', thinkingAsset],
						['easel', easelAsset],
						['computer', computerAsset],
						['head', headAsset],
					]))
						void (async () => {
							const gltf = await modelAsset;
							if (!gltf) return;

							if (signal.aborted) return;

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
										remove: _._ = () => { tween.pause(); };
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
										remove: _._ = () => { tween.pause(); };
									}
									return _;
								});
							}

							const { scene: model } = gltf;
							spawnRig.add(model);

							const modelOriginalMaterials = new Map();
							override: model.traverse((it) => {
								if (
									!(it instanceof Mesh) ||
									!(it.material instanceof Material)
								)
									return;
								/** @type {typeof cast<MeshPhysicalMaterial>} */ (
									cast
								)(it.material);

								// if (
								// 	it.material.transmission > 0 ||
								// 	it.material.transmissionMap
								// ) {
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
										parkRenderTarget.texture
									),
								});
								// material.emissive = it.material.color;
								// material.map = it.material.map;
								material.emissiveIntensity = 1;

								material.transparent = false;
								material.reflectivity = 0.2;
								material.roughness = 0.1;

								material.transmissionMap =
									it.material.transmissionMap;
								material.normalMap = it.material.normalMap;
								material.bumpMap = it.material.bumpMap;

								it.material = material;
								// }
							});
							revert: _._ = () => {
								for (const [
									model,
									material,
								] of modelOriginalMaterials)
									model.material = material;
								modelOriginalMaterials.clear();
							};

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

					return _;
				})();

				const fluidDisplacementPass = derive(
					{ hasMouse, eventsContainer },
					({ $hasMouse, $eventsContainer }) => {
						if (!$hasMouse || !$eventsContainer) return;

						return new FluidDisplacementPass(
							new PointersSignal($eventsContainer),
						);
					},
				);

				const parkComposer = (() => {
					const quality = 0.5;
					const passes = derive(
						{ camera, djangoAsset, fluidDisplacementPass },
						({ $camera, $djangoAsset, $fluidDisplacementPass }) => {
							if (!$camera) return;

							return /** @type {const} @satisfies {Pass[]} */ ([
								new PeelingRenderPass(scene, $camera),
								...($fluidDisplacementPass ?
									[$fluidDisplacementPass]
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
								new CopyPass(parkRenderTarget),
							]);
						},
					);
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
								vw * quality,
								vh * quality,
								false,
							);
						},
					);
					return composer;
				})();

				const overlayComposer = (() => {
					const quality = 0.5;
					const lottieTexture = derive(
						{ viewportSize, lottieDataAsset },
						({
							$viewportSize: { width: vw, height: vh },
							$lottieDataAsset,
						}) => {
							if (!$lottieDataAsset || !some(vw) || !some(vh))
								return;

							/** @type {typeof cast<Record<string, unknown>>} */ (
								cast
							)($lottieDataAsset);

							const it = new DotLottieTexture({
								data: $lottieDataAsset,
								layout: { fit: 'cover' },
							});
							it.resize(vw * quality, vh * quality);

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
					const passes = derive(
						{
							camera,
							fluidDisplacementPass,
							viewportSize,
							lottieTexture,
							spaceMonoFont,
						},
						({
							$camera,
							$fluidDisplacementPass,
							$lottieTexture,
							$spaceMonoFont,
						}) => {
							if (!$camera || !$lottieTexture) return;

							return [
								new EffectPass(
									$camera,
									new LayerEffect({ map: $lottieTexture }),
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
								...($fluidDisplacementPass ?
									[
										new FluidDisplacementDelegatePass(
											$fluidDisplacementPass,
										),
									]
								:	[]),
								new EffectPass(
									$camera,
									...($spaceMonoFont ?
										[
											new AsciiEffect({
												fontFamily:
													$spaceMonoFont.family,
												fontSize: 16 * devicePixelRatio,
											}),
										]
									:	[]),
								),
								new CopyPass(overlayRenderTarget),
							];
						},
					);
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
					return composer;
				})();

				const auxComposer = (() => {
					const quality = 0.5;
					const passes = derive(
						{
							hasMouse,
							camera,
							viewportSize,
							fluidDisplacementPass,
						},
						({ $hasMouse, $camera, $fluidDisplacementPass }) => {
							if (!$hasMouse || !$camera) return;

							return [
								(() => {
									const it = new RenderPass(
										auxScene,
										auxCamera,
									);
									it.clearPass.overrideClearAlpha = 0;

									return it;
								})(),
								...($fluidDisplacementPass ?
									[
										new FluidDisplacementDelegatePass(
											$fluidDisplacementPass,
										),
									]
								:	[]),
								new EffectPass(
									$camera,
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
								new CopyPass(auxRenderTarget),
							];
						},
					);
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
								vw * quality,
								vh * quality,
								false,
							);
						},
					);
					return composer;
				})();

				const compositeComposer = (() => {
					const quality = 1;
					const passes = derive({ camera }, ({ $camera }) => {
						if (!$camera) return;

						return [
							(() => {
								const it = new EffectPass(
									$camera,
									new LayerEffect({
										map: parkRenderTarget.texture,
									}),
									new LayerEffect({
										map: overlayRenderTarget.texture,
									}),
									new LayerEffect({
										map: auxRenderTarget.texture,
									}),
								);
								/** @type {typeof cast<EffectMaterial>} */ (
									cast
								)(it.fullscreenMaterial);
								it.fullscreenMaterial.encodeOutput = false;
								return it;
							})(),
						];
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
								vw * quality,
								vh * quality,
								false,
							);
						},
					);
					return composer;
				})();

				render: {
					_._ = subscribe(
						{
							render,
							parkComposer,
							overlayComposer,
							auxComposer,
							compositeComposer,
						},
						({
							$render,
							$parkComposer,
							$overlayComposer,
							$auxComposer,
							$compositeComposer,
						}) => {
							if (!$render) return;

							const { deltaTime } = $render;
							$parkComposer?.render(deltaTime);
							$overlayComposer?.render(deltaTime);
							$auxComposer?.render(deltaTime);
							$compositeComposer?.render(deltaTime);
						},
					);
				}

				return _;
			},
		);
	},
);
