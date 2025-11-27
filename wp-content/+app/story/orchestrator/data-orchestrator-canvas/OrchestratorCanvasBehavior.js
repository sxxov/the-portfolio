import { OrchestratorBehavior } from '../data-orchestrator/OrchestratorBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin } from '/+std/signal/Signal.js';

export const OrchestratorCanvasBehavior = behavior(
	'orchestrator-canvas',
	class {},
	(element, {}, { getContext }) =>
		getContext(OrchestratorBehavior).subscribe((context) => {
			if (!(element instanceof HTMLCanvasElement)) return;
			if (!context) return;

			const _ = bin();
			const { canvas } = context;
			const previousCanvas = canvas.get();
			canvas.set(element);
			_._ = () => {
				if (canvas.get() === element) canvas.set(previousCanvas);
			};

			return _;
		}),
);
