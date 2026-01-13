import { ParkChapterBehavior } from '../../ParkChapterBehavior.js';
import { hasMouse } from '/+app/human/hasMouse.js';
import { PointersSignal } from '/+app/human/pointers.js';
import { FluidDisplacementPass } from '/+app/postprocessing/passes/fluid/FluidDisplacementPass.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { Starter } from "/+std/signal/Signal.js" */
/** @import { ParkChapterFluidDisplacementContext } from "./ParkChapterFluidDisplacementContext.js" */

const fluidDisplacementEnabled = hasMouse;

export const ParkChapterFluidDisplacementLayerBehavior = behavior(
	'park-chapter-fluid-displacement-layer',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				parkChapter: getContext(ParkChapterBehavior),
			},
			({ $orchestrator, $parkChapter }) => {
				if (!$orchestrator || !$parkChapter) return;

				const _ = bin();
				const { eventsContainer } = $orchestrator;
				const { layers } = $parkChapter;

				/**
				 * @type {Starter<
				 * 	Signal<ParkChapterFluidDisplacementContext | undefined>
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
					/**
					 * @type {ParkChapterFluidDisplacementContext
					 * 	| undefined}
					 */ (undefined),
					(context) =>
						fluidDisplacementEnabled.subscribe(($enabled) => {
							if (!$enabled) return;

							return startFluidDisplacement(context);
						}),
				);
				_._ = subscribe(
					{ fluidDisplacement },
					({ $fluidDisplacement }) => {
						layers.update((layers) => ({
							...layers,
							fluidDisplacement: $fluidDisplacement,
						}));
					},
				);

				return _;
			},
		),
);
