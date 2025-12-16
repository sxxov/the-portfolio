import { Group } from 'three';
import { behavior } from '/+std/behavioral/behavior.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { OrchestratorBehavior } from '../../orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { ParkWaypointBehavior } from '../data-park-waypoint/ParkWaypointBehavior.js';
/** @import { Rect } from "/+std/unit/Rect.js" */

export const ParkMapBehavior = behavior(
	'park-map',
	class {
		rect = new Signal(
			/** @type {Rect<number> | Rect<undefined>} */ ({
				x: undefined,
				y: undefined,
				width: undefined,
				height: undefined,
			}),
		);
		group = (() => {
			const it = new Group();
			it.name = 'waypoints';
			return it;
		})();
	},
	(element, { rect, group }, { getContext, registerLocalBehaviors }) => {
		registerLocalBehaviors(ParkWaypointBehavior);

		return subscribe(
			{ orchestrator: getContext(OrchestratorBehavior) },
			({ $orchestrator }) => {
				if (!$orchestrator) return;

				const { scene } = $orchestrator;

				const _ = bin();

				_._ = rect.subscribeStart(({ set }) =>
					watchElementRect(element).subscribe(set),
				);

				add: { scene.add(group); }
				remove: _._ = () => { scene.remove(group); };

				return _;
			},
		);
	},
);
