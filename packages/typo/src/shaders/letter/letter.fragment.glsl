#version 300 es

precision mediump float;

out vec4 fragColor;

in vec2 vUV;
in vec2 pUV;
in vec4 vGB;
uniform sampler2D uTexture0;
uniform  highp vec2 uResolution;



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
void main () {

  float n = noise(pUV) * .002;
  vec2 border = vec2(.5);
  vec2 border2 = vec2(.5 + n * .6) + n;

  float mask = texture(uTexture0, vUV).a;
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y + d, mask);
  float edge2 = smoothstep(border2.x - d, border2.y + d, mask);
  
  vec3 color = vec3(1., 0., 0.) * edge;
  
  fragColor = vec4(vUV, 0., 1.);
  fragColor = vec4(color, edge);
  //fragColor.xy = pUV;
  //fragColor.w += .6;

  vec2 uv = (gl_FragCoord.xy/(2. * uResolution));
  
  
  
  //fragColor.xy = uv;
  
}