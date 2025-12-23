import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { coerceError } from '/+std/error/coerceError.js';
import { requestAsset } from '../delivery/asset/asset.js';
import { pipeChunksIntoUint8Array } from '../delivery/pipes/pipeChunksIntoUint8Array.js';
import { ClampToEdgeWrapping, DataTexture, LinearFilter } from 'three';
/** @import { EXR } from "three/addons/loaders/EXRLoader.js" */
/** @import { RequestAssetOptions } from "../delivery/asset/asset.js" */

const loader = new EXRLoader();

export async function loadExr(/** @type {string} */ url) {
	const blob = await (async () => {
		try {
			const resp = await fetch(url);
			if (!resp.ok) throw new Error(resp.statusText);
			return await resp.blob();
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert(
				`Uh oh, encountered error whilst downloading exr: ${coerceError(error).message}`,
			);
			throw error;
		}
	})();

	const modelBuffer = await blob.arrayBuffer();
	const exr = loader.parse(modelBuffer);
	const texture = createExrTexture(exr);

	return texture;
}

export function requestExr(
	/** @type {string} */ url,
	/** @type {RequestAssetOptions} */ options = {},
) {
	return requestAsset(
		url,
		(chunks) => {
			const buffer = pipeChunksIntoUint8Array(chunks);

			const exr = loader.parse(buffer.buffer);
			const texture = createExrTexture(exr);

			return texture;
		},
		options,
	);
}

function createExrTexture(/** @type {EXR} */ exr) {
	const texture = new DataTexture();

	// from `DataTextureLoader`
	texture.image.width = exr.width;
	texture.image.height = exr.height;
	texture.image.data = exr.data;
	texture.format = exr.format;
	texture.type = exr.type;
	texture.wrapS = ClampToEdgeWrapping;
	texture.wrapT = ClampToEdgeWrapping;
	texture.minFilter = LinearFilter;
	texture.magFilter = LinearFilter;
	texture.colorSpace = exr.colorSpace;
	texture.needsUpdate = true;

	return texture;
}
