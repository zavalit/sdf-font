#version 300 es

precision mediump float;

out vec4 fragColor;

in vec2 vUV;
in vec2 pUV;
uniform sampler2D uTexture0;
uniform highp vec2 uResolution;
uniform vec3 uColor;



void main () {

  vec2 border = vec2(.5);

  float mask = texture(uTexture0, vUV).a;
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y - d*.05, mask);
  
  vec3 color = uColor * edge;
  
  fragColor = vec4(color, edge);

  //  fragColor.xy = pUV;
  //  fragColor.w += .5;

  
}