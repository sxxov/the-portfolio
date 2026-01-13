import {
	BlendFunction,
	CopyPass,
	EffectComposer,
	EffectPass,
} from 'postprocessing';
import { HalfFloatType, WebGLRenderTarget } from 'three';
import dataJson from '../../assets/lottie/data.json.js';
import { ParkChapterBehavior } from '../../ParkChapterBehavior.js';
import { requestAsset } from '/+app/delivery/asset/asset.js';
import { AssetPriority } from '/+app/delivery/asset/AssetPriority.js';
import { pipeChunksIntoJson } from '/+app/delivery/pipes/pipeChunksIntoJson.js';
import { hasMouse } from '/+app/human/hasMouse.js';
import { AsciiEffect } from '/+app/postprocessing/effects/ascii/AsciiEffect.js';
import { LayerEffect } from '/+app/postprocessing/effects/layer/LayerEffect.js';
import { FluidDisplacementDelegatePass } from '/+app/postprocessing/passes/fluid/FluidDisplacementDelegatePass.js';
import { OrchestratorChapterBehavior } from '/+app/story/orchestrator/data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { DotLottieTexture } from '/+app/texture/lottie/DotLottieTexture.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { cast } from '/+std/type/utilities/cast.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
import { NoiseEffect } from '/+app/postprocessing/effects/noise/NoiseEffect.js';
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { Starter } from "/+std/signal/Signal.js" */

const overlayQuality = new Signal(0.5).readonly;
const overlayEnabled = hasMouse;

const { asset: lottieDataAsset } = requestAsset(dataJson, pipeChunksIntoJson, {
	priority:
		overlayEnabled.get() ? AssetPriority.High : AssetPriority.Deferred,
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

export const ParkChapterOverlayLayerBehavior = behavior(
	'park-chapter-overlay-layer',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				orchestratorChapter: getContext(OrchestratorChapterBehavior),
				theatreSheet: getContext(TheatreSheetBehavior),
				parkChapter: getContext(ParkChapterBehavior),
			},
			({
				$orchestrator,
				$orchestratorChapter,
				$theatreSheet,
				$parkChapter,
			}) => {
				if (
					!$orchestrator ||
					!$orchestratorChapter ||
					!$theatreSheet ||
					!$parkChapter
				)
					return;

				const _ = bin();
				const { render, renderer, camera } = $orchestrator;
				const { progress } = $orchestratorChapter;
				const { layers } = $parkChapter;

				const fluidDisplacement = layers.derive(
					({ fluidDisplacement }) => fluidDisplacement,
				);

				/**
				 * @type {Starter<
				 * 	Signal<
				 * 		| import('./ParkChapterOverlayContext.js').ParkChapterOverlayContext
				 * 		| undefined
				 * 	>
				 * >}
				 */
				const startOverlay = ({ set }) => {
					const _ = bin();

					const lottieTexture = derive(
						{
							overlayEnabled,
							overlayQuality,
							viewportSize,
							lottieDataAsset,
						},
						({
							$overlayEnabled,
							$overlayQuality,
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
							it.resize(
								vw * $overlayQuality,
								vh * $overlayQuality,
							);

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
												fontFamily:
													$spaceMonoFont.family,
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
					/**
					 * @type {import('./ParkChapterOverlayContext.js').ParkChapterOverlayContext
					 * 	| undefined}
					 */ (undefined),
					(context) =>
						overlayEnabled.subscribe(($enabled) => {
							if (!$enabled) return;

							return startOverlay(context);
						}),
				);
				_._ = subscribe({ overlay }, ({ $overlay }) => {
					layers.update((layers) => ({
						...layers,
						overlay: $overlay,
					}));
				});

				_._ = subscribe(
					{ render, overlay },
					({ $render, $overlay }) => {
						if (!$render) return;

						const { deltaTime } = $render;
						$overlay?.composer.render(deltaTime);
					},
				);

				return _;
			},
		),
);
