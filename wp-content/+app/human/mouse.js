import { Signal } from '/+std/signal/Signal.js';
/** @import { Point } from "/+std/unit/Point.js" */

/** @extends {Signal<Point>} */
export class MouseSignal extends Signal {
	constructor(/** @type {HTMLElement | undefined} */ element) {
		super(
			/** @type {Point} */ ({
				x: (element?.offsetWidth ?? innerWidth) / 2,
				y: (element?.offsetHeight ?? innerHeight) / 2,
			}),
			({ set }) => {
				const controller = new AbortController();
				const { signal } = controller;

				const on =
					element?.addEventListener.bind(element) ??
					window.addEventListener.bind(window);

				on(
					'pointermove',
					(event) => {
						if (event.pointerType === 'touch') return;
						set({ x: event.offsetX, y: event.offsetY });
					},
					{ signal },
				);

				return () => { controller.abort(); };
			},
		);
	}
}

export const mouse = new MouseSignal(document.documentElement).readonly;
