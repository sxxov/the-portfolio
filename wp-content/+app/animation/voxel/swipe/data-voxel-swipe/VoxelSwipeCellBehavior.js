import { behavior, t } from '/+std/behavioral/behavior.js';

export const VoxelSwipeCellBehavior = behavior(
	'voxel-swipe-cell',
	class {
		x = t.number.styling;
		y = t.number.styling;
		width = t.number.styling;
		height = t.number.styling;
	},
	(element, {}, {}) => {},
);
