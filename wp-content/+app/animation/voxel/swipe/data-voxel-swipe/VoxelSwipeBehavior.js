import { val } from '@theatre/core';
import { VoxelSwipeGlobalBehavior } from './VoxelSwipeGlobalBehavior.js';
import { gridColumnCount, gridRowCount } from './grid.js';
import { watchElementHovering } from '/+app/dom/watchElementHovering.js';
import {
	attachBehavior,
	behavior,
	getAttachedBehavior,
	t,
} from '/+std/behavioral/behavior.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { ISheet } from "@theatre/core" */
/** @import { BehaviorInstance } from "/+std/behavioral/factory/BehaviorInstance.js" */

const globalElement = new Signal(
	/** @type {HTMLElement | undefined} */ (undefined),
	({ set }) => {
		const _ = bin();

		const element = document.createElement('div');
		attachBehavior(element, VoxelSwipeGlobalBehavior, {});

		add: {
			set(element);
			document.body.append(element);
		}
		remove: _._ = () => {
			set(undefined);
			element.remove();
		};

		return _;
	},
);
const globalBehavior = new Signal(
	/** @type {BehaviorInstance<VoxelSwipeGlobalBehavior> | undefined} */ (
		undefined
	),
	({ set }) =>
		subscribe({ globalElement }, ({ $globalElement }) => {
			if (!$globalElement) return;

			return getAttachedBehavior(
				$globalElement,
				VoxelSwipeGlobalBehavior,
			).subscribe(set);
		}),
);

export const VoxelSwipeBehavior = behavior(
	'voxel-swipe',
	class {
		columnCount =
			t.number.transient.attributing.styling.default(gridColumnCount);
		rowCount = t.number.transient.attributing.styling.default(gridRowCount);
	},
	(element, {}, {}) =>
		subscribe({ globalBehavior }, ({ $globalBehavior }) => {
			if (!$globalBehavior) return;

			const _ = bin();

			const { target, direction, sheet } = $globalBehavior;

			const hovering = watchElementHovering(element);

			_._ = subscribe({ hovering, sheet }, ({ $hovering, $sheet }) => {
				if (!$hovering || !$sheet) return;

				const _ = bin();

				const { position } = $sheet.sequence;
				const length = val($sheet.sequence.pointer.length);

				add: {
					direction.set(position > length / 2 ? -1 : 1);
					target.set(element);
				}

				return _;
			});

			return _;
		}),
);
