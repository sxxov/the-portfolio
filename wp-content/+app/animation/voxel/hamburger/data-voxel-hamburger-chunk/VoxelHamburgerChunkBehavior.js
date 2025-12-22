import { VoxelHamburgerBehavior } from '../data-voxel-hamburger/VoxelHamburgerBehavior.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin, subscribe } from '/+std/signal/Signal.js';

export const VoxelHamburgerChunkBehavior = behavior(
	'voxel-hamburger-chunk',
	class {},
	(element, {}, { getContext }) =>
		subscribe(
			{ voxelHamburger: getContext(VoxelHamburgerBehavior) },
			({ $voxelHamburger }) => {
				if (!$voxelHamburger) return;

				const { open } = $voxelHamburger;
				const _ = bin();

				_._ = subscribe({ open }, () => {
					const { animation: inlineAnimation } = element.style;

					element.style.animation = 'none';
					// force reflow
					void element.offsetHeight;
					element.style.animation = inlineAnimation;
				});

				return _;
			},
		),
);
