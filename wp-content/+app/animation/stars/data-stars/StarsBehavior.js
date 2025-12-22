import { behavior, t } from '/+std/behavioral/behavior.js';
import { setAttributes } from '/+std/dom/setAttributes.js';
import { watchElementIntersecting } from '/+std/dom/watchElementIntersecting.js';
import { watchElementSize } from '/+std/dom/watchElementSize.js';
import { some } from '/+std/functional/some.js';
import { bin, derive } from '/+std/signal/Signal.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

let incrementalId = 0;
export const StarsBehavior = behavior(
	'stars',
	class {
		count = t.number.default(1_000);
	},
	(element, { count }, {}) => {
		const _ = bin();
		const id = incrementalId++;

		const fadeDurationSeconds = 0.6;
		const fadeStaggerSeconds = 0.05;

		const intersecting = watchElementIntersecting(element);
		const size = watchElementSize(element);
		const aspects = derive({ size }, ({ $size: { width, height } }) => {
			if (!some(width) || !some(height)) return { x: 1, y: 1 };
			return (
				width > height ? { x: width / height, y: 1 }
				: width < height ? { x: 1, y: height / width }
				: { x: 1, y: 1 }
			);
		});

		const svgIntrinsicWidth = 100;
		const svgIntrinsicHeight = 100;
		const svg = (() => {
			const it = document.createElementNS(SVG_NS, 'svg');
			setAttributes(it, {
				width: '100%',
				height: '100%',
				viewBox: `0 0 ${svgIntrinsicWidth} ${svgIntrinsicHeight}`,
				preserveAspectRatio: 'xMidYMid slice',
			});
			return it;
		})();
		add: { element.append(svg); }
		remove: _._ = () => { svg.remove(); };

		const glowId = `star-glow-${id}`;
		const shimmerId = `star-shimmer-${id}`;
		const defs = (() => {
			const it = document.createElementNS(SVG_NS, 'defs');
			const glow = (() => {
				const it = document.createElementNS(SVG_NS, 'filter');
				setAttributes(it, { id: glowId });

				const feDropShadow = (() => {
					const it = document.createElementNS(SVG_NS, 'feDropShadow');
					setAttributes(it, {
						stdDeviation: '1',
						'flood-color': 'white',
						'flood-opacity': '1',
						dx: '0',
						dy: '0',
					});
					return it;
				})();
				it.append(feDropShadow);

				return it;
			})();
			it.append(glow);

			const shimmer = (() => {
				const it = document.createElementNS(SVG_NS, 'filter');
				setAttributes(it, { id: shimmerId });

				const baseFrequencyMin = 0.6 + Math.random() * 0.1;
				const baseFrequencyMax =
					baseFrequencyMin + 0.2 + Math.random() * 0.1;
				const scaleMin = 1 + Math.random() * 0.5;
				const scaleMax = scaleMin + 1 + Math.random() * 1.5;

				const feTurbulence = (() => {
					const it = document.createElementNS(SVG_NS, 'feTurbulence');
					setAttributes(it, {
						type: 'fractalNoise',
						baseFrequency: (
							(baseFrequencyMin + baseFrequencyMax) /
							2
						).toFixed(2),
						numOctaves: '1',
						result: 'turbulence',
						seed: Math.round(Math.random() * 10_000).toString(),
					});

					return it;
				})();
				it.append(feTurbulence);

				const feDisplacementMap = (() => {
					const it = document.createElementNS(
						SVG_NS,
						'feDisplacementMap',
					);
					setAttributes(it, {
						in2: 'turbulence',
						in: 'SourceGraphic',
						scale: ((scaleMin + scaleMax) / 2).toFixed(2),
						xChannelSelector: 'R',
						yChannelSelector: 'G',
					});

					return it;
				})();
				it.append(feDisplacementMap);

				return it;
			})();
			it.append(shimmer);

			return it;
		})();
		// svg.append(defs);

		const stars = derive(
			{ count, intersecting, aspects },
			({ $count, $intersecting, $aspects }) => {
				if (!$intersecting) return;

				return Array.from({ length: $count }, (_, i) => {
					const group = document.createElementNS(SVG_NS, 'g');

					const circle = (() => {
						const it = document.createElementNS(SVG_NS, 'circle');

						const cx =
							Math.random() * svgIntrinsicWidth * $aspects.x;
						const cy =
							Math.random() * svgIntrinsicHeight * $aspects.y;
						const r = Math.random() * 0.05 + 0.05;
						const opacity =
							Math.random() * 0.8 +
							0.2 * (Math.random() < 0.1 ? 0.5 : 1);
						const amplitude = Math.min(opacity * 0.6, 0.4);
						const minOpacity = Math.max(0, opacity - amplitude);
						const maxOpacity = Math.min(1, opacity + amplitude);
						const frequencyHz = 0.15 + Math.random() * 0.85;
						const durationSeconds = 1 / frequencyHz;
						const phaseOffsetSeconds =
							Math.random() * durationSeconds * 0.1;
						const fadeDelaySeconds = i * fadeStaggerSeconds;
						const shimmerStartSeconds =
							fadeDelaySeconds +
							fadeDurationSeconds +
							phaseOffsetSeconds;

						setAttributes(it, {
							cx,
							cy,
							r,
							fill: 'white',
							// style: {
							// 	filter: `url(#${glowId}) url(#${shimmerId})`,
							// },
						});

						it.animate([{ opacity: 0 }, { opacity: minOpacity }], {
							duration: fadeDurationSeconds * 1000,
							delay: fadeDelaySeconds * 1000,
							fill: 'both',
							easing: 'ease-in-out',
						});

						it.animate(
							[
								{
									opacity: minOpacity,
									offset: 0,
									easing: 'cubic-bezier(0.42, 0, 0.58, 1)',
								},
								{
									opacity: maxOpacity,
									offset: 0.5,
									easing: 'cubic-bezier(0.42, 0, 0.58, 1)',
								},
								{ opacity: minOpacity, offset: 1 },
							],
							{
								duration: durationSeconds * 1000,
								delay: shimmerStartSeconds * 1000,
								iterations: Infinity,
							},
						);

						return it;
					})();
					group.append(circle);

					return group;
				});
			},
		);
		_._ = stars.subscribe(($stars) => {
			if (!$stars) return;

			svg.append(...$stars);
			return () => { for (const star of $stars) { star.remove(); } };
		});

		return _;
	},
);
