import { EffectPass, EffectMaterial, EffectComposer } from 'postprocessing';
import { ParkChapterBehavior } from '../../ParkChapterBehavior.js';
import { LayerEffect } from '/+app/postprocessing/effects/layer/LayerEffect.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { cast } from '/+std/type/utilities/cast.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
/** @import { ParkChapterCompositeContext } from "./ParkChapterCompositeContext.js" */
/** @import { Starter } from "/+std/signal/Signal.js" */

const compositeQuality = new Signal(1).readonly;
const compositeEnabled = new Signal(true).readonly;

export const ParkChapterCompositeLayerBehavior = behavior(
	'park-chapter-composite-layer',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				parkChapter: getContext(ParkChapterBehavior),
			},
			({ $orchestrator, $parkChapter }) => {
				if (!$orchestrator || !$parkChapter) return;

				const { render, renderer, camera } = $orchestrator;
				const { layers } = $parkChapter;

				const park = layers.derive(({ park }) => park);
				const overlay = layers.derive(({ overlay }) => overlay);
				const aux = layers.derive(({ aux }) => aux);

				/**
				 * @type {Starter<
				 * 	Signal<ParkChapterCompositeContext | undefined>
				 * >}
				 */
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
						{ compositeQuality, viewportSize, composer },
						({
							$compositeQuality,
							$viewportSize: { width: vw, height: vh },
							$composer,
						}) => {
							if (!$composer || !some(vw) || !some(vh)) return;

							$composer.setSize(
								vw * $compositeQuality,
								vh * $compositeQuality,
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
					/** @type {ParkChapterCompositeContext | undefined} */ (
						undefined
					),
					(context) =>
						compositeEnabled.subscribe(($enabled) => {
							if (!$enabled) return;

							return startComposite(context);
						}),
				);

				return subscribe(
					{ render, composite }, //
					({ $render, $composite }) => {
						if (!$render) return;

						const { deltaTime } = $render;
						$composite?.composer.render(deltaTime);
					},
				);
			},
		),
);
