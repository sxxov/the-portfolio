import { Signal } from '/+std/signal/Signal.js';

/** @extends {Signal<boolean>} */
export class HasMouseSignal extends Signal {
	constructor() {
		const query = matchMedia('(pointer: fine)');
		super(query.matches, ({ set }) => {
			const controller = new AbortController();
			const { signal } = controller;

			const update = () => { set(query.matches); };
			query.addEventListener('change', update, { signal });

			return () => { controller.abort(); };
		});
	}
}

export const hasMouse = new HasMouseSignal().readonly;
