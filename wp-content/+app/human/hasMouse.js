import { Signal } from '/+std/signal/Signal.js';

/** @extends {Signal<boolean>} */
export class HasMouseSignal extends Signal {
	constructor() {
		super(false, ({ set }) => {
			const controller = new AbortController();
			const { signal } = controller;

			const query = matchMedia('(pointer: fine)');
			const update = () => { set(query.matches); };
			query.addEventListener('change', update, { signal });
			update();

			return () => { controller.abort(); };
		});
	}
}

export const hasMouse = new HasMouseSignal().readonly;
