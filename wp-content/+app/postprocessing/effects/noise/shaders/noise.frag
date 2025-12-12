#ifdef _
uniform float time;
#define rand(uv) 0.
#endif

void mainImage(const in vec4 inputColor, const in vec2 uv,
			   out vec4 outputColor) {

#ifdef static
	float offset = 1.;
#else
	float offset = 1. + time;
#endif

#ifdef monochrome
	vec3 noise = vec3(rand(uv * offset));
#else
	vec3 noise = vec3(rand(uv * offset), rand(uv * offset + 31.416),
					  rand(uv * offset + 63.832));
#endif

#ifdef premultiply
	outputColor = vec4(min(inputColor.rgb * noise, vec3(1.0)), inputColor.a);
#else
	outputColor = vec4(noise, inputColor.a);
#endif
}