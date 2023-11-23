#version 300 es

precision mediump float;

in vec2 glyphUV;
in float vGlyphChannel;
in float vS;
out vec4 fragColor;

uniform sampler2D uTexture0;
uniform vec3 uColor;



void main () {

  vec2 border = vec2(.5);

  vec2 uv = glyphUV;

  
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
  
  vec3 color = vec3(0.5) * edge;
  
  
  fragColor = vec4(color, edge);
  fragColor.a += .5;
  fragColor.r += .5;
  
  
}