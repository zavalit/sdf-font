#version 300 es

layout(location=0) in vec2 aPosition;


void main(){
  
  

  gl_Position = vec4(aPosition, 0., 1.);


  
  
}