import { SparkRenderer, SplatFileType, SplatMesh } from '@sparkjsdev/spark';
import {
	BlendFunction,
	BloomEffect,
	ClearPass,
	CopyPass,
	EffectComposer,
	EffectPass,
	LUT3DEffect,
	Pass,
	ShaderPass,
	TextureEffect,
	ToneMappingEffect,
} from 'postprocessing';
import {
	Color,
	HalfFloatType,
	Material,
	Mesh,
	RenderTarget,
	WebGLRenderTarget,
} from 'three';
import { LinearGradientSkybox } from '/+app/environment/linear-gradient/LinearGradientSkybox.js';
import { FluidDisplacementPass } from '/+app/postprocessing/passes/fluid/FluidDisplacementPass.js';
import { PeelingRenderPass } from '/+app/postprocessing/passes/peeling/PeelingRenderPass.js';
import cameraGlb from './models/camera.glb.js';
import lutDjangoCube from './models/lut-django.cube.js';
import sceneSog from './models/scene.sog.js';
import soul0Glb from './models/soul-0.glb.js';
import soul1Glb from './models/soul-1.glb.js';
import soul2Glb from './models/soul-2.glb.js';
import soul3Glb from './models/soul-3.glb.js';
import soul4Glb from './models/soul-4.glb.js';
import { ParkChapterContainer } from './ParkChapterContainer.js';
import { SoulMaterial } from './shaders/SoulMaterial.js';
import { HoverOrbitControls } from '/+app/animation/hover-orbit/HoverOrbitControls.js';
import { HoverOrbitTheatreSchema } from '/+app/animation/hover-orbit/HoverOrbitTheatreSchema.js';
import { requestAsset } from '/+app/delivery/asset/asset.js';
import { pipeChunksIntoUint8Array } from '/+app/delivery/pipes/pipeChunksIntoUint8Array.js';
import { trackProgressPromise } from '/+app/delivery/progress/progress.js';
import { CameraAnimation } from '/+app/model/CameraAnimation.js';
import { requestGltf } from '/+app/model/gltf.js';
import { requestLutCube } from '/+app/model/lutCube.js';
import { DitheringEffect } from '/+app/postprocessing/effects/dithering/DitheringEffect.js';
import { OrchestratorChapterBehavior } from '/+app/story/orchestrator/data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { ThreeTransformTheatreSchema } from '../../../theatre/schemas/three/ThreeTransformTheatreSchema.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { AsciiEffect } from '/+app/postprocessing/effects/ascii/AsciiEffect.js';
import { unwrap } from '/+std/type/utilities/unwrap.js';
import { DotLottieTexture } from '/+app/texture/lottie/DotLottieTexture.js';
import dataJson from './lottie/data.json.js';
import { pipeChunksIntoJson } from '/+app/delivery/pipes/pipeChunksIntoJson.js';
import { cast } from '/+std/type/utilities/cast.js';
import { some } from '/+std/functional/some.js';
import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
import { degToRad } from '/+std/math/degToRad.js';
import { FluidDisplacementDelegatePass } from '/+app/postprocessing/passes/fluid/FluidDisplacementDelegatePass.js';
import { NoiseEffect } from '/+app/postprocessing/effects/noise/NoiseEffect.js';
/** @import { Object3D, WebGLRenderer } from "three" */
/** @import { EffectMaterial } from "postprocessing" */
/** @import { Size } from "/+std/unit/Size.js" */
/** @import { ArrayOfLength } from "/+std/type/array/ArrayOfLength.js" */

const { asset: sceneAsset } = requestAsset(sceneSog, pipeChunksIntoUint8Array);
const { asset: cameraAsset } = requestGltf(cameraGlb);
const { asset: soul0Asset } = requestGltf(soul0Glb);
const { asset: soul1Asset } = requestGltf(soul1Glb);
const { asset: soul2Asset } = requestGltf(soul2Glb);
const { asset: soul3Asset } = requestGltf(soul3Glb);
const { asset: soul4Asset } = requestGltf(soul4Glb);
const { asset: lutDjangoAsset } = requestLutCube(lutDjangoCube);
const { asset: lottieDataAsset } = requestAsset(dataJson, pipeChunksIntoJson);

const asciiCharSet = AsciiEffect.defaultCharSet;
const spaceMonoFont = new PromiseSignal(
	/** @type {FontFace | undefined} */ (undefined),
	async ({ resolve }) => {
		resolve(
			(await document.fonts.load('1rem Space Mono', asciiCharSet))[0],
		);
	},
);

