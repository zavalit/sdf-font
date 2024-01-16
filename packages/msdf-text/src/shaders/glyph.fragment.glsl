#version 300 es

precision mediump float;

in vec2 glyphUV;
in float vGlyphChannel;
in float vS;
out vec4 fragColor;

uniform sampler2D uTexture0;
uniform vec3 uColor;


float obtainMSDFTextureMask(vec2 uv, float chnl) {
  
  float mask = texture(uTexture0, uv).a;
  if(chnl==0.){
    mask = texture(uTexture0, uv).r;
  }
  else if(chnl==1.){
    mask = texture(uTexture0, uv).g;
  }
  if(chnl==2.){
    mask = texture(uTexture0, uv).b;
  }
  return mask;
}

void main () {

  vec2 border = vec2(.5);

  float mask = obtainMSDFTextureMask(glyphUV, vGlyphChannel);
  
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y + d, mask);
  
  vec3 color = uColor * edge;
  
  
  fragColor = vec4(color, edge);
  fragColor.a += .5;
  // fragColor.rgb += .1 * bg;
  
  
}