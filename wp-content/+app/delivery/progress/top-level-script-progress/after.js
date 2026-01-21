import { loaded } from './loaded.js';
import { trackScriptResource } from '/+app/delivery/resource/resource.js';
import { queueTask } from '/+std/dom/queueTask.js';

const scripts = /** @type {NodeListOf<HTMLScriptElement>} */ (
	document.querySelectorAll('script[type="module"]')
);
// track but don't await
for (const script of scripts) void trackScriptResource(script);

await new /** @type {typeof Promise<void>} */ (Promise)((resolve) => {
	window.addEventListener('DOMContentLoaded', () => { resolve(); });
});

// just, give the browser (safari, ugh) a little while
requestAnimationFrame(() => {
	requestAnimationFrame(() => {
		queueTask(() => {
			loaded.resolve(true);
		});
	});
});
