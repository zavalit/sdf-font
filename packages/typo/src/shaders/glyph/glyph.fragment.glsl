#version 300 es

precision mediump float;

out vec4 fragColor;

in vec2 vUV;
in vec4 vGB;
in vec2 pUV;
uniform sampler2D uTexture0;
uniform  highp vec2 uResolution;



void main () {

  vec2 border = vec2(.5);

  float mask = texture(uTexture0, vUV).a;
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y + d, mask);
  
  vec3 color = vec3(1., 0., 0.) * edge;
  
  fragColor = vec4(color, edge);

  // fragColor.xy = pUV;
  // fragColor.w = 1.;

  
}