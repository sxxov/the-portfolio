import { getProject } from '@theatre/core';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { derive, Signal } from '/+std/signal/Signal.js';
/** @import { IProject } from "@theatre/core" */

export const TheatreProjectBehavior = behavior(
	'theatre-project',
	class {
		'' = t.string;
		state = new Signal(/** @type {unknown | undefined} */ (undefined));
		project = derive(
			{ name: this[''], state: this.state },
			({ $name, $state }) =>
				$name ?
					getProject($name, $state ? { state: $state } : undefined)
				:	undefined,
		).readonly;
	},
	() => {
		//
	},
);
