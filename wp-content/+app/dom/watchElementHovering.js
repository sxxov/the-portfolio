import { Signal, bin } from '/+std/signal/Signal.js';

export function watchElementHovering(/** @type {HTMLElement} */ element) {
	return new Signal(false, ({ set }) => {
		const _ = bin();
		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		const update = () => { set(element.matches(':hover')); };
		element.addEventListener('pointerenter', update, { signal });
		element.addEventListener('pointerleave', update, { signal });
		element.addEventListener('pointercancel', update, { signal });
		update();

		return _;
	});
}
