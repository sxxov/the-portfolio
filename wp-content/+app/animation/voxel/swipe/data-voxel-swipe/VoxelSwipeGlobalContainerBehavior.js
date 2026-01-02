import { behavior, t } from '/+std/behavioral/behavior.js';
import { setStyles } from '/+std/dom/setStyles.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';

export const VoxelSwipeGlobalContainerBehavior = behavior(
	'voxel-swipe-global-container',
	class {
		parent = new Signal(/** @type {HTMLElement | undefined} */ (undefined));
		visible = t.boolean.transient.attributing.default(false);
	},
	(element, { parent }, {}) => {
		const _ = bin();

		_._ = subscribe({ parent }, ({ $parent }) => {
			if (!$parent) return;

			$parent.append(element);

			// reset animations
			const { animation: inlineAnimation } = element.style;
			setStyles(element, { animation: 'none' });
			void element.offsetHeight;
			setStyles(element, { animation: inlineAnimation });
		});

		return _;
	},
);
