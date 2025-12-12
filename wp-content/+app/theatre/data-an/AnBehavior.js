import { TheatreSheetBehavior } from '../data-theatre-sheet/TheatreSheetBehavior.js';
import { StyleBlurTheatreSchema } from '../schemas/style/StyleBlurTheatreSchema.js';
import { StyleBrightnessContrastTheatreSchema } from '../schemas/style/StyleBrightnessContrastTheatreSchema.js';
import { StyleCenterFillTheatreSchema } from '../schemas/style/StyleCenterFillTheatreSchema.js';
import { StyleClipFillTheatreSchema } from '../schemas/style/StyleClipFillTheatreSchema.js';
import { StyleClipTheatreSchema } from '../schemas/style/StyleClipTheatreSchema.js';
import { StyleHueSaturationLightnessTheatreSchema } from '../schemas/style/StyleHueSaturationLightnessTheatreSchema.js';
import { StyleOpacityTheatreSchema } from '../schemas/style/StyleOpacityTheatreSchema.js';
import { StyleScaleFillTheatreSchema } from '../schemas/style/StyleScaleFillTheatreSchema.js';
import { StyleTransformPositionRelativeTheatreSchema } from '../schemas/style/StyleTransformPositionRelativeTheatreSchema.js';
import { StyleTransformPositionTheatreSchema } from '../schemas/style/StyleTransformPositionTheatreSchema.js';
import { StyleTransformRotationTheatreSchema } from '../schemas/style/StyleTransformRotationTheatreSchema.js';
import { StyleTransformScaleNonUniformTheatreSchema } from '../schemas/style/StyleTransformScaleNonUniformTheatreSchema.js';
import { StyleTransformScaleUniformTheatreSchema } from '../schemas/style/StyleTransformScaleUniformTheatreSchema.js';
import { StyleVisibilityTheatreSchema } from '../schemas/style/StyleVisibilityTheatreSchema.js';
import { StyleZIndexTheatreSchema } from '../schemas/style/StyleZIndexTheatreSchema.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { setStyles } from '/+std/dom/setStyles.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { some } from '/+std/functional/some.js';
import { lerp } from '/+std/math/lerp.js';
import { bin, subscribe } from '/+std/signal/Signal.js';
import { cast } from '/+std/type/utilities/cast.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';

