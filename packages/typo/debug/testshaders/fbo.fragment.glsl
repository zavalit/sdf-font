#version 300 es

precision mediump float;

out vec4 fragColor;

uniform sampler2D uTexture0;

in vec2 vUv;

void main () {

  vec4 text = texture(uTexture0, vUv);

  fragColor = text;

}