uniform sampler2D baseMap;
uniform vec2 baseTiling;
uniform sampler2D displacementMap;
uniform vec2 displacementTiling;
uniform float strength;

in vec2 vUv;

out vec4 fragColor;

void main() {
	vec2 uv = vUv;

	// sample RG displacement (assume 0..1 each)
	vec2 displacementUv = uv * displacementTiling;
	vec2 displacement = texture(displacementMap, displacementUv).xy;

	// sample base with warped UV
	vec2 warpedUv = uv * baseTiling + displacement * strength;
	vec4 base = texture(baseMap, warpedUv);

	fragColor = base;
	// fragColor = vec4(displacement, 0.0, 1.0);
}