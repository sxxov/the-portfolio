import { OrchestratorChapterBehavior } from '../data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { OrchestratorBehavior } from '../data-orchestrator/OrchestratorBehavior.js';
import { watchElementView } from '/+app/dom/watchElementView.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { lerp } from '/+std/math/lerp.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { View } from "/+app/dom/watchElementView.js" */

export const OrchestratorStanzaBehavior = behavior(
	'orchestrator-stanza',
	class {
		start = t.number;
		end = t.number;
		view = new Signal(/** @type {View | undefined} */ (undefined));
		progress = t.number.transient.styling.default(0);
		time = derive(
			{
				progress: this.progress,
				start: this.start,
				end: this.end,
			},
			({ $progress, $start = 0, $end = 0 }) =>
				$progress > 0 && $progress < 1 ?
					lerp($progress, $start, $end)
				:	undefined,
		);
	},
	(element, { time, progress, view }, { getContext }) =>
		subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				orchestratorChapter: getContext(OrchestratorChapterBehavior),
			},
			({ $orchestrator, $orchestratorChapter }) => {
				if (!$orchestrator || !$orchestratorChapter) return;

				const { render } = $orchestrator;
				const { timeline } = $orchestratorChapter;

				const _ = bin();

				view: {
					_._ = view.subscribeStart(({ set }) =>
						watchElementView(element).subscribe(set),
					);
				}

				progress: {
					_._ = progress.subscribeStart(({ set }) =>
						subscribe({ view, render }, ({ $view }) => {
							if (!$view) return;

							set($view.y.progress.rightAligned ?? 0);
						}),
					);
				}

				add: {
					timeline.update((it) => {
						it.push(time);
						timeline.trigger();
						return it;
					});
				}
				remove: _._ = () => {
					timeline.update((it) => {
						it.splice(it.indexOf(time), 1);
						timeline.trigger();
						return it;
					});
				};

				return _;
			},
		),
);
