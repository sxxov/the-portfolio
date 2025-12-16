import {
	HalfFloatType,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	WebGLRenderTarget,
} from 'three';
import { Pass } from 'postprocessing';
import { AdvectionMaterial } from './simulation/passes/advection/shaders/AdvectionMaterial.js';
import { TouchForceMaterial } from './simulation/passes/touch-force/shaders/TouchForceMaterial.js';
import { TouchValueMaterial } from './simulation/passes/touch-value/shaders/TouchValueMaterial.js';
import { unwrap } from '/+std/type/utilities/unwrap.js';
import { BoundaryMaterial } from './simulation/passes/boundary/shaders/BoundaryMaterial.js';
import { DivergenceMaterial } from './simulation/passes/divergence/shaders/DivergenceMaterial.js';
import { JacobiIterationsMaterial } from './simulation/passes/jacobi-iterations/shaders/JacobiIterationsMaterial.js';
import { GradientSubtractionMaterial } from './simulation/passes/gradient-subtraction/shaders/GradientSubtractionMaterial.js';
import { DisplacementMaterial } from './displacement/shaders/DisplacementMaterial.js';
import { resizeRenderTarget } from '/+app/texture/resize/resizeRenderTarget.js';
import {
	scrollVelocityX,
	scrollVelocityY,
} from '/+app/human/scrollVelocity.js';
/** @import { WebGLRenderer } from "three" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { InteractionContainer } from "../../../controls/interactivity/InteractionContainer.js" */
/** @import { Point } from "/+std/unit/Point.js" */

export class FluidDisplacementPass extends Pass {
	// shared geometry & camera
	passCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
	passGeometry = new PlaneGeometry(2, 2);

	// dimensions
	width = 1;
	height = 1;
	aspect = 1;

	// textures & render targets
	velocityRenderTargets =
		/** @type {[a: WebGLRenderTarget, b: WebGLRenderTarget]} */ ([
			new WebGLRenderTarget(1, 1, {
				type: HalfFloatType,
				depthBuffer: false,
			}),
			new WebGLRenderTarget(1, 1, {
				type: HalfFloatType,
				depthBuffer: false,
			}),
		]);
	valueRenderTargets =
		/** @type {[a: WebGLRenderTarget, b: WebGLRenderTarget]} */ ([
			new WebGLRenderTarget(1, 1, {
				type: HalfFloatType,
				depthBuffer: false,
			}),
			new WebGLRenderTarget(1, 1, {
				type: HalfFloatType,
				depthBuffer: false,
			}),
		]);
	velocityDivergenceRenderTarget = //
		new WebGLRenderTarget(1, 1, {
			type: HalfFloatType,
			depthBuffer: false,
		});
	pressureRenderTargets =
		/** @type {[a: WebGLRenderTarget, b: WebGLRenderTarget]} */ ([
			new WebGLRenderTarget(1, 1, {
				type: HalfFloatType,
				depthBuffer: false,
			}),
			new WebGLRenderTarget(1, 1, {
				type: HalfFloatType,
				depthBuffer: false,
			}),
		]);

	// passes
	velocityAdvectionMaterial = new AdvectionMaterial();
	velocityAdvectionScene = new Mesh(
		this.passGeometry,
		this.velocityAdvectionMaterial,
	);
	valueAdvectionMaterial = new AdvectionMaterial();
	valueAdvectionScene = new Mesh(
		this.passGeometry,
		this.valueAdvectionMaterial,
	);
	touchForceAdditionMaterial = new TouchForceMaterial();
	touchForceAdditionScene = new Mesh(
		this.passGeometry,
		this.touchForceAdditionMaterial,
	);
	touchValueAdditionMaterial = new TouchValueMaterial();
	touchValueAdditionScene = new Mesh(
		this.passGeometry,
		this.touchValueAdditionMaterial,
	);
	velocityBoundaryMaterial = new BoundaryMaterial();
	velocityBoundaryScene = new Mesh(
		this.passGeometry,
		this.velocityBoundaryMaterial,
	);
	velocityDivergenceMaterial = new DivergenceMaterial();
	velocityDivergenceScene = new Mesh(
		this.passGeometry,
		this.velocityDivergenceMaterial,
	);
	pressureMaterial = new JacobiIterationsMaterial();
	pressureScene = new Mesh(
		this.passGeometry, //
		this.pressureMaterial,
	);
	pressureSubtractionMaterial = new GradientSubtractionMaterial();
	pressureSubtractionScene = new Mesh(
		this.passGeometry,
		this.pressureSubtractionMaterial,
	);

