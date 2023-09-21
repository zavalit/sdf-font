#version 300 es
#define DEBUG 1


precision highp float;

in vec2 vGlyphUV;
in vec2 vUV;

uniform vec2 uResolution;
uniform sampler2D uTexture0;
uniform vec3 uColor;
uniform float uTime;


out vec4 fragColor;

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

void main() {

    vec4 rgba = texture(uTexture0, vGlyphUV);

    float d = noise(vec2(fwidth(rgba.a) * .000000001, uTime * .01)) * .2;
    d = fwidth(rgba.a);
    float b = .5;
    float beta = smoothstep(b - d, b + d, rgba.a);

    
    vec3 color;

    color = mix(color, uColor, beta);

    //color = vec3(rgba.a);
  
    fragColor = vec4(color, beta);
  
}