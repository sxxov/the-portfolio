import { SparkRenderer, SplatFileType, SplatMesh } from '@sparkjsdev/spark';
import {
	AnimationMixer,
	PerspectiveCamera,
	Scene,
	SRGBColorSpace,
	WebGLRenderer,
} from 'three';
import camerasGlb from './cameras.glb.js';
import sceneSog from './scene.sog.js';
import { requestAsset } from '/+app/delivery/asset/asset.js';
import { pipeChunksIntoUint8Array } from '/+app/delivery/pipes/pipeChunksIntoUint8Array.js';
import { requestGltf } from '/+app/model/gltf.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin } from '/+std/signal/Signal.js';
import { unwrap } from '/+std/type/utilities/unwrap.js';
import { degToRad } from '/+std/math/degToRad.js';

const { asset: camerasAsset } = requestGltf(camerasGlb);
const { asset: sceneAsset } = requestAsset(sceneSog, pipeChunksIntoUint8Array);

export const RigRendererBehavior = behavior(
	'rig-renderer',
	class {},
	(element) => {
		if (!(element instanceof HTMLElement)) return;

		const _ = bin();
		const abortController = new AbortController();
		const { signal } = abortController;

		const canvas = document.createElement('canvas');
		canvas.width = 1920;
		canvas.height = 1080;
		canvas.style.maxWidth = '100%';
		canvas.style.display = 'block';
		canvas.style.cursor = 'pointer';
		element.append(canvas);
		_._ = () => {
			canvas.remove();
		};

		const hint = document.createElement('div');
		hint.textContent =
			'Click the canvas to pick an output folder and start rendering';
		hint.style.fontFamily = 'monospace';
		hint.style.fontSize = '0.85rem';
		hint.style.marginTop = '0.5rem';
		hint.style.opacity = '0.75';
		element.append(hint);
		_._ = () => {
			hint.remove();
		};

		const renderer = new WebGLRenderer({
			canvas,
			antialias: false,
			alpha: true,
			powerPreference: 'high-performance',
			preserveDrawingBuffer: true,
		});
		renderer.outputColorSpace = SRGBColorSpace;
		renderer.setPixelRatio(1);
		renderer.setSize(canvas.width, canvas.height, false);
		_._ = () => {
			renderer.dispose();
		};

		const scene = new Scene();
		const sparkRenderer = new SparkRenderer({
			renderer,
			maxStdDev: Math.sqrt(5),
		});
		scene.add(sparkRenderer);
		_._ = () => {
			sparkRenderer.removeFromParent();
		};

		/**
		 * @type {{
		 * 			mesh: SplatMesh;
		 * 			rig: import('three').Group;
		 * 			mixer: AnimationMixer;
		 * 			clip: import('three').AnimationClip;
		 * 			frameTimes: number[];
		 * 			cameras: PerspectiveCamera[];
		 * 	  }
		 * 	| undefined}
		 */
		let prepared;
		const prepare = async () => {
			prepared ??= await (async () => {
				const [gltf, fileBytes] = await Promise.all([
					camerasAsset,
					sceneAsset,
				]);
				if (!gltf || !fileBytes || signal.aborted) return;

				/** @type {() => void} */
				let resolve;
				const splatLoaded = new /** @type {typeof Promise<void>} */ (
					Promise
				)((r) => { resolve = r; });
				const mesh = new SplatMesh({
					fileBytes,
					fileName: sceneSog,
					fileType: SplatFileType.PCSOGSZIP,
					onLoad: () => { resolve(); },
				});
				await mesh.initialized.catch(() => undefined);
				if (!mesh.isInitialized || signal.aborted) return;
				mesh.rotation.set(degToRad(180), degToRad(0), degToRad(0));
				scene.add(mesh);
				_._ = () => {
					mesh.removeFromParent();
					mesh.dispose();
				};

				const rig = gltf.scene;
				scene.add(rig);
				_._ = () => {
					rig.removeFromParent();
				};

				const mixer = new AnimationMixer(rig);
				const clip = gltf.animations.at(0);
				if (!clip) return;

				const action = mixer.clipAction(clip);
				action.play();

				const fps = sniffFps(clip);
				const frameTimes = getFrameTimes(clip, fps);
				/** @type {PerspectiveCamera[]} */
				const cameras = [];
				rig.traverse((object) => {
					if (object instanceof PerspectiveCamera)
						cameras.push(object);
				});

				await splatLoaded;

				return { mesh, rig, mixer, clip, frameTimes, cameras };
			})();
			return prepared;
		};

		const renderPreview = async () => {
			const context = await prepare();
			if (!context || signal.aborted) return;

			const { mixer, rig, frameTimes, cameras } = context;
			const camera = cameras.at(0);
			if (!camera) return;

			mixer.setTime(0);
			rig.updateMatrixWorld(true);

			camera.aspect = canvas.width / canvas.height;
			camera.updateProjectionMatrix();
			camera.updateMatrixWorld(true);

			renderer.render(scene, camera);
			setTimeout(() => {
				renderer.render(scene, camera);
			}, 200);
			hint.textContent =
				'Preview ready. Click the canvas to write renders to a folder';
		};
		void renderPreview();

		let running = false;
		let done = false;
		const start = async () => {
			if (running || done || signal.aborted) return;
			running = true;
			try {
				const directoryHandle = await requestDirectoryHandle();
				if (!directoryHandle || signal.aborted) return;

				const context = await prepare();
				if (!context || signal.aborted) return;

				const { mixer, rig, frameTimes, cameras } = context;

				for (const [cameraIndex, camera] of cameras.entries()) {
					if (signal.aborted) break;

					camera.aspect = canvas.width / canvas.height;
					camera.updateProjectionMatrix();
					const cameraName = camera.name || `camera-${cameraIndex}`;

					for (const [frameIndex, time] of frameTimes.entries()) {
						if (signal.aborted) break;

						mixer.setTime(time);
						rig.updateMatrixWorld(true);
						camera.updateMatrixWorld(true);

						renderer.render(scene, camera);

						await writeFrame(
							directoryHandle,
							canvas,
							cameraName,
							frameIndex,
						);
					}
				}
				done = true;
				hint.textContent = 'Finished rendering';
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to render rig', error);
			} finally {
				running = false;
			}
		};

		// showDirectoryPicker requires a user gesture.
		const onClick = () => {
			if (running || done) return;
			hint.textContent = 'Rendering...';
			start();
		};
		element.addEventListener('click', onClick);
		_._ = () => {
			abortController.abort();
			element.removeEventListener('click', onClick);
		};

		return _;
	},
);

