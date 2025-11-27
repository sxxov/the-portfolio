in vec2 vUv;

uniform sampler2D velocityMap;

out vec4 fragColor;

void main() {
	vec2 uv = vUv;
	vec2 texelSize = vec2(dFdx(uv.x), dFdy(uv.y));

	float leftEdgeMask = ceil(texelSize.x - uv.x);
	float bottomEdgeMask = ceil(texelSize.y - uv.y);
	float rightEdgeMask = ceil(uv.x - (1.0 - texelSize.x));
	float topEdgeMask = ceil(uv.y - (1.0 - texelSize.y));
	float mask = clamp(
		leftEdgeMask + bottomEdgeMask + rightEdgeMask + topEdgeMask, 0.0, 1.0);
	float direction = mix(1.0, -1.0, mask);

	fragColor = texture(velocityMap, uv) * direction;
}