	displacementMaterial = new DisplacementMaterial();
	displacementScene = new Mesh(
		this.passGeometry, //
		this.displacementMaterial,
	);

	constructor(/** @type {ReadableSignal<ReadonlySet<Point>>} */ pointers) {
		super(FluidDisplacementPass.name);

		this.pointers = pointers;
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

		this.width = width;
		this.height = height;
		this.aspect = width / height;

		for (const renderTarget of /** @type {const} */ ([
			...this.velocityRenderTargets,
			...this.valueRenderTargets,
			this.velocityDivergenceRenderTarget,
			...this.pressureRenderTargets,
		]))
			resizeRenderTarget(renderTarget, width, height);

		this.touchForceAdditionMaterial.aspect = this.aspect;
		this.touchValueAdditionMaterial.aspect = this.aspect;
	}

	/** @override */
	render(
		/** @type {WebGLRenderer} */ renderer,
		/** @type {WebGLRenderTarget | null} */ inputBuffer,
		/** @type {WebGLRenderTarget | null} */ outputBuffer,
		/** @type {number} */ deltaTime,
		/** @type {boolean} */ stencilTest,
	) {
		if (!inputBuffer) return;

		this.renderSimulation(renderer, deltaTime);
		this.renderDisplacement(renderer, inputBuffer, outputBuffer);
	}

