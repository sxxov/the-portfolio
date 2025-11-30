uniform sampler2D occluder;
uniform sampler2D background;
uniform sampler2D foreground;

uniform vec4 clearColor;

in vec2 vUv;

void blendAdd(inout vec4 dest, vec4 src) {
	dest.rgb += src.rgb * src.a;
	dest.a += src.a;
}

/** photoshop-like 'over' compositing (straight alpha output) */
void blendOver(inout vec4 dest, vec4 src) {
	dest.rgb = src.rgb + dest.rgb * (1.0 - src.a);
	dest.a = src.a + dest.a * (1.0 - src.a);
}

void main() {
	vec4 occluderColor = texture(occluder, vUv);
	vec4 backgroundColor = texture(background, vUv);
	vec4 foregroundColor = texture(foreground, vUv);

	vec4 color = clearColor;
	blendOver(color, backgroundColor);
	blendOver(color, foregroundColor);
	blendOver(color, occluderColor);

	gl_FragColor = color;
}
