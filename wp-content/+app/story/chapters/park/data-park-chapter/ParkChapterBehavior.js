import { ParkMapBehavior } from '../data-park-map/ParkMapBehavior.js';
import cameraGlb from './assets/models/camera.glb.js';
import { ParkChapterOrbitLayerBehavior } from './layers/01-orbit/ParkChapterOrbitLayerBehavior.js';
import { ParkChapterFluidDisplacementLayerBehavior } from './layers/02-fluid-displacement/ParkChapterFluidDisplacementLayerBehavior.js';
import { ParkChapterParkLayerBehavior } from './layers/03-park/ParkChapterParkLayerBehavior.js';
import { ParkChapterOverlayLayerBehavior } from './layers/04-overlay/ParkChapterOverlayLayerBehavior.js';
import { ParkChapterAuxLayerBehavior } from './layers/05-aux/ParkChapterAuxLayerBehavior.js';
import { ParkChapterCompositeLayerBehavior } from './layers/06-composite/ParkChapterCompositeLayerBehavior.js';
import { ParkChapterContainer } from './ParkChapterContainer.js';
import { AssetPriority } from '/+app/delivery/asset/AssetPriority.js';
import { CameraAnimation } from '/+app/model/CameraAnimation.js';
import { requestGltf } from '/+app/model/gltf.js';
import { OrchestratorChapterBehavior } from '/+app/story/orchestrator/data-orchestrator-chapter/OrchestratorChapterBehavior.js';
import { OrchestratorBehavior } from '/+app/story/orchestrator/data-orchestrator/OrchestratorBehavior.js';
import { TheatreSheetBehavior } from '/+app/theatre/data-theatre-sheet/TheatreSheetBehavior.js';
import { attachBehavior, behavior } from '/+std/behavioral/behavior.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { ParkWaypointContext } from "../data-park-waypoint/ParkWaypointContext.js" */
/** @import { ParkChapterFluidDisplacementContext } from "./layers/02-fluid-displacement/ParkChapterFluidDisplacementContext.js" */
/** @import { ParkChapterParkContext } from "./layers/03-park/ParkChapterParkContext.js" */
/** @import { ParkChapterOverlayContext } from "./layers/04-overlay/ParkChapterOverlayContext.js" */
/** @import { ParkChapterAuxContext } from "./layers/05-aux/ParkChapterAuxContext.js" */

const { asset: cameraAsset } = requestGltf(cameraGlb, {
	priority: AssetPriority.High,
});

export const ParkChapterBehavior = behavior(
	'park-chapter',
	class {
		layers = new Signal({
			fluidDisplacement:
				/** @type {ParkChapterFluidDisplacementContext | undefined} */ (
					undefined
				),
			park: /** @type {ParkChapterParkContext | undefined} */ (undefined),
			overlay: /** @type {ParkChapterOverlayContext | undefined} */ (
				undefined
			),
			aux: /** @type {ParkChapterAuxContext | undefined} */ (undefined),
		});
		waypointContexts = new Signal(
			new /** @type {typeof Set<ParkWaypointContext>} */ (Set)(),
		);
	},
	(element, {}, { getContext, registerLocalBehaviors }) => {
		registerLocalBehaviors(ParkMapBehavior);

		return subscribe(
			{
				orchestrator: getContext(OrchestratorBehavior),
				orchestratorChapter: getContext(OrchestratorChapterBehavior),
				theatreSheet: getContext(TheatreSheetBehavior),
			},
			({ $orchestrator, $orchestratorChapter, $theatreSheet }) => {
				if (!$orchestrator || !$orchestratorChapter || !$theatreSheet)
					return;

				const _ = bin();

				const { seek } = $theatreSheet;
				const { progress } = $orchestratorChapter;

				layers: {
					_._ = attachBehavior(
						element,
						ParkChapterOrbitLayerBehavior,
					);
					_._ = attachBehavior(
						element,
						ParkChapterFluidDisplacementLayerBehavior,
					);
					_._ = attachBehavior(element, ParkChapterParkLayerBehavior);
					_._ = attachBehavior(
						element,
						ParkChapterOverlayLayerBehavior,
					);
					_._ = attachBehavior(element, ParkChapterAuxLayerBehavior);
					_._ = attachBehavior(
						element,
						ParkChapterCompositeLayerBehavior,
					);
				}

				container: {
					const container = derive(
						{ cameraAsset },
						({ $cameraAsset }) => {
							if (!$cameraAsset) return;

							return new ParkChapterContainer(
								new CameraAnimation($cameraAsset),
							);
						},
					);
					_._ = subscribe({ container }, ({ $container }) => {
						if (!$container) return;

						$orchestratorChapter.chapterContainer.set($container);
					});
				}

				theatre: { _._ = progress.subscribe(seek); }

				return _;
			},
		);
	},
);
