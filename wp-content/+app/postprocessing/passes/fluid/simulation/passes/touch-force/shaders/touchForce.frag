in vec2 vUv;
in vec2 vUvScaled;

const int touchesLength = 10;
uniform vec4[touchesLength] touches;
uniform float radius;
uniform sampler2D velocityMap;

out vec4 fragColor;

vec2 touchForce(vec4 touch, vec2 uv) {
	float d = distance(uv, touch.xy) / radius;
	float strength = 1.0 / max(d * d, 0.01);
	strength *=
		clamp(dot(normalize(uv - touch.xy), normalize(touch.zw)), 0.0, 1.0);
	return strength * touch.zw * radius;
}

void main() {
	vec2 uv = vUv;
	vec2 uvScaled = vUvScaled;

	vec4 nextForce = vec4(0.);
	for (int i = 0; i < touchesLength; i++)
		nextForce.xy += touchForce(touches[i], uvScaled);

	vec4 currentForce = texture(velocityMap, uv);
	fragColor = currentForce + nextForce;
}