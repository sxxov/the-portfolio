import { trackProgress01 } from '/+app/delivery/progress/progress.js';
import { PjaxNavigationCause } from './PjaxNavigationCause.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { queueMicrotask } from '/+std/dom/queueMicrotask.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { PjaxKeyBehavior } from '../data-pjax-key/PjaxKeyBehavior.js';
import { getBehaviorAttributeName } from '/+std/behavioral/serialization/getBehaviorAttributeName.js';
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { Subscriber } from "/+std/signal/Signal.js" */
/** @import { PjaxNavigation } from "./PjaxNavigation.js" */

export const PjaxBehavior = behavior(
	'pjax',
	class {
		/** @private */
		navigationController = new AbortController();
		acquireNavigationSignal = () => {
			const controller = new AbortController();
			this.navigationController.abort();
			this.navigationController = controller;

			const { signal } = this.navigationController;
			return signal;
		};

		/** @private @readonly */
		navigationSubscribers =
			new /** @type {typeof Set<Subscriber<PjaxNavigation>>} */ (Set)();
		subscribeNavigationSoon = (
			/** @type {Subscriber<PjaxNavigation>} */ subscriber,
		) => {
			this.navigationSubscribers.add(subscriber);
			return () => { this.navigationSubscribers.delete(subscriber); };
		};
		subscribeNavigation = (
			/** @type {Subscriber<PjaxNavigation>} */ subscriber,
		) => {
			const unsubscribe = this.subscribeNavigationSoon(subscriber);
			void subscriber({
				from: location.href,
				to: location.href,
				document,
				cause: PjaxNavigationCause.History,
			});
			return unsubscribe;
		};

		dispatchNavigation = async (
			/** @type {PjaxNavigation} */ navigation,
			/** @type {{ signal?: AbortSignal }} */ { signal } = {},
		) => {
			for (const subscriber of this.navigationSubscribers) {
				if (signal?.aborted) return;
				await subscriber(navigation);
			}
		};

		memoisedElements = new /** @type {typeof Map<string, HTMLElement>} */ (
			Map
		)();
		replaceMemoisedElements = (/** @type {ParentNode} */ node) => {
			for (const [name, element] of this.memoisedElements) {
				const selector = `[${getBehaviorAttributeName(PjaxKeyBehavior.name)}="${name}"]`;
				const target = node.querySelector(selector);
				if (!target) continue;

				target.replaceWith(element);
			}
		};
	},
	(
		element,
		{
			acquireNavigationSignal,
			dispatchNavigation,
			replaceMemoisedElements,
		},
		{},
	) => {
		const _ = bin();
		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		element.addEventListener(
			'click',
			async (event) => {
				if (
					event.defaultPrevented ||
					event.altKey ||
					event.shiftKey ||
					event.ctrlKey ||
					event.metaKey
				)
					return;

				const anchor = /** @type {HTMLAnchorElement | undefined} */ (
					event.target instanceof Element ?
						(event.target.closest('a') ?? undefined)
					:	undefined
				);
				if (
					!anchor ||
					anchor.target === '_blank' ||
					anchor.hasAttribute('download') ||
					anchor.href.startsWith('mailto:') ||
					anchor.href.startsWith('tel:') ||
					anchor.origin !== location.origin
				)
					return;

				event.preventDefault();

				const signal = acquireNavigationSignal();
				if (signal.aborted) return;

				const previousUrl = location.href;
				await goto(anchor.href, {
					signal,
					pushState: true,
					memoiseScrollPosition: location.href,
					restoreScrollPosition: false,
					onBeforeReplace: async ({ url, document }) => {
						await dispatchNavigation(
							{
								from: previousUrl,
								to: url,
								document,
								cause: PjaxNavigationCause.Link,
							},
							{ signal },
						);
					},
					onBetweenReplace: ({ next }) => {
						for (const node of next) replaceMemoisedElements(node);
					},
				});
			},
			{ signal },
		);

		window.addEventListener(
			'popstate',
			() => {
				const previousUrl = location.href;
				queueMicrotask(async () => {
					const signal = acquireNavigationSignal();
					if (signal.aborted) return;

					await goto(location.href, {
						signal,
						pushState: false,
						memoiseScrollPosition: previousUrl,
						restoreScrollPosition: true,
						onBeforeReplace: async ({ url, document }) => {
							await dispatchNavigation(
								{
									from: previousUrl,
									to: url,
									document,
									cause: PjaxNavigationCause.History,
								},
								{ signal },
							);
						},
						onBetweenReplace: ({ next }) => {
							for (const node of next)
								replaceMemoisedElements(node);
						},
					});
				});
			},
			{ signal },
		);

		return _;
	},
);

