in vec2 vUv;

uniform float deltaTime;
uniform sampler2D valueMap;
uniform sampler2D velocityMap;
uniform float decay;

out vec4 fragColor;

void main() {
	vec2 uv = vUv;
	vec2 prevUv = fract(uv - (deltaTime / 1000.) * texture(velocityMap, uv).xy);

	fragColor = texture(valueMap, prevUv) * (1.0 - decay);
}