import { loaded } from './loaded.js';
import { trackScriptResource } from '/+app/delivery/resource/resource.js';
import { queueTask } from '/+std/dom/queueTask.js';

const scripts = [
	.../** @type {NodeListOf<HTMLScriptElement>} */ (
		document.querySelectorAll('script[type="module"]')
	),
].filter((script) => {
	if (!script.src) return false;
	if (script.src === import.meta.url) return false;

	return true;
});

await Promise.allSettled(
	Array.from(scripts, (script) => trackScriptResource(script)),
);

// just, give the browser (safari, ugh) a little while
requestAnimationFrame(() => {
	requestAnimationFrame(() => {
		queueTask(() => {
			loaded.resolve(true);
		});
	});
});
