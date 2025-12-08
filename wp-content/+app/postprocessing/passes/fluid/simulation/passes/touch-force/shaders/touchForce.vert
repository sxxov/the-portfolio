out vec2 vUv;
out vec2 vUvScaled;

uniform vec2 aspect;

void main() {
	vUv = position.xy * 0.5 + 0.5;
	vUvScaled = position.xy * aspect * 0.5 + aspect * 0.5;
	gl_Position = vec4(position.xy, 1.0, 1.0);
}