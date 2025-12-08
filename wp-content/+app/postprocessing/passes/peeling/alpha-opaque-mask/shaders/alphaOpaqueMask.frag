uniform sampler2D source;

in vec2 vUv;

out vec4 fragColor;

void main() {
	vec4 color = texture(source, vUv);
	if (color.a < 1.)
		discard;

	fragColor = vec4(1.);
}
