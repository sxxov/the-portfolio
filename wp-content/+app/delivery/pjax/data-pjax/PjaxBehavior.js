import { PjaxKeyBehavior } from '../data-pjax-key/PjaxKeyBehavior.js';
import { PjaxNavigationCause } from './PjaxNavigationCause.js';
import {
	clearProgress,
	trackProgress01,
} from '/+app/delivery/progress/progress.js';
import {
	performResourceCleanup,
	trackScriptResource,
	trackStylesheetResource,
} from '/+app/delivery/resource/resource.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { getBehaviorAttributeName } from '/+std/behavioral/serialization/getBehaviorAttributeName.js';
import { some } from '/+std/functional/some.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { cast } from '/+std/type/utilities/cast.js';
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
	},
	(element, { acquireNavigationSignal, dispatchNavigation }, {}) => {
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
					anchor.origin !== location.origin ||
					(anchor.pathname === location.pathname &&
						anchor.search === location.search)
				)
					return;

				event.preventDefault();

				const signal = acquireNavigationSignal();
				if (signal.aborted) return;

				const previousUrl = location.href;
				const nextUrl = anchor.href;
				await goto(nextUrl, {
					signal,
					pushState: true,
					memoiseScrollPosition: previousUrl,
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
				});
			},
			{ signal },
		);

		let currentUrl = '';
		window.addEventListener(
			'popstate',
			async () => {
				const previousUrl = currentUrl;
				const nextUrl = location.href;
				if (previousUrl === nextUrl) return;

				const signal = acquireNavigationSignal();
				if (signal.aborted) return;

				currentUrl = nextUrl;
				await goto(nextUrl, {
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
				});
			},
			{ signal },
		);

		return _;
	},
);

