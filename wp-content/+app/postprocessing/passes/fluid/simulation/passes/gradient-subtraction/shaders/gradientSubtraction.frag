in vec2 vUv;

uniform sampler2D velocityMap;
uniform sampler2D pressureMap;

out vec4 fragColor;

void main() {
	vec2 uv = vUv;
	vec2 texelSize = vec2(dFdx(uv.x), dFdy(uv.y));

	float x0 = texture(pressureMap, uv - vec2(texelSize.x, 0)).x;
	float x1 = texture(pressureMap, uv + vec2(texelSize.x, 0)).x;
	float y0 = texture(pressureMap, uv - vec2(0, texelSize.y)).x;
	float y1 = texture(pressureMap, uv + vec2(0, texelSize.y)).x;

	vec2 v = texture(velocityMap, uv).xy;
	v -= 0.5 * vec2(x1 - x0, y1 - y0);

	fragColor = vec4(v, 0.0, 1.0);
}