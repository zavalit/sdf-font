#version 300 es

precision mediump float;

in vec2 glyphUV;

out vec4 fragColor;

uniform sampler2D uTexture0;
uniform vec3 uColor;



void main () {

  vec2 border = vec2(.5);

  vec2 uv = glyphUV;
  //uv.y *= 1.3;
  
  float mask = texture(uTexture0, uv).a;
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y + d, mask);
  
  vec3 color = vec3(1.) * edge;
  
  
  fragColor = vec4(color, 1.);

  
}