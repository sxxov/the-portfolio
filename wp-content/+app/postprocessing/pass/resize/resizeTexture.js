/** @import { Texture } from "three" */

export function resizeTexture(
	/** @type {Texture} */ texture,
	/** @type {number} */ width,
	/** @type {number} */ height,
) {
	texture.image = new ImageData(width, height);
	texture.needsUpdate = true;
}
