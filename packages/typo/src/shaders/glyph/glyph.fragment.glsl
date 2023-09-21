#version 300 es

precision mediump float;

out vec4 fragColor;

in vec2 vUV;
in vec2 pUV;
in float vChannel;
uniform sampler2D uTexture0;
uniform highp vec2 uResolution;
uniform vec3 uColor;



void main () {

  vec2 border = vec2(.5);

  vec2 uv = vUV;
  
  float mask = texture(uTexture0, uv).a;
  if(vChannel == 0.){
    mask = texture(uTexture0, uv).r;
  }
  if(vChannel == 1.){
    mask = texture(uTexture0, uv).g;
  }
  if(vChannel == 2.){
    mask = texture(uTexture0, uv).b;
  }
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y - d*.05, mask);
  
  vec3 color = uColor * edge;
  
  fragColor = vec4(color, edge);

//  fragColor.xy = pUV;
  //fragColor.w += .5;

  
}