const scrollPositions = new /** @type {typeof Map<string, Point>} */ (Map)();
const htmlContents = new /** @type {typeof Map<string, string>} */ (Map)();
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
		onAfterReplace,
	} = {},
) {
	clearProgress();

	const gotoProgress = new PromiseSignal(0);
	trackProgress01(gotoProgress);

	if (shouldPushState) history.pushState(undefined, '', url);
	if (memoiseScrollPositionUrl)
		memoiseScrollPosition(memoiseScrollPositionUrl);

	const fetchProgress = new PromiseSignal(0);
	trackProgress01(fetchProgress);

	const doc = await (async () => {
		try {
			let html = htmlContents.get(url);
			if (!html) {
				const resp = await fetch(url, {
					headers: { 'x-pjax-referrer': location.href },
					signal: signal ?? null,
				});
				if (!resp.ok) throw new Error('Failed to fetch PJAX content');

				html = await resp.text();
				htmlContents.set(url, html);
			}

			const parser = new DOMParser();
			return parser.parseFromString(html, 'text/html');
		} catch (error) {
			if (signal?.aborted) return;

			location.href = url;
			throw error;
		} finally {
			fetchProgress.resolve(1);
		}
	})();
	if (!doc) return;

	// prepare for loading head resources
	performResourceCleanup();

	await reconcileHead(document.head, doc.head, {
		onTransition: () => onBeforeReplace?.({ url, document: doc }),
	});

	// replace body
	for (const { name, value } of doc.body.attributes)
		document.body.setAttribute(name, value);
	reconcileChildren(document.body, doc.body);

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
 * Import/clone a node into the current document to reify it. Fixes `<script>`
 * elements not executing after being added from a `DOMParser`-created
 * document.
 *
 * @template {Node} T
 * @returns {T}
 */
function reifyNode(/** @type {T} */ node) {
	if (node instanceof HTMLScriptElement) {
		const script = document.createElement('script');
		for (const { name, value } of node.attributes)
			script.setAttribute(name, value);
		script.textContent = node.textContent;
		return /** @type {T} */ (/** @type {unknown} */ (script));
	}

	return document.importNode(node, true);
}

async function reconcileHead(
	/** @type {HTMLHeadElement} */ previous,
	/** @type {HTMLHeadElement} */ next,
	/** @type {{ onTransition?: () => void | Promise<void> }} */ {
		onTransition,
	} = {},
) {
	// diff head & replace
	const newHeadChildren = new Map(
		Array.from(next.children, (child) => [child.outerHTML, child]),
	);
	const oldHeadChildren = new Map(
		Array.from(previous.children, (child) => [child.outerHTML, child]),
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

	for (const child of addedHeadChildren) {
		if (child instanceof HTMLLinkElement) {
			if (child.rel !== 'stylesheet' || !child.href) continue;
			void (async () => {
				pendingHeadCount.update((it) => it + 1);
				await trackStylesheetResource(child);
				loadedHeadCount.update((it) => it + 1);
			})();
			document.head.append(child);
			continue;
		}

		if (child instanceof HTMLScriptElement) {
			const script = reifyNode(child);
			void (async () => {
				pendingHeadCount.update((it) => it + 1);
				await trackScriptResource(script);
				loadedHeadCount.update((it) => it + 1);
			})();
			document.head.append(script);
			continue;
		}

		document.head.append(child);
	}
	if (pendingHeadCount.get() <= 0) headProgress.resolve(1);

	await Promise.allSettled([headProgress, onTransition?.()]);

	// remove stale
	for (const child of removedHeadChildren) child.remove();
}

/** @type {ReadonlySet<string>} */
const alwaysReplaceTags = new Set(['SCRIPT']);
/** @type {ReadonlySet<string>} */
const neverReplaceTags = new Set(['BODY']);
/** @type {ReadonlySet<string>} */
const reifyReplaceTags = new Set(['SCRIPT']);
// eslint-disable-next-line complexity
function reconcileChildren(
	/** @type {Node} */ previous,
	/** @type {Node} */ next,
) {
	const replace = (/** @type {Node} */ node) => {
		if (!('replaceWith' in previous)) return node;
		/** @type {typeof cast<ChildNode>} */ (cast)(previous);

		const replacement =
			reifyReplaceTags.has(node.nodeName) ? reifyNode(node) : node;
		previous.replaceWith(replacement);

		return node;
	};
	const recurse = (
		/** @type {Element} */ previous,
		/** @type {Element} */ next,
	) => {
		const previousChildren = [...previous.childNodes];
		const nextChildren = [...next.childNodes];

		// 1. remove outgoing children
		if (previousChildren.length > nextChildren.length)
			for (const child of previousChildren.slice(nextChildren.length))
				child.remove();

		// 2. reconcile existing children
		for (let i = 0; i < previousChildren.length; i++) {
			const prevChild = previousChildren[i];
			const nextChild = nextChildren[i];
			if (!prevChild || !nextChild) continue;

			reconcileChildren(prevChild, nextChild);
		}

		// 3. add incoming children
		if (nextChildren.length > previousChildren.length)
			previous.append(...nextChildren.slice(previousChildren.length));

		return previous;
	};

	if (
		(previous instanceof Text && next instanceof Text) ||
		(previous instanceof Comment && next instanceof Comment)
	) {
		// if text content matches, retain previous
		if (previous.textContent === next.textContent) return previous;

		// else, replace text with incoming
		return replace(next);
	}

	if (previous instanceof Element && next instanceof Element) {
		// if tag names mismatch, replace
		if (previous.tagName !== next.tagName) return replace(next);

		// if is a "always replace" tag, replace
		if (alwaysReplaceTags.has(previous.tagName)) return replace(next);
		// else, if it has a "never replace" tag, reconcile attributes
		if (neverReplaceTags.has(previous.tagName)) {
			// 1. remove old attributes
			for (const { name } of previous.attributes)
				if (!next.hasAttribute(name)) previous.removeAttribute(name);

			// 2. set new & updated attributes
			for (const { name, value } of next.attributes)
				previous.setAttribute(name, value);

			// 3. reconcile children
			return recurse(previous, next);
		}

		// else, if it has a matching key, retain & reconcile children
		const keyAttributeName = getBehaviorAttributeName(PjaxKeyBehavior.name);
		const previousKey = previous.getAttribute(keyAttributeName);
		const nextKey = next.getAttribute(keyAttributeName);
		if (some(previousKey) && some(nextKey) && previousKey === nextKey)
			return recurse(previous, next);

		// else, if attributes mismatch, replace
		for (const { name, value } of next.attributes)
			if (previous.getAttribute(name) !== value) return replace(next);
		for (const { name } of previous.attributes)
			if (!next.hasAttribute(name)) return replace(next);

		// else, retain & reconcile children
		return recurse(previous, next);
	}

	return replace(next);
}
