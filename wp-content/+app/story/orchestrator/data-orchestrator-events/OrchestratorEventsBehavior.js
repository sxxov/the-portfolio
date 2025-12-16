import { OrchestratorBehavior } from '../data-orchestrator/OrchestratorBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin, subscribe } from '/+std/signal/Signal.js';

export const OrchestratorEventsBehavior = behavior(
	'orchestrator-events',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{ orchestrator: getContext(OrchestratorBehavior) },
			({ $orchestrator }) => {
				if (!$orchestrator) return;

				const { eventsContainer, canvas } = $orchestrator;
				const _ = bin();

				add: _._ = subscribe(
					{ eventsContainer, canvas },
					({ $eventsContainer, $canvas }) => {
						if ($eventsContainer && $eventsContainer !== $canvas)
							return;

						eventsContainer.set(element);
					},
				);
				remove: _._ = () => { eventsContainer.set(undefined); };

				return _;
			},
		),
);