async function requestDirectoryHandle() {
	if (!('showDirectoryPicker' in window)) {
		// eslint-disable-next-line no-console
		console.warn('File System Access API is not available.');
		return;
	}

	try {
		const handle = await /** @type {any} */ (window).showDirectoryPicker();
		if ('requestPermission' in handle) {
			const permission = await handle.requestPermission({
				mode: 'readwrite',
			});
			if (permission !== 'granted') return;
		}

		return handle;
	} catch (error) {
		if (error && typeof error === 'object' && 'name' in error) {
			if (/** @type {{ name?: unknown }} */ (error).name === 'AbortError')
				return;
		}

		// eslint-disable-next-line no-console
		console.error('Failed to open output directory', error);
	}
}

function sniffFps(/** @type {import('three').AnimationClip} */ clip) {
	let minDelta = Number.POSITIVE_INFINITY;
	for (const track of clip.tracks) {
		const { times } = track;
		for (let i = 1; i < times.length; i++) {
			const delta = unwrap(times[i]) - unwrap(times[i - 1]);
			if (delta > 1e-6 && delta < minDelta) minDelta = delta;
		}
	}

	if (Number.isFinite(minDelta) && minDelta > 0) {
		const fps = Math.round(1 / minDelta);
		if (fps > 1 && fps <= 240) return fps;
	}

	return 24;
}

function getFrameTimes(
	/** @type {import('three').AnimationClip} */ clip,
	/** @type {number} */ fps,
) {
	const frameDuration = 1 / fps;
	const times = [];
	for (
		let time = 0, i = 0;
		time < clip.duration + 1e-6;
		time = ++i * frameDuration
	)
		times.push(Math.min(time, clip.duration));

	if (times.at(-1) !== clip.duration) times.push(clip.duration);
	return times;
}

async function writeFrame(
	/** @type {FileSystemDirectoryHandle} */ directoryHandle,
	/** @type {HTMLCanvasElement} */ canvas,
	/** @type {string} */ cameraName,
	/** @type {number} */ frameIndex,
) {
	const fileHandle = await directoryHandle.getFileHandle(
		`${cameraName}_${`${frameIndex}`.padStart(4, '0')}.png`,
		{ create: true },
	);
	const writable = await fileHandle.createWritable();

	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((maybeBlob) => {
			if (maybeBlob) resolve(maybeBlob);
			else reject(new Error('Failed to encode frame'));
		}, 'image/png');
	});

	await writable.write(blob);
	await writable.close();
}
