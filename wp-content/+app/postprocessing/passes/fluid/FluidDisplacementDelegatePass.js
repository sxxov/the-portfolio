import { Pass } from 'postprocessing';
/** @import { WebGLRenderer, WebGLRenderTarget } from "three" */
/** @import { FluidDisplacementPass } from "./FluidDisplacementPass.js" */

export class FluidDisplacementDelegatePass extends Pass {
	constructor(/** @type {FluidDisplacementPass} */ fluidDisplacementPass) {
		super(FluidDisplacementDelegatePass.name);
		this.fluidDisplacementPass = fluidDisplacementPass;
	}

	/** @override */
	render(
		/** @type {WebGLRenderer} */ renderer,
		/** @type {WebGLRenderTarget | null} */ inputBuffer,
		/** @type {WebGLRenderTarget | null} */ outputBuffer,
	) {
		if (!inputBuffer) return;

		const { fluidDisplacementPass } = this;
		fluidDisplacementPass.renderDisplacement(
			renderer,
			inputBuffer,
			outputBuffer,
		);
	}
}