const scrollPositions = new /** @type {typeof Map<string, Point>} */ (Map)();
const loadedScriptSources = new /** @type {typeof Set<string>} */ (Set)();
async function goto(
	/** @type {string} */ url,
	/**
	 * @type {{
	 * 	signal?: AbortSignal;
	 * 	pushState?: boolean;
	 * 	memoiseScrollPosition?: string;
	 * 	restoreScrollPosition?: boolean;
	 * 	onBeforeReplace?: (context: {
	 * 		url: string;
	 * 		document: Document;
	 * 	}) => void | Promise<void>;
	 * 	onBetweenReplace?: (context: {
	 * 		previous: Element[];
	 * 		next: Element[];
	 * 	}) => void;
	 * 	onAfterReplace?: (context: {
	 * 		url: string;
	 * 		document: Document;
	 * 	}) => void | Promise<void>;
	 * }}
	 */ {
		signal,
		pushState: shouldPushState = true,
		memoiseScrollPosition: memoiseScrollPositionUrl,
		restoreScrollPosition: shouldRestoreScrollPosition = true,
		onBeforeReplace,
		onBetweenReplace,
		onAfterReplace,
	} = {},
) {
	const gotoProgress = new PromiseSignal(0);
	trackProgress01(gotoProgress);

	if (shouldPushState) history.pushState(undefined, '', url);
	if (memoiseScrollPositionUrl)
		memoiseScrollPosition(memoiseScrollPositionUrl);

	const fetchProgress = new PromiseSignal(0);
	trackProgress01(fetchProgress);

	const doc = await (async () => {
		try {
			const resp = await fetch(url, {
				headers: { 'x-pjax-referrer': location.href },
				signal: signal ?? null,
			});
			if (!resp.ok) throw new Error('Failed to fetch PJAX content');

			const text = await resp.text();

			const parser = new DOMParser();
			return parser.parseFromString(text, 'text/html');
		} catch (error) {
			if (signal?.aborted) return;

			location.href = url;
			throw error;
		} finally {
			fetchProgress.resolve(1);
		}
	})();
	if (!doc) return;

	// diff head & replace
	const newHead = doc.head;
	const oldHead = document.head;
	const newHeadChildren = new Map(
		Array.from(newHead.children, (child) => [child.outerHTML, child]),
	);
	const oldHeadChildren = new Map(
		Array.from(oldHead.children, (child) => [child.outerHTML, child]),
	);
	const addedHeadChildren = [...newHeadChildren.entries()]
		.filter(([key]) => !oldHeadChildren.has(key))
		.map(([, child]) => child);
	const removedHeadChildren = [...oldHeadChildren.entries()]
		.filter(([key]) => !newHeadChildren.has(key))
		.map(([, child]) => child);

	const pendingHeadCount = new Signal(0);
	const loadedHeadCount = new Signal(0);
	const headProgress = new PromiseSignal(0, ({ set, resolve }) =>
		subscribe(
			{ pendingHeadCount, loadedHeadCount },
			({ $pendingHeadCount, $loadedHeadCount }) => {
				if ($pendingHeadCount <= 0) return;

				const progress = $loadedHeadCount / $pendingHeadCount;
				set(progress);

				if (progress >= 1) resolve(1);
			},
		),
	);
	trackProgress01(headProgress);

	const trackLink = (/** @type {HTMLLinkElement} */ child) => {
		const controller = new AbortController();
		const { signal } = controller;

		pendingHeadCount.update((it) => it + 1);
		const finish = () => {
			if (signal.aborted) return;

			loadedHeadCount.update((it) => it + 1);
			controller.abort();
		};
		child.addEventListener('load', finish, { signal });
		child.addEventListener('error', finish, { signal });

		// some browsers can skip dispatching `load` for cached styles; treat it as loaded
		// if a CSSStyleSheet is already attached
		queueMicrotask(() => {
			if (child.sheet) finish();
		});
	};

	const trackScript = (/** @type {HTMLScriptElement} */ script) => {
		if (!script.src || loadedScriptSources.has(script.src)) return;

		const controller = new AbortController();
		const { signal } = controller;

		pendingHeadCount.update((it) => it + 1);
		const finish = () => {
			if (signal.aborted) return;

			loadedScriptSources.add(script.src);
			loadedHeadCount.update((it) => it + 1);
			controller.abort();
		};
		script.addEventListener('load', finish, { signal });
		script.addEventListener('error', finish, { signal });

		// assume if a script has been fetched once, it's loaded
		queueMicrotask(() => {
			if (performance.getEntriesByName(script.src)) finish();
		});
	};

	for (const child of addedHeadChildren) {
		if (child instanceof HTMLLinkElement) {
			if (child.rel !== 'stylesheet' || !child.href) continue;
			trackLink(child);
			document.head.append(child);
			continue;
		}

		if (child instanceof HTMLScriptElement) {
			const script = createRunnableScript(child);
			trackScript(script);
			document.head.append(script);
			continue;
		}

		document.head.append(child);
	}
	if (pendingHeadCount.get() <= 0) headProgress.resolve(1);

	await Promise.allSettled([
		headProgress,
		onBeforeReplace?.({ url, document: doc }),
	]);

	// remove stale
	for (const child of removedHeadChildren) child.remove();

	// replace body
	for (const { name, value } of doc.body.attributes)
		document.body.setAttribute(name, value);
	const previousBodyChildren = [...document.body.children];
	const nextBodyChildren = [...doc.body.children].map((child) => {
		if (child instanceof HTMLScriptElement)
			return createRunnableScript(child);

		const scripts = child.querySelectorAll('script');
		for (const script of scripts) {
			const runnable = createRunnableScript(script);
			script.replaceWith(runnable);
		}

		return child;
	});
	document.body.append(...nextBodyChildren);
	onBetweenReplace?.({
		previous: previousBodyChildren,
		next: nextBodyChildren,
	});
	for (const child of previousBodyChildren) child.remove();

	// restore scroll position
	if (shouldRestoreScrollPosition) restoreScrollPosition(url);
	else window.scrollTo(0, 0);

	await Promise.allSettled([
		onAfterReplace?.({ url, document }), //
	]);

	gotoProgress.resolve(1);
}

function memoiseScrollPosition(/** @type {string} */ url) {
	/** @type {Point} */
	const oldScrollPosition = {
		x: window.scrollX,
		y: window.scrollY,
	};
	scrollPositions.set(url, oldScrollPosition);
}

function restoreScrollPosition(/** @type {string} */ url) {
	const newScrollPosition = scrollPositions.get(url) ?? { x: 0, y: 0 };
	window.scrollTo(newScrollPosition.x, newScrollPosition.y);
}

/**
 * Scripts from `DOMParser` are inert by default. Cloning them here enables them
 * to be run when inserted into the live DOM
 */
function createRunnableScript(/** @type {HTMLScriptElement} */ child) {
	const script = document.createElement('script');
	script.src = child.src;
	script.type = child.type;
	script.async = child.async;
	script.defer = child.defer;
	script.crossOrigin = child.crossOrigin;
	script.referrerPolicy = child.referrerPolicy;
	return script;
}
