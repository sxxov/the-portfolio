import { radToDeg } from '/+std/math/radToDeg.js';

export function getFocalLengthFov(
	/** @type {number} */ focalLength,
	/** @type {number} */ sensorHeight = 36,
) {
	const fovRadians = 2 * Math.atan(sensorHeight / (2 * focalLength));
	return radToDeg(fovRadians);
}
