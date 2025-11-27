import { OrchestratorBehavior } from '../data-orchestrator/OrchestratorBehavior.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { some } from '/+std/functional/some.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { Chapter } from "/+app/story/chapter/Chapter.js" */

export const OrchestratorChapterBehavior = behavior(
	'orchestrator-chapter',
	class {
		chapter = new Signal(/** @type {Chapter | undefined} */ (undefined));
		index = t.number.transient.styling;
		height = t.number.transient.styling
			.default(0)
			.serializer((v) => `${v}px`);
	},
	(element, { index, chapter }, { getContext }) =>
		getContext(OrchestratorBehavior).subscribe((context) => {
			if (!context) return;

			const _ = bin();
			const { container, chapters } = context;

			_._ = subscribe({ index, container }, ({ $index, $container }) => {
				if (!$container || some($index)) return;

				const indexOfSelf = [...$container.children].findIndex(
					(it) => it === element || it.contains(element),
				);
				if (indexOfSelf < 0) return;

				index.set(indexOfSelf);
				return () => {
					if (index.get() === indexOfSelf) index.set($index);
				};
			});

			_._ = subscribe({ chapter }, ({ $chapter }) => {
				if (!$chapter) return;

				const _ = bin();

				add: {
					chapters.update((it) => {
						it.set(element, $chapter);
						chapters.trigger();
						return it;
					});
				}
				remove: _._ = () => {
					chapters.update((it) => {
						it.delete(element);
						chapters.trigger();
						return it;
					});
				};

				return _;
			});

			return _;
		}),
);
