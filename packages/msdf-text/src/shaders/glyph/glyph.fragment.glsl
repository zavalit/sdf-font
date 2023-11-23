#version 300 es

precision mediump float;

in vec2 glyphUV;
in float vGlyphChannel;
out vec4 fragColor;

uniform sampler2D uTexture0;
uniform vec3 uColor;



void main () {

  vec2 border = vec2(.5);

  vec2 uv = glyphUV;
  //uv.y *= 1.3;
  
  float mask = texture(uTexture0, uv).a;
  if(vGlyphChannel==0.){
    mask = texture(uTexture0, uv).r;
  }
  else if(vGlyphChannel==1.){
    mask = texture(uTexture0, uv).g;
  }
  if(vGlyphChannel==2.){
    mask = texture(uTexture0, uv).b;
  }
  
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y + d, mask);
  
  vec3 color = vec3(1.) * edge;
  
  
  fragColor = vec4(color, .8);
  //fragColor.r = 1.;
  
}