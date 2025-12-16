uniform sampler2D map;

void mainImage(const in vec4 inputColor, const in vec2 uv,
			   out vec4 outputColor) {
	vec4 texel = texture(map, uv);

	// composite texel onto inputColor
	outputColor = inputColor * (1.0 - texel.a) + texel;
	// outputColor = texel;
}