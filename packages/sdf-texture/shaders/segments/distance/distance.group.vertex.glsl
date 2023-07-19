#version 300 es


precision highp float;
in vec2 aUV;
out vec2 vUV;

void main() {
  
  gl_Position = vec4(mix(vec2(-1.0), vec2(1.0), aUV ), 0.0, 1.0);

  vUV = aUV;

}