export const AnBehavior = behavior(
	'an',
	class {
		'' = t.string;

		transform = t.boolean;
		transform3d = t.boolean;
		transformPositionRelative = t.boolean;
		transformScaleNonUniform = t.boolean;

		scaleFill = t.boolean;
		clip = t.boolean;
		clipFill = t.boolean;
		centerFill = t.boolean;

		opacity = t.boolean;
		visibility = t.boolean;

		blur = t.boolean;
		brightnessContrast = t.boolean;
		hueSaturationLightness = t.boolean;

		zIndex = t.boolean;
	},
	(element, { '': name, ...switches }, { getContext }) =>
		subscribe({ sheet: getContext(TheatreSheetBehavior) }, ({ $sheet }) => {
			if (!$sheet) return;

			const _ = bin();
			const { attach } = $sheet;

			const rect = watchElementRect(element);

			_._ = subscribe(
				{
					name,
					rect,
					viewportSize,
					...switches,
				},
				({
					$name,
					$rect: { x, y, width, height },
					$viewportSize: { width: vw, height: vh },

					$transform,
					$transform3d,
					$transformPositionRelative,
					$transformScaleNonUniform,

					$scaleFill,
					$clip,
					$clipFill,
					$centerFill,

					$opacity,
					$visibility,

					$blur,
					$brightnessContrast,
					$hueSaturationLightness,

					$zIndex,
					// eslint-disable-next-line complexity
				}) => {
					if (!$name) return;

					const _ = bin();
					const d = $transform3d ? 3 : 2;

					const value = attach($name, {
						...(($transform || $transform3d) &&
							new StyleTransformPositionTheatreSchema(d)),
						...(($transform || $transform3d) &&
							new StyleTransformRotationTheatreSchema(d)),
						...(($transform || $transform3d) &&
							!$transformScaleNonUniform &&
							new StyleTransformScaleUniformTheatreSchema()),
						...($transformScaleNonUniform &&
							new StyleTransformScaleNonUniformTheatreSchema(d)),
						...($transformPositionRelative &&
							new StyleTransformPositionRelativeTheatreSchema(d)),
						...($scaleFill && new StyleScaleFillTheatreSchema()),
						...($clip && new StyleClipTheatreSchema()),
						...($clipFill && new StyleClipFillTheatreSchema()),
						...($centerFill && new StyleCenterFillTheatreSchema()),

						...($opacity && new StyleOpacityTheatreSchema()),
						...($visibility && new StyleVisibilityTheatreSchema()),

						...($blur && new StyleBlurTheatreSchema()),
						...($brightnessContrast &&
							new StyleBrightnessContrastTheatreSchema()),
						...($hueSaturationLightness &&
							new StyleHueSaturationLightnessTheatreSchema()),

						...($zIndex && new StyleZIndexTheatreSchema()),
					});
					/**
					 * @typedef {NonNullable<
					 * 	ReturnType<(typeof value)['get']>
					 * >} Value
					 */
					setStyles(element, {
						willChange: [
							...((
								$transform ||
								$transform3d ||
								$transformPositionRelative ||
								$transformScaleNonUniform ||
								$scaleFill
							) ?
								['transform']
							:	[]),
							...($clip ? ['clip-path'] : []),
							...($opacity ? ['opacity'] : []),
							...((
								$blur ||
								$brightnessContrast ||
								$hueSaturationLightness
							) ?
								['filter']
							:	[]),
						].join(', '),
					});
					const transform = {
						position: { x: 0, y: 0, z: 0 },
						positionRelative: { x: 0, y: 0, z: 0 },
						rotation: { x: 0, y: 0, z: 0 },
						scale: { x: 1, y: 1, z: 1 },
					};
					const appearance = {
						visibility:
							/** @type {NonNullable<Value['visibility']>} */ (
								'visible'
							),
						opacity: 1,
					};
					const filter = {
						blur: 0,
						brightness: 100,
						contrast: 100,
						hue: 0,
						saturation: 100,
						lightness: 100,
					};
					const clip = {
						tl: { x: 0, y: 0 },
						tr: { x: 0, y: 0 },
						bl: { x: 0, y: 0 },
						br: { x: 0, y: 0 },
					};
					const clipInset = { left: 0, right: 0, top: 0, bottom: 0 };
					const layout = { zIndex: 0 };

					// eslint-disable-next-line complexity
					_._ = value.subscribe((it) => {
						if (!it) return;

						let positionEnabled = false;
						let positionRelativeEnabled = false;
						let rotationEnabled = false;
						let scaleEnabled = false;
						let visibilityEnabled = false;
						let opacityEnabled = false;
						let clipEnabled = false;
						let clipInsetEnabled = false;
						let blurEnabled = false;
						let brightnessContrastEnabled = false;
						let hueSaturationLightnessEnabled = false;
						let zIndexEnabled = false;

						transform: {
							if (!$transform && !$transform3d) break transform;

							position: {
								const { position } = it;
								if (!some(position)) break position;
								positionEnabled = true;

								switch (d) {
									case 2: {
										/**
										 * @type {typeof cast<{
										 * 	x: number;
										 * 	y: number;
										 * }>}
										 */ (cast)(position);
										const { x, y } = position;
										transform.position.x = x;
										transform.position.y = y;
										break;
									}
									case 3: {
										/**
										 * @type {typeof cast<{
										 * 	x: number;
										 * 	y: number;
										 * 	z: number;
										 * }>}
										 */ (cast)(position);
										const { x, y, z } = position;
										transform.position.x = x;
										transform.position.y = y;
										transform.position.z = z;
										break;
									}
								}
							}

							rotation: {
								const { rotation } = it;
								if (!some(rotation)) break rotation;
								rotationEnabled = true;

								switch (d) {
									case 2:
										/** @type {typeof cast<number>} */ (
											cast
										)(rotation);
										transform.rotation.z = rotation;
										break;
									case 3: {
										/**
										 * @type {typeof cast<{
										 * 	x: number;
										 * 	y: number;
										 * 	z: number;
										 * }>}
										 */ (cast)(rotation);
										const { x, y, z } = rotation;
										transform.rotation.x = x;
										transform.rotation.y = y;
										transform.rotation.z = z;
										break;
									}
								}
							}

							scale: {
								const { scaleUniform } = it;
								if (!some(scaleUniform)) break scale;
								scaleEnabled = true;

								transform.scale.x = scaleUniform / 100;
								transform.scale.y = scaleUniform / 100;
								transform.scale.z = scaleUniform / 100;
							}
						}

						positionRelative: {
							if (!$transformPositionRelative)
								break positionRelative;
							positionRelativeEnabled = true;

							const { positionRelative } = it;
							if (!some(positionRelative)) break positionRelative;

							switch (d) {
								case 2: {
									/**
									 * @type {typeof cast<{
									 * 	x: number;
									 * 	y: number;
									 * }>}
									 */ (cast)(positionRelative);
									const { x, y } = positionRelative;
									transform.positionRelative.x = x;
									transform.positionRelative.y = y;
									break;
								}
								case 3: {
									/**
									 * @type {typeof cast<{
									 * 	x: number;
									 * 	y: number;
									 * 	z: number;
									 * }>}
									 */ (cast)(positionRelative);
									const { x, y, z } = positionRelative;
									transform.positionRelative.x = x;
									transform.positionRelative.y = y;
									transform.positionRelative.z = z;
									break;
								}
							}
						}

						scaleNonUniform: {
							if (!$transformScaleNonUniform)
								break scaleNonUniform;
							scaleEnabled = true;

							const { scaleNonUniform } = it;
							if (!some(scaleNonUniform)) break scaleNonUniform;

							switch (d) {
								case 2: {
									/**
									 * @type {typeof cast<{
									 * 	x: number;
									 * 	y: number;
									 * }>}
									 */ (cast)(scaleNonUniform);
									const { x, y } = scaleNonUniform;
									transform.scale.x = x / 100;
									transform.scale.y = y / 100;
									break;
								}
								case 3: {
									/**
									 * @type {typeof cast<{
									 * 	x: number;
									 * 	y: number;
									 * 	z: number;
									 * }>}
									 */ (cast)(scaleNonUniform);
									const { x, y, z } = scaleNonUniform;
									transform.scale.x = x / 100;
									transform.scale.y = y / 100;
									transform.scale.z = z / 100;
									break;
								}
							}
						}

						visibility: {
							if (!$visibility) break visibility;
							visibilityEnabled = true;

							const { visibility } = it;
							if (!some(visibility)) break visibility;

							appearance.visibility = visibility;
						}

						opacity: {
							if (!$opacity) break opacity;
							opacityEnabled = true;

							const { opacity } = it;
							if (!some(opacity)) break opacity;

							appearance.opacity = opacity / 100;

							if (
								opacity <= 0 &&
								appearance.visibility === 'visible'
							)
								appearance.visibility = 'hidden';
						}

						blur: {
							if (!$blur) break blur;
							blurEnabled = true;

							const { blur } = it;
							if (!some(blur)) break blur;

							filter.blur = blur;
						}

						brightnessContrast: {
							if (!$brightnessContrast) break brightnessContrast;
							brightnessContrastEnabled = true;

							const { brightnessContrast } = it;
							if (!some(brightnessContrast))
								break brightnessContrast;

							const { brightness, contrast } = brightnessContrast;
							filter.brightness = brightness;
							filter.contrast = contrast;
						}

						hueSaturationLightness: {
							if (!$hueSaturationLightness)
								break hueSaturationLightness;
							hueSaturationLightnessEnabled = true;

							const { hueSaturationLightness } = it;
							if (!some(hueSaturationLightness))
								break hueSaturationLightness;

							const { hue, saturation, lightness } =
								hueSaturationLightness;
							filter.hue = hue;
							filter.saturation = saturation;
							filter.lightness = lightness;
						}

						clip: {
							if (!$clip) break clip;
							clipEnabled = true;

							const { clip } = it;
							if (!some(clip)) break clip;

							const { tl, tr, bl, br } = clip;
							clip.tl = tl;
							clip.tr = tr;
							clip.bl = bl;
							clip.br = br;
						}

						clipInset: {
							if (!$scaleFill && !$clipFill && !$centerFill)
								break clipInset;
							clipInsetEnabled = true;

							clipInset.left = 0;
							clipInset.right = 0;
							clipInset.top = 0;
							clipInset.bottom = 0;

							centerize: {
								const { scaleFill, clipFill, centerFill } = it;
								if (
									!some(scaleFill) &&
									!some(clipFill) &&
									!some(centerFill)
								)
									break centerize;

								const progress =
									Math.max(
										scaleFill ?? -Infinity,
										clipFill ?? -Infinity,
										centerFill ?? -Infinity,
									) / 100;

								if (
									!some(x) ||
									!some(y) ||
									!some(width) ||
									!some(height)
								)
									break centerize;
								const targetPositionX =
									(vw / 2 - (x + width / 2)) / (vw / 100);
								const targetPositionY =
									(vh / 2 - (y + height / 2)) / (vh / 100);
								transform.position.x = lerp(
									progress,
									transform.position.x,
									targetPositionX,
								);
								transform.position.y = lerp(
									progress,
									transform.position.y,
									targetPositionY,
								);
							}

							scaleFill: {
								if (!$scaleFill) break scaleFill;

								const { scaleFill } = it;
								if (!some(scaleFill)) break scaleFill;

								const progress = scaleFill / 100;
								if (!some(width) || !some(height))
									break scaleFill;

								const targetScaleX = vw / width;
								const targetScaleY = vh / height;
								const targetScale = Math.max(
									targetScaleX,
									targetScaleY,
								);
								transform.scale.x = lerp(
									progress,
									transform.scale.x,
									targetScale,
								);
								transform.scale.y = lerp(
									progress,
									transform.scale.y,
									targetScale,
								);

								scaleFillClip: {
									const { scaleFillClip } = it;
									if (!scaleFillClip) break scaleFillClip;

									const targetWidth = width * targetScale;
									const targetHeight = height * targetScale;
									const targetClipX =
										(targetWidth - vw) /
										2 /
										transform.scale.x /
										(vw / 100);
									const targetClipY =
										(targetHeight - vh) /
										2 /
										transform.scale.y /
										(vh / 100);
									clipInset.left += lerp(
										progress,
										0,
										targetClipX,
									);
									clipInset.right += lerp(
										progress,
										0,
										targetClipX,
									);
									clipInset.top += lerp(
										progress,
										0,
										targetClipY,
									);
									clipInset.bottom += lerp(
										progress,
										0,
										targetClipY,
									);
								}
							}

							clipFill: {
								if (!$clipFill) break clipFill;

								const { clipFill } = it;
								if (!some(clipFill)) break clipFill;

								const progress = clipFill / 100;
								if (!some(width) || !some(height))
									break clipFill;

								const targetWidth = vw;
								const targetHeight = vh;
								const targetClipX =
									(targetWidth - width) / 2 / (vw / 100);
								const targetClipY =
									(targetHeight - height) / 2 / (vh / 100);
								clipInset.left += lerp(
									progress,
									0,
									-targetClipX,
								);
								clipInset.right += lerp(
									progress,
									0,
									-targetClipX,
								);
								clipInset.top += lerp(
									progress,
									0,
									-targetClipY,
								);
								clipInset.bottom += lerp(
									progress,
									0,
									-targetClipY,
								);
							}
						}

						zIndex: {
							if (!$zIndex) break zIndex;
							zIndexEnabled = true;

							const { zIndex } = it;
							if (!some(zIndex)) break zIndex;

							layout.zIndex = zIndex;
						}

						applyTransform: {
							if (
								!positionEnabled &&
								!positionRelativeEnabled &&
								!rotationEnabled &&
								!scaleEnabled
							)
								break applyTransform;

							switch (d) {
								case 2:
									setStyles(element, {
										transformStyle: '',
										transform: [
											...(positionEnabled ?
												[
													`translateX(calc(${
														positionEnabled ?
															transform.position.x
														:	0
													} * var(--1w, 1lvw) + ${
														(
															positionRelativeEnabled
														) ?
															transform
																.positionRelative
																.x
														:	0
													}%))`,
													`translateY(calc(${
														positionEnabled ?
															transform.position.y
														:	0
													} * var(--1h, 1lvh) + ${
														(
															positionRelativeEnabled
														) ?
															transform
																.positionRelative
																.y
														:	0
													}%))`,
												]
											:	[]),
											...(rotationEnabled ?
												[
													`rotate(${transform.rotation.z}deg)`,
												]
											:	[]),
											...(scaleEnabled ?
												[
													`scaleX(${transform.scale.x})`,
													`scaleY(${transform.scale.y})`,
												]
											:	[]),
										].join(' '),
									});
									break;
								case 3:
									setStyles(element, {
										transformStyle: 'preserve-3d',
										transform: [
											...((
												positionEnabled ||
												positionRelativeEnabled
											) ?
												[
													`translateX(calc(${
														positionEnabled ?
															transform.position.x
														:	0
													}lvw + ${
														(
															positionRelativeEnabled
														) ?
															transform
																.positionRelative
																.x
														:	0
													}%))`,
													`translateY(calc(${
														positionEnabled ?
															transform.position.y
														:	0
													}lvh + ${
														(
															positionRelativeEnabled
														) ?
															transform
																.positionRelative
																.y
														:	0
													}%))`,
													`translateZ(calc(${
														positionEnabled ?
															transform.position.z
														:	0
													}px))`,
												]
											:	[]),
											...(rotationEnabled ?
												[
													`rotateX(${transform.rotation.x}deg)`,
													`rotateY(${transform.rotation.y}deg)`,
													`rotateZ(${transform.rotation.z}deg)`,
												]
											:	[]),
											...(scaleEnabled ?
												[
													`scaleX(${transform.scale.x})`,
													`scaleY(${transform.scale.y})`,
													`scaleZ(${transform.scale.z})`,
												]
											:	[]),
										].join(' '),
									});
									break;
							}
						}

						applyOpacity: {
							if (!opacityEnabled) break applyOpacity;

							setStyles(element, {
								opacity: `${appearance.opacity}`,
							});
						}

						applyVisibility: {
							if (!visibilityEnabled) break applyVisibility;

							switch (appearance.visibility) {
								case 'visible':
									setStyles(element, {
										display: '',
										visibility: 'visible',
									});
									break;
								case 'hidden':
									setStyles(element, {
										display: '',
										visibility: 'hidden',
									});
									break;
								case 'collapse':
									setStyles(element, {
										display: 'none',
										visibility: '',
									});
									break;
							}
						}

						applyClip: {
							if (!clipEnabled || !clipInsetEnabled)
								break applyClip;

							setStyles(element, {
								clipPath: `polygon(calc(${
									clipEnabled ? clip.tl.x : 0
								}% + ${clipInsetEnabled ? clipInset.left : 0}lvw) calc(${
									clipEnabled ? clip.tl.y : 0
								}% + ${clipInsetEnabled ? clipInset.top : 0}lvh), calc(${
									clipEnabled ? clip.tr.x : 100
								}% - ${clipInsetEnabled ? clipInset.right : 0}lvw) calc(${
									clipEnabled ? clip.tr.y : 0
								}% + ${clipInsetEnabled ? clipInset.top : 0}lvh), calc(${
									clipEnabled ? clip.br.x : 100
								}% + ${clipInsetEnabled ? clipInset.left : 0}lvw) calc(${
									clipEnabled ? clip.br.y : 100
								}% - ${clipInsetEnabled ? clipInset.bottom : 0}lvh), calc(${
									clipEnabled ? clip.bl.x : 0
								}% - ${clipInsetEnabled ? clipInset.right : 0}lvw) calc(${
									clipEnabled ? clip.bl.y : 100
								}% - ${clipInsetEnabled ? clipInset.bottom : 0}lvh))`,
							});
						}

						applyFilter: {
							if (
								!blurEnabled &&
								!brightnessContrastEnabled &&
								!hueSaturationLightnessEnabled
							)
								break applyFilter;

							setStyles(element, {
								filter: [
									...(blurEnabled ?
										[`blur(${filter.blur}px)`]
									:	[]),
									...(brightnessContrastEnabled ?
										[
											`brightness(${filter.brightness}%)`,
											`contrast(${filter.contrast}%)`,
										]
									:	[]),
									...(hueSaturationLightnessEnabled ?
										[
											`hue-rotate(${filter.hue}deg)`,
											`saturate(${filter.saturation}%)`,
											`brightness(${filter.lightness}%)`,
										]
									:	[]),
								].join(' '),
							});
						}

						applyZIndex: {
							if (!zIndexEnabled) break applyZIndex;

							setStyles(element, {
								zIndex: `${layout.zIndex}`,
							});
						}
					});

					return _;
				},
			);

			return _;
		}),
);
