import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';
import { requestAsset } from '../delivery/asset/asset.js';
import { pipeChunksIntoText } from '../delivery/pipes/pipeChunksIntoText.js';
/** @import { RequestAssetOptions } from "../delivery/asset/asset.js" */

const loader = new LUTCubeLoader();

export async function loadLutCube(/** @type {string} */ url) {
	const cube = await loader.loadAsync(url);
	return cube;
}

export function requestLutCube(
	/** @type {string} */ url,
	/** @type {RequestAssetOptions} */ options = {},
) {
	return requestAsset(
		url,
		(chunks) => {
			const text = pipeChunksIntoText(chunks);
			const cube = loader.parse(text);
			return cube;
		},
		options,
	);
}
