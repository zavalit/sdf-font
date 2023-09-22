#version 300 es

layout(location=0) in vec2 aPosition;

out vec2 vUv;

void main () {

  gl_Position = vec4(aPosition, 0., 1.);

  vUv = aPosition*.5 + .5;
  
}