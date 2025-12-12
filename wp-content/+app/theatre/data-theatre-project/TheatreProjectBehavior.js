import { getProject } from '@theatre/core';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { derive, Signal } from '/+std/signal/Signal.js';
import { TheatreSheetBehavior } from '../data-theatre-sheet/TheatreSheetBehavior.js';
/** @import { IProject } from "@theatre/core" */

export const TheatreProjectBehavior = behavior(
	'theatre-project',
	class {
		'' = t.string;
		state = new Signal(/** @type {unknown | undefined} */ (undefined));
		project = derive(
			{ name: this[''], state: this.state },
			({ $name, $state }) =>
				$name && $state ?
					getProject($name, { state: $state })
				:	undefined,
		).readonly;
	},
	(element, {}, { registerLocalBehaviors }) => {
		registerLocalBehaviors(TheatreSheetBehavior);
	},
);
