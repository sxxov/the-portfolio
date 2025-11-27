import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrchestratorChapterBehavior } from '../data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { behavior, getAttachedBehavior } from '/+std/behavioral/behavior.js';
import { watchElementSize } from '/+std/dom/watchElementSize.js';
import { some } from '/+std/functional/some.js';
import { scrollY } from '/+std/human/scroll.js';
import { clamp01 } from '/+std/math/clamp01.js';
import { map01 } from '/+std/math/map01.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
/** @import { Chapter } from "/+app/story/chapter/Chapter.js" */
/** @import { Size } from "/+std/unit/Size.js" */
/** @import { OrchestratorRenderContext } from "./OrchestratorRenderContext.js" */

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
		chapter = new Signal(/** @type {Chapter | undefined} */ (undefined));
		chapterProgress = derive(
			{ scrollY, viewportSize, chapter: this.chapter },
			({ $scrollY, $viewportSize: { height: vh }, $chapter }) => {
				if (!$chapter) return 0;

				const height = ($chapter.duration / 1000) * vh;
				const progress = clamp01(map01($scrollY, 0, height));

				return progress;
			},
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
		chapters = new Signal(
			new /** @type {typeof Map<HTMLElement, Chapter>} */ (Map)(),
		);
		sortedChapters = new Signal(/** @type {Chapter[]} */ ([]), ({ set }) =>
			subscribe({ chapters: this.chapters }, ({ $chapters }) => {
				const _ = bin();

				const entries = new Signal(
					/** @type {(readonly [number, Chapter])[]} */ ([]),
				);
				for (const [element, chapter] of $chapters) {
					const behavior = getAttachedBehavior(
						element,
						OrchestratorChapterBehavior,
					);
					_._ = subscribe({ behavior }, ({ $behavior }) => {
						if (!$behavior) return;

						const _ = bin();
						const { index } = $behavior;

						_._ = subscribe({ index }, ({ $index }) => {
							if (!some($index)) return;

							const _ = bin();
							const entry = /** @type {const} */ ([
								$index,
								chapter,
							]);

							add: {
								entries.update((it) => {
									it.push(entry);
									entries.trigger();
									return it;
								});
							}
							remove: _._ = () => {
								entries.update((it) => {
									it.splice(
										it.findIndex((it) => it === entry),
										1,
									);
									entries.trigger();
									return it;
								});
							};

							return _;
						});

						return _;
					});
				}

				const sortedChapters = derive({ entries }, ({ $entries }) =>
					$entries
						.toSorted(([a], [b]) => a - b)
						.map(([, chapter]) => chapter),
				);
				_._ = subscribe({ sortedChapters }, ({ $sortedChapters }) => {
					set($sortedChapters);
				});

				return _;
			}),
		).readonly;

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
		{ container, chapter, chapterProgress, scene, sortedChapters, scroll },
	) => {
		const _ = bin();

		container.set(element);
		_._ = () => {
			container.set(undefined);
		};

		scroll.in(
			derive(
				{ sortedChapters, scrollY, viewportSize },
				({
					$sortedChapters,
					$scrollY,
					$viewportSize: { height: vh },
				}) =>
					$sortedChapters.reduce(
						(context, { duration }) => {
							const { cursor } = context;
							const length = (duration / 1000) * vh;

							context.cursor += length;
							context.cum += clamp01(
								map01($scrollY, cursor, cursor + length),
							);
							return context;
						},
						{ cursor: 0, cum: 0 },
					).cum,
			),
		);
		chapter.in(
			derive(
				{ scroll, sortedChapters, viewportSize },
				({
					$scroll,
					$sortedChapters,
					$viewportSize: { height: vh },
				}) => {
					let cum = 0;
					const chapter = $sortedChapters.find(({ duration }) => {
						const start = cum;
						const length = (duration / 1000) * vh;
						const end = cum + length;
						cum += length;
						return $scroll >= start && $scroll < end;
					});

					return chapter;
				},
			),
		);

		_._ = subscribe({ chapter }, ({ $chapter }) => {
			if (!$chapter) return;

			scene.add($chapter.group);
			return () => {
				scene.remove($chapter.group);
			};
		});

		_._ = subscribe(
			{ chapterProgress, chapter },
			({ $chapterProgress, $chapter }) => {
				if (!$chapter) return;

				$chapter.seek($chapterProgress);
			},
		);

		return _;
	},
);
