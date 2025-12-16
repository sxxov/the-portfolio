import { Signal } from '/+std/signal/Signal.js';

export function watchElementScroll(/** @type {HTMLElement} */ el) {
	return new Signal({ x: el.scrollLeft, y: el.scrollTop }, ({ set }) => {
		const controller = new AbortController();
		const { signal } = controller;

		el.addEventListener(
			'scroll',
			() => {
				set({ x: el.scrollLeft, y: el.scrollTop });
			},
			{ signal },
		);

		return () => { controller.abort(); };
	});
}
