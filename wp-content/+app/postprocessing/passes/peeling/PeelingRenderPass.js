import { BackgroundChildProxyHandler } from './layers/background/BackgroundChildProxyHandler.js';
import { ForegroundChildProxyHandler } from './layers/foreground/ForegroundChildProxyHandler.js';
import { OccluderChildProxyHandler } from './layers/occluder/OccluderChildProxyHandler.js';
import {
	Color,
	DepthStencilFormat,
	DepthTexture,
	HalfFloatType,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Texture,
	UnsignedInt248Type,
	WebGLRenderTarget,
} from 'three';
import { Pass } from 'postprocessing';
import { CompositeLayersMaterial } from './composite-layers/shaders/CompositeLayersMaterial.js';
import { AlphaOpaqueMaskMaterial } from './alpha-opaque-mask/shaders/AlphaOpaqueMaskMaterial.js';
import { OccludedChildProxyHandler } from './layers/occluded/OccludedChildProxyHandler.js';
import { resizeRenderTarget } from '/+app/texture/resize/resizeRenderTarget.js';
/** @import { Camera, Scene, WebGLRenderer } from "three" */

export class PeelingRenderPass extends Pass {
	/** @override */
	needsSwap = false;

	constructor(/** @type {Scene} */ scene, /** @type {Camera} */ camera) {
		super(PeelingRenderPass.name);

		this.world = scene;
		this.worldCamera = camera;

		this.occludedDepthTexture = (() => {
			const it = new DepthTexture(1, 1);
			it.format = DepthStencilFormat;
			it.type = UnsignedInt248Type;
			it.needsUpdate = true;
			return it;
		})();

		this.occludedScene = new Proxy(scene, new OccludedChildProxyHandler());
		this.occludedSceneTexture = new Texture();
		this.occludedSceneRenderTarget = (() => {
			const it = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
			it.texture = this.occludedSceneTexture;
			it.depthTexture = this.occludedDepthTexture;
			return it;
		})();

		this.occluderScene = new Proxy(scene, new OccluderChildProxyHandler());
		this.occluderSceneTexture = new Texture();
		this.occluderSceneRenderTarget = (() => {
			const it = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
			it.texture = this.occluderSceneTexture;
			it.depthTexture = this.occludedDepthTexture;
			return it;
		})();

		this.occluderDepthTexture = (() => {
			const it = new DepthTexture(1, 1);
			it.format = DepthStencilFormat;
			it.type = UnsignedInt248Type;
			it.needsUpdate = true;
			return it;
		})();

		this.maskMaterial = new AlphaOpaqueMaskMaterial(
			this.occluderSceneTexture,
		);
		this.maskCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.maskScene = new Mesh(new PlaneGeometry(2, 2), this.maskMaterial);
		this.maskSceneTexture = new Texture();
		this.maskSceneRenderTarget = (() => {
			const it = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
			it.texture = this.maskSceneTexture;
			it.depthTexture = this.occluderDepthTexture;
			return it;
		})();

		this.backgroundScene = new Proxy(
			scene,
			new BackgroundChildProxyHandler(),
		);
		this.backgroundSceneTexture = new Texture();
		this.backgroundSceneRenderTarget = (() => {
			const it = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
			it.texture = this.backgroundSceneTexture;
			it.depthTexture = this.occluderDepthTexture;
			return it;
		})();

		this.foregroundScene = new Proxy(
			scene,
			new ForegroundChildProxyHandler(),
		);
		this.foregroundSceneTexture = new Texture();
		this.foregroundSceneRenderTarget = (() => {
			const it = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
			it.texture = this.foregroundSceneTexture;
			it.depthTexture = this.occluderDepthTexture;
			return it;
		})();

		this.compositeLayersMaterial = new CompositeLayersMaterial(
			this.occluderSceneTexture,
			this.backgroundSceneTexture,
			this.foregroundSceneTexture,
		);
		this.fullscreenMaterial = this.compositeLayersMaterial;

		this.clearColor = new Color(0, 0, 0);
		this.clearAlpha = 0;
	}

	/** @override */
	initialize(
		/** @type {WebGLRenderer} */ renderer,
		/** @type {boolean} */ alpha,
		/** @type {number} */ frameBufferType,
	) {
		super.initialize(renderer, alpha, frameBufferType);
	}

