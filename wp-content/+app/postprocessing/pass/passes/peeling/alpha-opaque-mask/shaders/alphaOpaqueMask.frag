uniform sampler2D source;

in vec2 vUv;

void main() {
	vec4 color = texture(source, vUv);
	if (color.a < 1.)
		discard;

	gl_FragColor = vec4(1.);
}
