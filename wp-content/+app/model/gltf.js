import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { coerceError } from '/+std/error/coerceError.js';
import { requestAsset } from '../delivery/asset/asset.js';
import { pipeChunksIntoUint8Array } from '../delivery/pipes/pipeChunksIntoUint8Array.js';

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
	'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
);
loader.setDRACOLoader(dracoLoader);

export async function loadGltf(/** @type {string} */ url) {
	const blob = await (async () => {
		try {
			const resp = await fetch(url);
			if (!resp.ok) throw new Error(resp.statusText);
			return await resp.blob();
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert(
				`Uh oh, encountered error whilst downloading model: ${coerceError(error).message}`,
			);
			throw error;
		}
	})();

	const modelBuffer = await blob.arrayBuffer();
	const gltf = await loader.parseAsync(modelBuffer, url);

	return gltf;
}

export function requestGltf(/** @type {string} */ url) {
	return requestAsset(url, async (chunks) => {
		const buffer = pipeChunksIntoUint8Array(chunks);

		const gltf = await loader.parseAsync(buffer.buffer, url);
		return gltf;
	});
}
