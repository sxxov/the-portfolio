uniform int luminanceCount;

const int bayer4[16] =
	int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);

float bayerThreshold(vec2 fragCoord) {
	// integer coordinates modulo 4
	ivec2 p = ivec2(mod(floor(fragCoord), 4.0));
	int idx = p.y * 4 + p.x;
	float v = float(bayer4[idx]);
	// +0.5 to center thresholds between levels (optional)
	return (v + 0.5) / 16.0;
}

float ditherChannel(float color, float threshold, int levelCount) {
	// levels = 4 → indices 0,1,2,3
	float lastLevel = float(levelCount - 1);
	float scaled = color * lastLevel;
	float baseLevel = floor(scaled); // 0..L
	float frac = scaled - baseLevel; // 0..1

	float lvl = baseLevel;
	// if we're above the local threshold, bump up 1 level (if possible)
	if (frac > threshold && baseLevel < lastLevel)
		lvl += 1.0;

	// back to [0,1]
	return lvl / lastLevel;
}

void mainImage(const in vec4 inputColor, const in vec2 uv,
			   out vec4 outputColor) {
	vec4 color = inputColor;
	vec2 fragCoord = uv * resolution;

	float baseThreshold = bayerThreshold(fragCoord);
	// decorrelate channels slightly by offsetting threshold
	vec3 decorrelatedThreshold = vec3(fract(baseThreshold + 0.0),  //
									  fract(baseThreshold + 0.33), //
									  fract(baseThreshold + 0.67)  //
	);

	float r = ditherChannel(color.r, decorrelatedThreshold.r, luminanceCount);
	float g = ditherChannel(color.g, decorrelatedThreshold.g, luminanceCount);
	float b = ditherChannel(color.b, decorrelatedThreshold.b, luminanceCount);

	outputColor = vec4(r, g, b, color.a);
}