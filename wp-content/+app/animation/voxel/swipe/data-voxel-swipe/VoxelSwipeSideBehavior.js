import { behavior, t } from '/+std/behavioral/behavior.js';

export const VoxelSwipeSideBehavior = behavior(
	'voxel-swipe-side',
	class {
		direction = t.number.choices(-1, 1).styling.default(1);
	},
);
