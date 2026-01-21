import { loaded } from './loaded.js';
import { trackScriptResource } from '/+app/delivery/resource/resource.js';

// FIXME: not sure why we need to force depend on `asset.js` here, but without this it
// the tracks seem to complete too early (before `asset.js` comes in & begins `request*` calls)
import '/+app/delivery/asset/asset.js';

const scripts = /** @type {NodeListOf<HTMLScriptElement>} */ (
	document.querySelectorAll('script[type="module"]')
);

await Promise.allSettled(
	Array.from(scripts, (script) => trackScriptResource(script)),
);

loaded.resolve(true);
