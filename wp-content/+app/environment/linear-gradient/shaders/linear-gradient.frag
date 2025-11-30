#ifndef stopCount
#define stopCount 1
#endif

uniform vec4 stopColors[stopCount];
uniform float stopPositions[stopCount];

in vec2 vUv;

out vec4 fragColor;

vec4 gradientAt(float t) {
	float clampedT = clamp(t, 0.0, 1.0);

	vec4 previousColor = stopColors[0];
	float previousPos = stopPositions[0];

	for (int i = 1; i < stopCount; i++) {
		float pos = stopPositions[i];
		vec4 color = stopColors[i];
		if (clampedT <= pos) {
			float span = max(pos - previousPos, 0.0001);
			float localT = clamp((clampedT - previousPos) / span, 0.0, 1.0);
			return mix(previousColor, color, localT);
		}

		previousColor = color;
		previousPos = pos;
	}

	return previousColor;
}

void main() {
	float t = 1.0 - vUv.y;

	vec4 color = gradientAt(t);
	fragColor = color;
}
