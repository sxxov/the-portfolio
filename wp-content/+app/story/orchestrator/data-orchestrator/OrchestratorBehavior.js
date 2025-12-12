import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import state from './state.json' with { type: 'json' };
import { TheatreProjectBehavior } from '/+app/theatre/data-theatre-project/TheatreProjectBehavior.js';
import {
	attachBehavior,
	behavior,
	getAttachedBehavior,
} from '/+std/behavioral/behavior.js';
import { watchElementSize } from '/+std/dom/watchElementSize.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
import { OrchestratorCanvasBehavior } from '../data-orchestrator-canvas/OrchestratorCanvasBehavior.js';
import { OrchestratorChapterBehavior } from '../data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { OrchestratorStanzaBehavior } from '../data-orchestrator-stanza/OrchestratorStanzaBehavior.js';
/** @import { ChapterContainer } from "../../chapter/ChapterContainer.js" */
/** @import { Size } from "/+std/unit/Size.js" */
/** @import { OrchestratorRenderContext } from "./OrchestratorRenderContext.js" */
/** @import { BehaviorInstance } from "/+std/behavioral/factory/BehaviorInstance.js" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Rect } from "/+std/unit/Rect.js" */

export const OrchestratorBehavior = behavior(
	'orchestrator',
	class {
		container = new Signal(
			/** @type {HTMLElement | undefined} */ (undefined),
		);
		viewportSize = viewportSize;
		containerSize = new Signal(
			/** @type {Size<number | undefined>} */ ({
				width: undefined,
				height: undefined,
			}),
			({ update, trigger }) =>
				subscribe({ container: this.container }, ({ $container }) => {
					if (!$container) return;

					const elementSize = watchElementSize($container);
					return subscribe({ elementSize }, ({ $elementSize }) => {
						const { width, height } = $elementSize;
						update((it) => {
							if (it.width === width && it.height === height)
								return it;
							it.width = width;
							it.height = height;
							trigger();
							return it;
						});
					});
				}),
		);
		canvas = new Signal(
			/** @type {HTMLCanvasElement | undefined} */ (undefined),
		);
		renderer = this.canvas.derive(
			(it) =>
				new WebGLRenderer({
					canvas: it,
					powerPreference: 'high-performance',
					antialias: false,
					stencil: false,
					depth: false,
				}),
			({ subscribe: sub }) =>
				sub((it) =>
					subscribe(
						{ viewportSize: this.viewportSize },
						({ $viewportSize: { width, height } }) => {
							it.setSize(width || 1, height || 1);
							it.setPixelRatio(window.devicePixelRatio);
						},
					),
				),
		);
		scene = new Scene();
		scroll = new Signal(0);
		chapter = new Signal(
			/** @type {ChapterContainer | undefined} */ (undefined),
		);
		camera = this.chapter.derive(
			(it) => it?.camera,
			({ update, subscribe: sub }) =>
				sub(() =>
					subscribe(
						{ viewportSize },
						({ $viewportSize: { width: vw, height: vh } }) => {
							update((it) => {
								if (!it || !(it instanceof PerspectiveCamera))
									return;

								it.aspect = (vw || 1) / (vh || 1);
								it.updateProjectionMatrix();
								return it;
							});
						},
					),
				),
		);
		chapterContainerContexts = new Signal(
			new /**
			 * @type {typeof Map<
			 * 	ChapterContainer,
			 * 	{
			 * 		rect: ReadableSignal<Rect<number> | Rect<undefined>>;
			 * 		progress: ReadableSignal<number>;
			 * 	}
			 * >}
			 */ (Map)(),
		);

		render = new Signal(
			/** @type {OrchestratorRenderContext | undefined} */ (undefined),
			({ update, trigger }) =>
				subscribe(
					{
						renderer: this.renderer,
						chapter: this.chapter,
						camera: this.camera,
					},
					({ $renderer, $chapter, $camera }) => {
						if (!$chapter || !$camera) return;

						$renderer.setAnimationLoop((time) => {
							update((it) => {
								if (!it)
									return {
										time,
										deltaTime: 0,
										renderer: $renderer,
										scene: this.scene,
										camera: $camera,
										chapter: $chapter,
										context: this,
									};

								it.deltaTime = time - it.time;
								it.time = time;
								it.renderer = $renderer;
								it.camera = $camera;
								it.chapter = $chapter;
								trigger();
								return it;
							});
						});
						return () => {
							$renderer.setAnimationLoop(null);
						};
					},
				),
		);
	},
	(
		element,
		{ container, chapter, chapterContainerContexts, scene, scroll },
		{ registerLocalBehaviors },
	) => {
		registerLocalBehaviors(
			OrchestratorCanvasBehavior,
			OrchestratorChapterBehavior,
			OrchestratorStanzaBehavior,
		);

		const _ = bin();

		container: {
			add: {
				container.set(element);
			}
			remove: _._ = () => {
				container.set(undefined);
			};
		}

		scroll: {
			_._ = subscribe(
				{ chapterContainerContexts },
				({ $chapterContainerContexts }) => {
					const _ = bin();

					const key = new Signal({});
					const progresses = [
						...$chapterContainerContexts
							.values()
							.map(({ progress }) => progress),
					];
					for (const progress of progresses)
						_._ = progress.subscribe(() => { key.set({}); });
					_._ = key.subscribe(() => {
						scroll.set(
							progresses.reduce((prev, progress) => {
								const $progress = progress.get();
								return prev + $progress;
							}, 0),
						);
					});

					return _;
				},
			);
		}

		theatre: {
			_._ = attachBehavior(element, TheatreProjectBehavior, {
				'': OrchestratorBehavior.name,
			});
			const project = getAttachedBehavior(
				element,
				TheatreProjectBehavior,
			);
			_._ = project.subscribe((it) => { it?.state.set(state); });
		}

		chapter: {
			_._ = subscribe({ chapter }, ({ $chapter }) => {
				if (!$chapter) return;

				const _ = bin();
				add: {
					scene.add($chapter.group);
				}
				remove: _._ = () => {
					scene.remove($chapter.group);
				};
				return _;
			});
		}

		return _;
	},
);
