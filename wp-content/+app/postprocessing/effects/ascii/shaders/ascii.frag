#ifdef _
const int charCount = 1;
uniform sampler2D inputBuffer;
#define colorBySpriteIndex(index, uv) vec4(0.)
#endif

uniform sampler2D charSprites[charCount];
uniform vec2 charSize;
uniform vec2 charSpriteSize;
uniform vec2 cellSize;
uniform float gap;

void mainImage(const in vec4 inputColor, const in vec2 uv,
			   out vec4 outputColor) {
	vec2 fragCoord = uv * resolution;

	vec2 cellOrigin = floor(fragCoord / cellSize) * cellSize;
	vec2 sampleUv = (cellOrigin + cellSize * 0.5) / resolution;

	float luminance =
		dot(texture(inputBuffer, sampleUv).rgb, vec3(0.299, 0.587, 0.114));
	int spriteIndex = int(
		clamp(floor(luminance * float(charCount)), 0.0, float(charCount - 1)));

	vec2 spriteUv = (fragCoord - cellOrigin) / cellSize;
	outputColor = colorBySpriteIndex(spriteIndex, spriteUv);
}
