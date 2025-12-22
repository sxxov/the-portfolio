import { VoxelSwipeCellBehavior } from './VoxelSwipeCellBehavior.js';
import { VoxelSwipeSideBehavior } from './VoxelSwipeSideBehavior.js';
import { gridGroupSizes, gridColumnCount, gridRowCount } from './grid.js';
import { AnBehavior } from '/+app/theatre/data-an/AnBehavior.js';
import { TheatreProjectBehavior } from '/+app/theatre/data-theatre-project/TheatreProjectBehavior.js';
import {
	attachBehavior,
	behavior,
	getAttachedBehavior,
	t,
} from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { entries } from '/+std/object/entries.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import state from './state.json' with { type: 'json' };
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { watchElementHovering } from '/+app/dom/watchElementHovering.js';
import { val } from '@theatre/core';
import { setStyles } from '/+std/dom/setStyles.js';
import { getProject } from '@theatre/core';
/** @import { ISheet } from "@theatre/core" */

let incrementalId = 0;

const gridGroupSizeEntries = entries(gridGroupSizes);
export const VoxelSwipeBehavior = behavior(
	'voxel-swipe',
	class {
		columnCount =
			t.number.transient.attributing.styling.default(gridColumnCount);
		rowCount = t.number.transient.attributing.styling.default(gridRowCount);
	},
	(element, {}, {}) => {
		const _ = bin();
		const hovering = new Signal(false, ({ set }) => {
			const _ = bin();

			const selfHovering = watchElementHovering(element);
			const parentHovering =
				element.parentElement ?
					watchElementHovering(element.parentElement)
				:	new Signal(false);
			_._ = subscribe(
				{ selfHovering, parentHovering },
				({ $selfHovering, $parentHovering }) => {
					set($selfHovering || $parentHovering);
				},
			);

			return _;
		});

		_._ = attachBehavior(element, TheatreProjectBehavior, {
			'': VoxelSwipeBehavior.name,
		});
		const projectBehavior = getAttachedBehavior(
			element,
			TheatreProjectBehavior,
		);
		_._ = projectBehavior.subscribe(($behavior) => {
			if (!$behavior) return;

			$behavior.state.set(state);
		});

		_._ = attachBehavior(element, TheatreSheetBehavior, {
			'': `voxel-swipe`,
			discriminator: `${incrementalId++}`,
		});
		const sheetBehavior = getAttachedBehavior(
			element,
			TheatreSheetBehavior,
		);
		const sheet = new Signal(
			/** @type {ISheet | undefined} */ (undefined),
			({ set }) =>
				sheetBehavior.subscribe(($behavior) => {
					if (!$behavior) return;

					return $behavior.sheet.subscribe(set);
				}),
		);

		_._ = subscribe({ hovering, sheet }, ({ $hovering, $sheet }) => {
			if (!$hovering || !$sheet) return;

			void $sheet.sequence.play();
		});

		const slot = document.createElement('slot');
		add: { element.append(slot); }
		remove: _._ = () => { slot.remove(); };

		const sideElements = /** @type {const} */ ([-1, 1]).map((direction) => {
			const it = document.createElement('div');
			attachBehavior(it, VoxelSwipeSideBehavior, { direction });
			return it;
		});
		for (const sideElement of sideElements) {
			add: { slot.append(sideElement); }
			remove: _._ = () => { sideElement.remove(); };

			const cellElements = gridGroupSizeEntries
				.map(([group, { x, y, width, height }]) => {
					if (group <= 0) return;

					const it = document.createElement('div');

					attachBehavior(it, AnBehavior, {
						'': `cell/${x}/${y}`,
						clip: true,
					});
					attachBehavior(it, VoxelSwipeCellBehavior, {
						x,
						y,
						width,
						height,
					});

					return it;
				})
				.filter(some);

			for (const cellElement of cellElements) {
				add: { sideElement.append(cellElement); }
				remove: _._ = () => { sideElement.remove(); };
			}
		}

		return _;
	},
);
