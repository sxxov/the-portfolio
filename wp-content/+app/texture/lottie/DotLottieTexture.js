import { DotLottie } from '@lottiefiles/dotlottie-web';
import { CanvasTexture } from 'three';
import { bin, Signal } from '/+std/signal/Signal.js';
/** @import { Config } from "@lottiefiles/dotlottie-web" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */
/** @import { Size } from "/+std/unit/Size.js" */

export class DotLottieTexture extends CanvasTexture {
	/** @protected @readonly */ _ = bin();

	/** @readonly */
	progress = new Signal(/** @type {Ranged<0 | 1>} */ (0));
	/** @private @readonly */
	animationSizeValue = new Signal(
		/** @type {Size | undefined} */ (undefined),
	);
	/** @readonly */
	animationSize = this.animationSizeValue.readonly;

	/** @private @readonly */
	textureSizeValue = new Signal(
		/** @type {Size} */ ({ width: 1, height: 1 }),
	);
	/** @readonly */
	textureSize = this.textureSizeValue.readonly;

	constructor(/** @type {Omit<Config, 'canvas'>} */ config) {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		super(canvas);
		this.canvas = canvas;

		const { _ } = this;

		const dotLottie = new DotLottie({
			...config,
			canvas,
			renderConfig: {
				...config.renderConfig,
				autoResize: false,
				devicePixelRatio: 1,
				freezeOnOffscreen: false,
			},
		});
		_._ = () => { dotLottie.destroy(); };
		this.dotLottie = dotLottie;

		const onRender = () => { this.onRender(); };
		dotLottie.addEventListener('render', onRender);
		_._ = () => { dotLottie.removeEventListener('render', onRender); };

		const onCreate = () => { this.onCreate(); };
		dotLottie.addEventListener('load', onCreate);
		_._ = () => { dotLottie.removeEventListener('load', onCreate); };

		if (dotLottie.isLoaded) onCreate();
	}

	/** @protected */
	onCreate() {
		const size = this.dotLottie.animationSize();
		this.animationSizeValue.set(size);

		this.dotLottie.resize();

		const $progress = this.progress.get();
		this.seek($progress);
	}

	/** @protected */
	onRender() {
		this.progress.set(
			this.dotLottie.currentFrame / this.dotLottie.totalFrames,
		);
		this.needsUpdate = true;
	}

	seek(/** @type {number} */ progress) {
		this.progress.set(progress);
		this.dotLottie.setFrame(progress * this.dotLottie.totalFrames);
		this.needsUpdate = true;
	}

	resize(/** @type {number} */ width, /** @type {number} */ height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.dotLottie.resize();
		this.textureSizeValue.set({ width, height });
		this.needsUpdate = true;
	}

	/**
	 * @overload
	 * @returns {void}
	 */
	/**
	 * @overload
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @returns {void}
	 */
	scissor(
		/** @type {number} */ x = 0,
		/** @type {number} */ y = 0,
		/** @type {number} */ width = this.animationSize.get()?.width ?? 0,
		/** @type {number} */ height = this.animationSize.get()?.height ?? 0,
	) {
		this.dotLottie.setViewport(x, y, width, height);
		this.textureSizeValue.set({ width, height });
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}
}
