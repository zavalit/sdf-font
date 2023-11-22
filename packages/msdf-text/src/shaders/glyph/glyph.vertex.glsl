#version 300 es


layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aGlyphBounds;
layout(location=2) in vec2 aGlyphSize;
layout(location=3) in vec2 aGlyphOffset;
layout(location=4) in vec4 aAtlasBounds;

out vec2 glyphUV;

uniform vec2 uAtlasResolution;
uniform vec2 uResolution;
uniform float uLineHeight;
uniform float uBaseLine;

void main(){

  vec2 pos = aPosition;
  
  vec4 gb = aGlyphBounds;
  vec2 r = uResolution;
  pos = mix(gb.xy/r, gb.zw/r, pos);
  
  
  pos = mix(vec2(-1.), vec2(1.), pos);
  gl_Position = vec4(pos, 0.,1.);


  vec4 ab = aAtlasBounds;
  vec2 ar = uAtlasResolution;
  

  vec2 gpos = aPosition;
  
  // fix height scaling
  float glyphHeight = aGlyphSize.y;
  float heightScale = uLineHeight/glyphHeight; 
  gpos.y *= heightScale;
  

  // move scaled pos up to the base
  gpos.y -= (1. - (uBaseLine)/uLineHeight) * heightScale;
    
  // offset y
  gpos.y -= aGlyphOffset.y/uLineHeight * heightScale;

  glyphUV = mix(ab.xy/ar, ab.zw/ar, gpos);
  
}