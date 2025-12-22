import { VoxelHamburgerChunkBehavior } from '../data-voxel-hamburger-chunk/VoxelHamburgerChunkBehavior.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { queueTask } from '/+std/dom/queueTask.js';
import { bin, subscribe } from '/+std/signal/Signal.js';

export const VoxelHamburgerBehavior = behavior(
	'voxel-hamburger',
	class {
		open = t.boolean;
	},
	(element, { open }, { registerLocalBehaviors }) => {
		registerLocalBehaviors(VoxelHamburgerChunkBehavior);

		const _ = bin();

		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		element.addEventListener(
			'click',
			() => {
				open.update((it) => !it);
			},
			{ signal },
		);

		_._ = subscribe({ open }, ({ $open }) => {
			if (!$open) return;

			const _ = bin();

			const controller = new AbortController();
			_._ = () => { controller.abort(); };
			const { signal } = controller;

			_._ = queueTask(() => {
				addEventListener(
					'click',
					() => {
						open.set(false);
					},
					{ signal },
				);
			});

			return _;
		});

		return _;
	},
);
