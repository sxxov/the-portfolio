in vec2 vUv;

uniform float alpha;
uniform float beta;
uniform sampler2D valueMap;
uniform sampler2D divergenceMap;

out vec4 fragColor;

void main() {
	vec2 uv = vUv;
	vec2 texelSize = vec2(dFdx(uv.x), dFdy(uv.y));

	vec4 x0 = texture(valueMap, uv - vec2(texelSize.x, 0));
	vec4 x1 = texture(valueMap, uv + vec2(texelSize.x, 0));
	vec4 y0 = texture(valueMap, uv - vec2(0, texelSize.y));
	vec4 y1 = texture(valueMap, uv + vec2(0, texelSize.y));
	vec4 d = texture(divergenceMap, uv);

	fragColor = (x0 + x1 + y0 + y1 + alpha * d) * beta;
}