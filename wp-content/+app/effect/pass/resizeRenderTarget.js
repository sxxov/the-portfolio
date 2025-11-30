/** @import { RenderTarget } from "three" */

import { resizeTexture } from './resizeTexture.js';

export function resizeRenderTarget(
	/** @type {RenderTarget} */ renderTarget,
	/** @type {number} */ width,
	/** @type {number} */ height,
) {
	const textures = [...renderTarget.textures];
	renderTarget.textures.length = 0;
	renderTarget.setSize(width, height);
	renderTarget.textures = textures;

	for (const texture of textures) resizeTexture(texture, width, height);
}
