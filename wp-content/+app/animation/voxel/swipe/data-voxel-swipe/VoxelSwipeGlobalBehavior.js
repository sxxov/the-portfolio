import { gridGroupSizes } from './grid.js';
import state from './state.json' with { type: 'json' };
import { VoxelSwipeCellBehavior } from './VoxelSwipeCellBehavior.js';
import { VoxelSwipeGlobalContainerBehavior } from './VoxelSwipeGlobalContainerBehavior.js';
import { VoxelSwipeSideBehavior } from './VoxelSwipeSideBehavior.js';
import { AnBehavior } from '/+app/theatre/data-an/AnBehavior.js';
import { TheatreProjectBehavior } from '/+app/theatre/data-theatre-project/TheatreProjectBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import {
	attachBehavior,
	behavior,
	getAttachedBehavior,
	t,
} from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { entries } from '/+std/object/entries.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { ISheet } from "@theatre/core" */

const gridGroupSizeEntries = entries(gridGroupSizes);
export const VoxelSwipeGlobalBehavior = behavior(
	'voxel-swipe-global',
	class {
		target = new Signal(/** @type {HTMLElement | undefined} */ (undefined));
		sheet = new Signal(/** @type {ISheet | undefined} */ (undefined));
		direction = t.number.transient.attributing
			.choices(-1, 1)
			.styling.default(1);
		playing = t.boolean.transient.attributing
			.default(false)
			.in(this.target.derive(some)).readonly;
	},
	(element, { target, sheet, direction, playing }, {}) => {
		const _ = bin();

		const container = document.createElement('div');
		_._ = attachBehavior(container, VoxelSwipeGlobalContainerBehavior, {});
		const containerBehavior = getAttachedBehavior(
			container,
			VoxelSwipeGlobalContainerBehavior,
		);
		_._ = containerBehavior.subscribe(($behavior) => {
			if (!$behavior) return;

			return subscribe({ playing }, ({ $playing }) => {
				$behavior.visible.set($playing);
			});
		});
		add: { element.append(container); }
		remove: _._ = () => { container.remove(); };
		_._ = subscribe({ target }, ({ $target }) => {
			if (!$target) return;

			const _ = bin();

			add: {
				$target.append(container);
			}
			remove: _._ = () => {
				element.append(container);
			};

			return _;
		});

		_._ = attachBehavior(container, TheatreProjectBehavior, {
			'': VoxelSwipeGlobalBehavior.name,
		});
		const projectBehavior = getAttachedBehavior(
			container,
			TheatreProjectBehavior,
		);
		_._ = projectBehavior.subscribe(($behavior) => {
			if (!$behavior) return;

			$behavior.state.set(state);
		});

		_._ = attachBehavior(container, TheatreSheetBehavior, {
			'': 'grid',
		});
		const sheetBehavior = getAttachedBehavior(
			container,
			TheatreSheetBehavior,
		);
		_._ = sheet.subscribeStart(({ set }) =>
			sheetBehavior.subscribe(($behavior) => {
				if (!$behavior) return;

				return $behavior.sheet.subscribe(set);
			}),
		);

		const slot = document.createElement('slot');
		add: { container.append(slot); }
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

		_._ = subscribe({ target, sheet }, ({ $target, $sheet }) => {
			if (!$target || !$sheet) return;

			const _ = bin();

			_._ = subscribe({ direction }, ({ $direction }) => {
				void (async () => {
					const uninterrupted = await $sheet.sequence.play({
						direction: $direction > 0 ? 'normal' : 'reverse',
						rate: Math.abs($direction),
					});
					if (uninterrupted) {
						target.set(undefined);
						$sheet.sequence.position = 0;
					}
				})();

				return () => { $sheet.sequence.pause(); };
			});
			_._ = () => {
				$sheet.sequence.pause();
			};

			return _;
		});

		return _;
	},
);
