import { behavior } from '/+std/behavioral/behavior.js';
import { subscribeSelectorAll } from '/+std/dom/subscribeSelectorAll.js';
import { watchElementIntersecting } from '/+std/dom/watchElementIntersecting.js';
import { noop } from '/+std/functional/noop.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */

export const LazyAutoplayProviderBehavior = behavior(
	'lazy-autoplay-provider',
	class {},
	(element) => {
		const _ = bin();

		const videos = new Signal(
			/** @type {HTMLVideoElement[]} */ ([]),
			({ update }) =>
				subscribeSelectorAll(
					[element, 'video[autoplay]'],
					(element) => {
						if (!(element instanceof HTMLVideoElement)) return;

						const _ = bin();

						add: {
							update((it) => [...it, element]);
						}
						remove: _._ = () => {
							update((it) => it.filter((v) => v !== element));
						};

						return _;
					},
				),
		);
		const videoIntersectingSignals = new Signal(
			new /**
			 * @type {typeof WeakMap<
			 * 	HTMLVideoElement,
			 * 	ReadableSignal<boolean | undefined>
			 * >}
			 */ (WeakMap)(),
			({ update, trigger }) =>
				subscribe({ videos }, ({ $videos }) => {
					update((it) => {
						let changed = false;
						for (const video of $videos) {
							if (it.has(video)) continue;

							const intersecting =
								watchElementIntersecting(video);
							it.set(video, intersecting);
							changed = true;
						}
						if (changed) trigger();

						return it;
					});
				}),
		);

		_._ = subscribe(
			{ videos, videoIntersectingSignals },
			({ $videos, $videoIntersectingSignals }) => {
				const _ = bin();

				for (const video of $videos) {
					const intersecting = $videoIntersectingSignals.get(video);
					if (!intersecting) continue;

					_._ = subscribe({ intersecting }, ({ $intersecting }) => {
						if ($intersecting) void video.play().catch(noop);
						else video.pause();
					});
				}

				return _;
			},
		);

		return _;
	},
);