	/** @override */
	setSize(/** @type {number} */ width, /** @type {number} */ height) {
		super.setSize(width, height);

		for (const renderTarget of /** @type {const} */ ([
			this.occludedSceneRenderTarget,
			this.occluderSceneRenderTarget,
			this.backgroundSceneRenderTarget,
			this.foregroundSceneRenderTarget,
			this.maskSceneRenderTarget,
		]))
			resizeRenderTarget(renderTarget, width, height);
	}

	/** @override */
	render(
		/** @type {WebGLRenderer} */ renderer,
		/** @type {WebGLRenderTarget | null} */ inputBuffer,
		/** @type {WebGLRenderTarget | null} */ outputBuffer,
		/** @type {number} */ deltaTime,
		/** @type {boolean} */ stencilTest,
	) {
		const { worldCamera: camera } = this;
		const context = renderer.getContext();
		const {
			state: {
				buffers: { stencil },
			},
		} = renderer;

		// setup clear color
		const { autoClear } = renderer;
		this.clearColor = renderer.getClearColor(this.clearColor);
		this.clearAlpha = renderer.getClearAlpha();
		const { clearColor, clearAlpha } = this;
		renderer.setClearColor(0, 0);
		renderer.autoClear = false;

		// set up stencil write
		const stencilWriteValue = 1;
		const stencilClearValue = 0;
		const stencilMask = 0xffffffff;

		// render occluded
		const { occludedScene, occludedSceneRenderTarget } = this;
		renderer.setRenderTarget(occludedSceneRenderTarget);
		stencil.setLocked(false);
		stencil.setClear(stencilClearValue);
		stencil.setMask(stencilMask);
		stencil.setTest(true);
		stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
		stencil.setFunc(context.ALWAYS, stencilWriteValue, stencilMask);
		stencil.setLocked(true);
		renderer.clear(true, true, true);
		renderer.render(occludedScene, camera);

		// set up occluded stencil test
		stencil.setLocked(false);
		stencil.setTest(true);
		stencil.setFunc(context.EQUAL, stencilWriteValue, stencilMask);
		stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
		stencil.setLocked(true);

		// render occluder
		const { occluderScene, occluderSceneRenderTarget } = this;
		renderer.setRenderTarget(occluderSceneRenderTarget);
		renderer.clear(true, true, false);
		renderer.render(occluderScene, camera);

		// render mask
		const { maskScene, maskCamera, maskSceneRenderTarget } = this;
		renderer.setRenderTarget(maskSceneRenderTarget);
		stencil.setLocked(false);
		stencil.setClear(stencilClearValue);
		stencil.setMask(stencilMask);
		stencil.setTest(true);
		stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
		stencil.setFunc(context.ALWAYS, stencilWriteValue, stencilMask);
		stencil.setLocked(true);
		renderer.clear(true, true, true);
		renderer.render(maskScene, maskCamera);

		// set up occluder stencil test
		stencil.setLocked(false);
		stencil.setTest(true);
		stencil.setFunc(context.EQUAL, stencilClearValue, stencilMask);
		stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
		stencil.setLocked(true);

		// render background
		const { backgroundScene, backgroundSceneRenderTarget } = this;
		renderer.setRenderTarget(backgroundSceneRenderTarget);
		renderer.clear(true, true, false);
		renderer.render(backgroundScene, camera);

		// render foreground
		const { foregroundScene, foregroundSceneRenderTarget } = this;
		renderer.setRenderTarget(foregroundSceneRenderTarget);
		renderer.clear(true, true, false);
		renderer.render(foregroundScene, camera);

		// remove stencil
		stencil.setLocked(false);
		stencil.setTest(false);
		renderer.clear(false, false, true);

		// restore clear color
		renderer.setClearColor(clearColor, clearAlpha);

		// composite to screen
		const {
			renderToScreen,
			compositeLayersMaterial,
			scene: fullscreenScene,
			camera: fullscreenCamera,
		} = this;
		compositeLayersMaterial.clearColor.set(
			clearColor.r,
			clearColor.g,
			clearColor.b,
			clearAlpha,
		);
		renderer.setRenderTarget(renderToScreen ? null : inputBuffer);
		renderer.clear(true, true, true);
		renderer.render(fullscreenScene, fullscreenCamera);

		// restore auto clear
		renderer.autoClear = autoClear;
	}
}
