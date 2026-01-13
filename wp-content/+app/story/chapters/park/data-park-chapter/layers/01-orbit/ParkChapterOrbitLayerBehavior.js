import { HoverOrbitControls } from '/+app/controls/hover-orbit/HoverOrbitControls.js';
import { HoverOrbitTheatreSchema } from '/+app/controls/hover-orbit/HoverOrbitTheatreSchema.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';

const orbitEnabled = new Signal(true).readonly;

export const ParkChapterOrbitLayerBehavior = behavior(
	'park-chapter-orbit-layer',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				theatreSheet: getContext(TheatreSheetBehavior),
			},
			({ $orchestrator, $theatreSheet }) => {
				if (!$orchestrator || !$theatreSheet) return;

				const _ = bin();

				const { render, camera, eventsContainer } = $orchestrator;
				const { attach } = $theatreSheet;

				_._ = orbitEnabled.subscribe(($enabled) => {
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

				return _;
			},
		),
);
