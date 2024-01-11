#version 300 es

precision mediump float;

in vec2 glyphUV;
in float vGlyphChannel;
in float vS;
out vec4 fragColor;

uniform sampler2D uTexture0;
uniform vec3 uColor;


float loadMSDFTexture() {
  vec2 uv = glyphUV;

  vec3 bg = vec3(0);
  
  float mask = texture(uTexture0, uv).a;
  if(vGlyphChannel==0.){
    mask = texture(uTexture0, uv).r;
    bg.r = 1.;
  }
  else if(vGlyphChannel==1.){
    mask = texture(uTexture0, uv).g;
    bg.g = 1.;
  }
  if(vGlyphChannel==2.){
    mask = texture(uTexture0, uv).b;
    bg.b = 1.;
  }
  return mask;
}

void main () {

  vec2 border = vec2(.5);

  vec2 uv = glyphUV;

  vec3 bg = vec3(0);
  
  float mask = texture(uTexture0, uv).a;
  if(vGlyphChannel==0.){
    mask = texture(uTexture0, uv).r;
    bg.r = 1.;
  }
  else if(vGlyphChannel==1.){
    mask = texture(uTexture0, uv).g;
    bg.g = 1.;
  }
  if(vGlyphChannel==2.){
    mask = texture(uTexture0, uv).b;
    bg.b = 1.;
  }
  
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y + d, mask);
  
  vec3 color = uColor * edge;
  
  
  fragColor = vec4(color, edge);
   //fragColor.a += .5;
  // fragColor.rgb += .1 * bg;
  
  
}