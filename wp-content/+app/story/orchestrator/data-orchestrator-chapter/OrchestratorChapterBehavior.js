import { OrchestratorBehavior } from '../data-orchestrator/OrchestratorBehavior.js';
import { watchElementView } from '/+app/dom/watchElementView.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { some } from '/+std/functional/some.js';
import { clamp01 } from '/+std/math/clamp01.js';
import { map } from '/+std/math/map.js';
import { map01 } from '/+std/math/map01.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { ChapterContainer } from "../../chapter/ChapterContainer.js" */
/** @import { View } from "/+app/dom/watchElementView.js" */
/** @import { Rect } from "/+std/unit/Rect.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */

export const OrchestratorChapterBehavior = behavior(
	'orchestrator-chapter',
	class {
		rect = new Signal(
			/** @type {Rect<number> | Rect<undefined>} */ ({
				x: undefined,
				y: undefined,
				width: undefined,
				height: undefined,
			}),
		);
		view = new Signal(/** @type {View | undefined} */ (undefined));
		chapterContainer = new Signal(
			/** @type {ChapterContainer | undefined} */ (undefined),
		);
		timeline = new Signal(
			/** @type {ReadableSignal<Ranged<0 | 1> | undefined>[]} */ ([]),
		);
		duration = t.number.transient.styling.default(0);
		progress = t.number.transient.styling.default(0);
	},
	(
		element,
		{ chapterContainer, duration, view, rect, progress, timeline },
		{ getContext },
	) =>
		subscribe(
			{ orchestrator: getContext(OrchestratorBehavior) },
			({ $orchestrator }) => {
				if (!$orchestrator) return;

				const _ = bin();
				const { chapterContainerContexts, chapter: selectedChapter } =
					$orchestrator;

				offset: {
					_._ = rect.subscribeStart(({ set }) =>
						watchElementRect(element).subscribe(set),
					);
				}
				view: {
					_._ = view.subscribeStart(({ set }) =>
						watchElementView(element).subscribe(set),
					);
				}

				progress: {
					_._ = subscribe(
						{ timeline, duration },
						({ $timeline, $duration }) => {
							if ($timeline.length <= 0)
								return view.subscribe(($view) => {
									if (!$view) return;

									const {
										y: {
											progress: { middle },
										},
									} = $view;
									if (!some(middle)) return;

									progress.set(middle);
								});

							const _ = bin();

							const key = new Signal({});
							for (const time of $timeline)
								_._ = time.subscribe(() => { key.set({}); });
							_._ = key.subscribe(() => {
								for (const p of $timeline) {
									const $p = p.get();
									if (!some($p)) continue;

									progress.set($p / $duration);
								}
							});

							return _;
						},
					);
				}

				seek: {
					_._ = subscribe(
						{ progress, chapterContainer },
						({ $progress, $chapterContainer }) => {
							if (!$chapterContainer) return;

							$chapterContainer.seek($progress);
						},
					);
				}

				selected: {
					_._ = subscribe(
						{ view, chapterContainer },
						({ $view, $chapterContainer }) => {
							if (!$view || !$chapterContainer) return;

							const {
								y: { visible },
							} = $view;
							if (!visible) return;

							selectedChapter.set($chapterContainer);
						},
					);
				}

				duration: {
					_._ = duration.subscribeStart(({ set }) =>
						chapterContainer.subscribe((it) => {
							set(it?.duration ?? 0);
						}),
					);
				}

				registration: {
					_._ = chapterContainer.subscribe(($chapter) => {
						if (!$chapter) return;

						const _ = bin();

						add: {
							chapterContainerContexts.update((it) => {
								it.set($chapter, { rect, progress });
								chapterContainerContexts.trigger();
								return it;
							});
						}
						remove: _._ = () => {
							chapterContainerContexts.update((it) => {
								it.delete($chapter);
								chapterContainerContexts.trigger();
								return it;
							});
						};

						return _;
					});
				}

				return _;
			},
		),
);