	renderSimulation(
		/** @type {WebGLRenderer} */ renderer,
		/** @type {number} */ deltaTime,
	) {
		const {
			passCamera,

			aspect,
			width,
			height,

			pointers,

			velocityRenderTargets,
			velocityAdvectionMaterial,
			velocityAdvectionScene,

			valueRenderTargets,
			valueAdvectionMaterial,
			valueAdvectionScene,

			velocityDivergenceMaterial,
			velocityDivergenceScene,
			velocityDivergenceRenderTarget,

			pressureRenderTargets,

			touchForceAdditionMaterial,
			touchForceAdditionScene,
			touchValueAdditionMaterial,
			touchValueAdditionScene,
			velocityBoundaryMaterial,
			velocityBoundaryScene,
			pressureMaterial,
			pressureScene,
			pressureSubtractionMaterial,
			pressureSubtractionScene,
		} = this;

		// advect the velocity vector field
		velocityAdvectionMaterial.deltaTime = deltaTime;
		[{ texture: velocityAdvectionMaterial.velocityMap }] =
			velocityRenderTargets;
		[{ texture: velocityAdvectionMaterial.valueMap }] =
			velocityRenderTargets;
		[velocityRenderTargets[0], velocityRenderTargets[1]] = [
			velocityRenderTargets[1],
			velocityRenderTargets[0],
		];
		renderer.setRenderTarget(velocityRenderTargets[0]);
		renderer.render(velocityAdvectionScene, passCamera);

		const $pointers = pointers.get();
		const pointersList = [...$pointers];
		const $scrollVelocityX = scrollVelocityX.get();
		const $scrollVelocityY = scrollVelocityY.get();
		const scrollVelocityAmplitude = 0.1;
		const scrollVelocityNoise = 0.5;
		for (let i = 0; i < 10; i++) {
			const pointer = pointersList[i];
			const forceTouch = unwrap(touchForceAdditionMaterial.touches[i]);
			const valueTouch = unwrap(touchValueAdditionMaterial.touches[i]);

			const randomClip = Math.random() * 2 - 1;
			const scrollVelocityMax = Math.max(
				Math.abs($scrollVelocityX),
				Math.abs($scrollVelocityY),
			);
			const scrollVelocityNoiseAmplitude =
				randomClip * scrollVelocityNoise;
			const scrollAdditionX =
				($scrollVelocityX * (1 + scrollVelocityNoiseAmplitude) * 0.75 +
					scrollVelocityMax * scrollVelocityNoiseAmplitude * 0.25) *
				scrollVelocityAmplitude;
			const scrollAdditionY =
				($scrollVelocityY * (1 + scrollVelocityNoiseAmplitude) * 0.75 +
					scrollVelocityMax * scrollVelocityNoiseAmplitude * 0.25) *
				scrollVelocityAmplitude;

			if (pointer) {
				const x = (pointer.x / width) * aspect;
				const y = 1 - pointer.y / height;

				forceTouch.set(
					x,
					y,
					(forceTouch.x > 0 ? x - forceTouch.x : 0) + scrollAdditionX,
					(forceTouch.y > 0 ? y - forceTouch.y : 0) + scrollAdditionY,
				);
				valueTouch.set(
					x,
					y,
					(valueTouch.x > 0 ? x - valueTouch.x : 0) + scrollAdditionX,
					(valueTouch.y > 0 ? y - valueTouch.y : 0) + scrollAdditionY,
				);
			} else {
				forceTouch.set(0, 0, 0, 0);
				valueTouch.set(0, 0, 0, 0);
			}
		}

		[{ texture: touchForceAdditionMaterial.velocityMap }] =
			velocityRenderTargets;
		[velocityRenderTargets[0], velocityRenderTargets[1]] = [
			velocityRenderTargets[1],
			velocityRenderTargets[0],
		];
		renderer.setRenderTarget(velocityRenderTargets[0]);
		renderer.render(touchForceAdditionScene, passCamera);

		[{ texture: touchValueAdditionMaterial.valueMap }] = valueRenderTargets;
		[valueRenderTargets[0], valueRenderTargets[1]] = [
			valueRenderTargets[1],
			valueRenderTargets[0],
		];
		renderer.setRenderTarget(valueRenderTargets[0]);
		renderer.render(touchValueAdditionScene, passCamera);

		[{ texture: velocityBoundaryMaterial.velocityMap }] =
			velocityRenderTargets;
		[velocityRenderTargets[0], velocityRenderTargets[1]] = [
			velocityRenderTargets[1],
			velocityRenderTargets[0],
		];
		renderer.setRenderTarget(velocityRenderTargets[0]);
		renderer.render(velocityBoundaryScene, passCamera);

		[{ texture: velocityDivergenceMaterial.velocityMap }] =
			velocityRenderTargets;
		renderer.setRenderTarget(velocityDivergenceRenderTarget);
		renderer.render(velocityDivergenceScene, passCamera);

		({ texture: pressureMaterial.divergenceMap } =
			velocityDivergenceRenderTarget);
		for (let i = 0; i < 16; i++) {
			[{ texture: pressureMaterial.valueMap }] = pressureRenderTargets;
			[pressureRenderTargets[0], pressureRenderTargets[1]] = [
				pressureRenderTargets[1],
				pressureRenderTargets[0],
			];
			renderer.setRenderTarget(pressureRenderTargets[0]);
			renderer.render(pressureScene, passCamera);
		}

		[{ texture: pressureSubtractionMaterial.velocityMap }] =
			velocityRenderTargets;
		[{ texture: pressureSubtractionMaterial.pressureMap }] =
			pressureRenderTargets;
		[velocityRenderTargets[0], velocityRenderTargets[1]] = [
			velocityRenderTargets[1],
			velocityRenderTargets[0],
		];
		renderer.setRenderTarget(velocityRenderTargets[0]);
		renderer.render(pressureSubtractionScene, passCamera);

		valueAdvectionMaterial.deltaTime = deltaTime;
		[{ texture: valueAdvectionMaterial.velocityMap }] =
			velocityRenderTargets;
		[{ texture: valueAdvectionMaterial.valueMap }] = valueRenderTargets;
		[valueRenderTargets[0], valueRenderTargets[1]] = [
			valueRenderTargets[1],
			valueRenderTargets[0],
		];
		renderer.setRenderTarget(valueRenderTargets[0]);
		renderer.render(valueAdvectionScene, passCamera);
	}

	renderDisplacement(
		/** @type {WebGLRenderer} */ renderer,
		/** @type {WebGLRenderTarget} */ inputBuffer,
		/** @type {WebGLRenderTarget | null} */ outputBuffer,
	) {
		const {
			passCamera,

			velocityRenderTargets,

			displacementMaterial,
			displacementScene,

			renderToScreen,
		} = this;

		({ texture: displacementMaterial.baseMap } = inputBuffer);
		[{ texture: displacementMaterial.displacementMap }] =
			velocityRenderTargets;
		renderer.setRenderTarget(renderToScreen ? null : outputBuffer);
		renderer.render(displacementScene, passCamera);
	}
}
