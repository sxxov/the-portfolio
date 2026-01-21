import { Signal } from '/+std/signal/Signal.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */

const loadedSources = new Signal(new /** @type {typeof Set<string>} */ (Set)());

export const resourceLoadedSources =
	/** @type {ReadableSignal<ReadonlySet<string>>} */ (loadedSources.readonly);
export const resourceLoadTimeout = 5_000;

export async function trackStylesheetResource(
	/** @type {HTMLLinkElement} */ node,
	{
		signal: cancellation = /** @type {AbortSignal | undefined} */ (
			undefined
		),
	} = {},
) {
	const { href: source } = node;
	if (!source || loadedSources.get().has(source)) return;

	await Promise.any([
		new /** @type {typeof Promise<void>} */ (Promise)((resolve) => {
			const controller = new AbortController();
			const { signal } = controller;

			const finish = () => {
				controller.abort();
				resolve();
			};
			cancellation?.addEventListener('abort', finish);
			node.addEventListener('load', finish, { signal });
			node.addEventListener('error', finish, { signal });

			// assume if there's a stylesheet, it's loaded
			queueMicrotask(() => {
				if (signal.aborted) return;

				if (node.sheet) finish();
			});
		}),
		waitTimeout(resourceLoadTimeout, {
			signal: cancellation,
		}),
	]);

	loadedSources.update((it) => {
		if (it.has(source)) return it;

		it.add(source);
		loadedSources.trigger();
		return it;
	});
}

export async function trackScriptResource(
	/** @type {HTMLScriptElement} */ node,
	{
		signal: cancellation = /** @type {AbortSignal | undefined} */ (
			undefined
		),
	} = {},
) {
	const { src: source } = node;
	if (!source || loadedSources.get().has(source)) return;

	await Promise.any([
		new /** @type {typeof Promise<void>} */ (Promise)((resolve) => {
			const controller = new AbortController();
			const { signal } = controller;

			const finish = () => {
				resolve();
				controller.abort();
			};
			cancellation?.addEventListener('abort', finish);
			node.addEventListener('load', finish, { signal });
			node.addEventListener('error', finish, { signal });

			// assume if a script has been fetched once, it's loaded
			queueMicrotask(() => {
				if (signal.aborted) return;

				if (performance.getEntriesByName(source)) finish();
			});
		}),
		waitTimeout(resourceLoadTimeout, {
			signal: cancellation,
		}),
	]);

	loadedSources.update((it) => {
		if (it.has(source)) return it;

		it.add(source);
		loadedSources.trigger();
		return it;
	});
}

async function waitTimeout(
	/** @type {number} */ timeout,
	{
		signal: cancellation = /** @type {AbortSignal | undefined} */ (
			undefined
		),
	} = {},
) {
	await new /** @type {typeof Promise<void>} */ (Promise)((resolve) => {
		const handle = setTimeout(resolve, timeout);
		cancellation?.addEventListener('abort', () => {
			clearTimeout(handle);
			resolve();
		});
	});
}

// continuously increase resource timing buffer size if full
// we depend on resource timing to track loaded scripts/styles
const initialBufferSize = 512;
let currentBufferSize = initialBufferSize;
performance.setResourceTimingBufferSize(initialBufferSize);
performance.addEventListener('resourcetimingbufferfull', () => {
	performance.setResourceTimingBufferSize((currentBufferSize *= 2));
});

export function performResourceCleanup() {
	// reset resource timing buffer size
	currentBufferSize = initialBufferSize;
	performance.clearResourceTimings();
	performance.setResourceTimingBufferSize(currentBufferSize);
}
