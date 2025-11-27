import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';
import { requestAsset } from '../delivery/asset/asset.js';
import { pipeChunksIntoText } from '../delivery/pipes/pipeChunksIntoText.js';

const loader = new LUTCubeLoader();

export async function loadLutCube(/** @type {string} */ url) {
	const cube = await loader.loadAsync(url);
	return cube;
}

export function requestLutCube(/** @type {string} */ url) {
	return requestAsset(url, (chunks) => {
		const text = pipeChunksIntoText(chunks);
		const cube = loader.parse(text);
		return cube;
	});
}
