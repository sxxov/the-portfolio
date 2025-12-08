in vec2 vUv;

uniform sampler2D velocityMap;

out vec4 fragColor;

void main() {
	vec2 uv = vUv;
	vec2 texelSize = vec2(dFdx(uv.x), dFdy(uv.y));

	float x0 = texture(velocityMap, uv - vec2(texelSize.x, 0)).x;
	float x1 = texture(velocityMap, uv + vec2(texelSize.x, 0)).x;
	float y0 = texture(velocityMap, uv - vec2(0, texelSize.y)).y;
	float y1 = texture(velocityMap, uv + vec2(0, texelSize.y)).y;
	float divergence = (x1 - x0 + y1 - y0) * 0.5;

	fragColor = vec4(divergence);
}