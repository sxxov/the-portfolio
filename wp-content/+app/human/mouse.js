import { viewportSize } from '/+std/viewport/viewportSize.js';
import { Signal } from '/+std/signal/Signal.js';
/** @import {Point} from '/+std/unit/Point.js' */

export const mouse = new Signal(
	/** @type {Point} */ ({
		x: viewportSize.get().width / 2,
		y: viewportSize.get().height / 2,
	}),
	({ set }) => {
		const controller = new AbortController();
		const { signal } = controller;

		document.addEventListener(
			'pointermove',
			(event) => {
				if (event.pointerType === 'touch') return;
				set({ x: event.clientX, y: event.clientY });
			},
			{ signal },
		);

		return () => {
			controller.abort();
		};
	},
).readonly;