export const ParkChapterBehavior = behavior(
	'park-chapter',
	class {},
	(element, {}, { getContext }) => {
		void cameraAsset.then();
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
					canvas,
					render,
					renderer,
					scene,
					camera,
					viewportSize,
				} = $orchestrator;
				const { progress } = $orchestratorChapter;

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
						{ camera, canvas },
						({ $camera, $canvas }) => {
							if (!$camera || !$canvas) return;

							return new HoverOrbitControls($camera, $canvas);
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
					_._ = () => {
						controller.abort();
					};
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

				const fluidDisplacementPass = new FluidDisplacementPass();
				const fluidDisplacementDelegatePass =
					new FluidDisplacementDelegatePass(fluidDisplacementPass);

				const [parkRenderTarget, overlayRenderTarget] =
					/** @type {ArrayOfLength<2, WebGLRenderTarget[]>} */ (
						Array.from({ length: 2 }, () =>
							(() => {
								const it = new WebGLRenderTarget(1, 1, {
									depthBuffer: false,
									stencilBuffer: false,
								});
								_._ = () => { it.dispose(); };
								_._ = subscribe(
									{ viewportSize },
									({ $viewportSize: { width, height } }) => {
										it.setSize(width, height);
									},
								);
								return it;
							})(),
						)
					);

				const parkComposer = (() => {
					const quality = 0.5;
					const passes = derive(
						{ camera, lutDjangoAsset },
						({ $camera, $lutDjangoAsset }) => {
							if (!$camera) return;

							return [
								new PeelingRenderPass(scene, $camera),
								fluidDisplacementPass,
								(() => {
									const it = new EffectPass(
										$camera,
										...[
											new BloomEffect({
												blendFunction:
													BlendFunction.SCREEN,
												mipmapBlur: true,
												luminanceThreshold: 0.4,
												luminanceSmoothing: 0.8,
												intensity: 4.0,
												resolutionScale: 0.25,
											}),
											...($lutDjangoAsset ?
												[
													new LUT3DEffect(
														$lutDjangoAsset.texture3D,
													),
												]
											:	[]),
											new ToneMappingEffect(),
											(() => {
												const it = new NoiseEffect({
													blendFunction:
														BlendFunction.SCREEN,
													premultiply: true,
												});
												it.blendMode.opacity.value = 0.5;

												return it;
											})(),
											new DitheringEffect(),
										],
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
							];
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
						({ $viewportSize: { width, height }, $composer }) => {
							if (!$composer) return;

							$composer.setSize(
								width * quality,
								height * quality,
								false,
							);
						},
					);
					return composer;
				})();

				const overlayComposer = (() => {
					const quality = 0.5;
					const texture = derive(
						{ viewportSize, lottieDataAsset },
						({
							$viewportSize: { width, height },
							$lottieDataAsset,
						}) => {
							if (!$lottieDataAsset) return;

							/** @type {typeof cast<Record<string, unknown>>} */ (
								cast
							)($lottieDataAsset);

							const it = new DotLottieTexture({
								data: $lottieDataAsset,
								layout: { fit: 'cover' },
							});
							it.resize(width * quality, height * quality);

							return it;
						},
					);
					_._ = texture.subscribe((it) => () => { it?.dispose(); });
					_._ = subscribe(
						{ progress, texture },
						({ $progress, $texture }) => {
							if (!$texture) return;

							$texture.seek($progress);
						},
					);
					const passes = derive(
						{ camera, viewportSize, texture, spaceMonoFont },
						({ $camera, $texture, $spaceMonoFont }) => {
							if (!$camera || !$texture) return;

							return [
								new EffectPass(
									$camera,
									new TextureEffect({
										texture: $texture,
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
								fluidDisplacementDelegatePass,
								new EffectPass(
									$camera,
									...($spaceMonoFont ?
										[
											new AsciiEffect({
												fontFamily:
													$spaceMonoFont.family,
												fontSize: 32,
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
						({ $viewportSize: { width, height }, $composer }) => {
							if (!$composer) return;

							$composer.setSize(width, height, false);
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
									new TextureEffect({
										texture: parkRenderTarget.texture,
									}),
									new TextureEffect({
										texture: overlayRenderTarget.texture,
										blendFunction: BlendFunction.SCREEN,
									}),
								);
								/** @type {EffectMaterial} */ (
									it.fullscreenMaterial
								).encodeOutput = false;
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
						({ $viewportSize: { width, height }, $composer }) => {
							if (!$composer) return;

							$composer.setSize(
								width * quality,
								height * quality,
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
							compositeComposer,
						},
						({
							$render,
							$parkComposer,
							$overlayComposer,
							$compositeComposer,
						}) => {
							if (!$render) return;

							const { deltaTime } = $render;
							$parkComposer?.render(deltaTime);
							$overlayComposer?.render(deltaTime);
							$compositeComposer?.render(deltaTime);
						},
					);
				}

				return _;
			},
		);
	},
);
