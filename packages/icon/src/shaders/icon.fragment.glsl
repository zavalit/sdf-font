#version 300 es

precision mediump float;

out vec4 fragColor;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;

void main () {

  vec3 color;
  float alpha = 1.;

  fragColor = vec4(color, alpha);

}