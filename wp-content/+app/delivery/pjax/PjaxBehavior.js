import { trackProgress01 } from '../progress/progress.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { queueMicrotask } from '/+std/dom/queueMicrotask.js';
import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { Point } from "/+std/unit/Point.js" */

export const PjaxBehavior = behavior('pjax', class {}, (element, {}, {}) => {
	const _ = bin();
	const controller = new AbortController();
	_._ = () => { controller.abort(); };
	const { signal } = controller;

	element.addEventListener(
		'click',
		(event) => {
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
			void goto(anchor.href, {
				pushState: true,
				memoiseScrollPosition: location.href,
				restoreScrollPosition: false,
			});
		},
		{ signal },
	);

	window.addEventListener(
		'popstate',
		() => {
			const previousUrl = location.href;
			queueMicrotask(() => {
				void goto(location.href, {
					pushState: false,
					memoiseScrollPosition: previousUrl,
					restoreScrollPosition: true,
				});
			});
		},
		{ signal },
	);

	return _;
});

/** @type {Map<string, Point>} */
const scrollPositions = new Map();
let gotoController = new AbortController();
async function goto(
	/** @type {string} */ url,
	{
		pushState: shouldPushState = true,
		memoiseScrollPosition:
			memoiseScrollPositionUrl = /** @type {string | undefined} */ (
				undefined
			),
		restoreScrollPosition: shouldRestoreScrollPosition = true,
	} = {},
) {
	if (shouldPushState) history.pushState(undefined, '', url);
	if (memoiseScrollPositionUrl)
		memoiseScrollPosition(memoiseScrollPositionUrl);

	const controller = new AbortController();
	gotoController.abort();
	gotoController = controller;
	const { signal } = gotoController;

	const progress = new PromiseSignal(0);
	trackProgress01(progress);

	const doc = await (async () => {
		try {
			const resp = await fetch(url, {
				headers: { 'x-pjax-referrer': location.href },
				signal,
			});
			if (!resp.ok) throw new Error('Failed to fetch PJAX content');

			const text = await resp.text();

			const parser = new DOMParser();
			return parser.parseFromString(text, 'text/html');
		} catch (error) {
			if (signal.aborted) return;

			location.href = url;
			throw error;
		} finally {
			progress.resolve(1);
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

	const trackHeadLink = (/** @type {HTMLLinkElement} */ child) => {
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			loadedHeadCount.update((it) => it + 1);
		};

		pendingHeadCount.update((it) => it + 1);
		child.addEventListener('load', finish, { once: true });
		child.addEventListener('error', finish, { once: true });

		// Some browsers can skip dispatching `load` for cached styles; treat it as loaded
		// if a CSSStyleSheet is already attached.
		queueMicrotask(() => {
			if (done) return;

			if (child instanceof HTMLLinkElement) {
				if (child.rel === 'stylesheet' && child.sheet) finish();
			}
		});
	};

	for (const child of addedHeadChildren) {
		if (child instanceof HTMLLinkElement) {
			if (child.rel !== 'stylesheet' || !child.href) continue;
			trackHeadLink(child);
			document.head.append(child);
			continue;
		}

		if (child instanceof HTMLScriptElement) {
			const script = document.createElement('script');
			script.src = child.src;
			script.type = child.type;
			script.async = child.async;
			script.defer = child.defer;
			script.crossOrigin = child.crossOrigin;
			script.referrerPolicy = child.referrerPolicy;
			document.head.append(script);
			continue;
		}
	}
	if (pendingHeadCount.get() <= 0) headProgress.resolve(1);

	await headProgress;

	// remove stale
	for (const child of removedHeadChildren) child.remove();

	// replace body
	for (const { name, value } of doc.body.attributes)
		document.body.setAttribute(name, value);
	document.body.replaceChildren(...doc.body.children);

	// restore scroll position
	if (shouldRestoreScrollPosition) restoreScrollPosition(url);
	else window.scrollTo(0, 0);
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
