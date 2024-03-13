#version 300 es

precision mediump float;

in vec2 glyphUV;
in float vGlyphChannel;
in float vS;
out vec4 fragColor;

uniform sampler2D uTexture0;
uniform vec3 uColor;


float obtainMSDFTextureMask(vec2 uv, float chnl) {

float mask;
if(chnl==0.){
  mask = texture(uTexture0, uv).r;
}
else if(chnl==1.){
  mask = texture(uTexture0, uv).g;
}
else if(chnl==2.){
  mask = texture(uTexture0, uv).b;
}
else if(chnl==3.){
  mask = texture(uTexture0, uv).a;
}
return mask;
}

void main () {

  float mask = obtainMSDFTextureMask(glyphUV, vGlyphChannel);
  float f = fwidth(mask);
  mask = smoothstep(.5 - f, .5 + f, mask);

  fragColor = vec4(vec3(1.), mask);
  
  // fragColor.a += .5;
  // float ch = vGlyphChannel;
  // vec3 bg = vec3(ch==0. ? 1.: 0., ch==1. ? 1.: 0., ch==2. ? 1.: 0.);
  // //fragColor.rgb += .5 * bg;
  // fragColor.xy = glyphUV;
  
  
}