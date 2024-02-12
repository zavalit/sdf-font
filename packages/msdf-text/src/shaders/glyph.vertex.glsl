#version 300 es


layout(location=0) in vec2 aPosition;
layout(location=1) in vec2 aGlyphStart;
layout(location=2) in vec2 aGlyphSize;
layout(location=3) in vec2 aGlyphOffset;
layout(location=4) in vec2 aGlyphRowColumn;
layout(location=5) in vec2 aGlyphRowColumnNormalized;
layout(location=6) in float aGlyphChannel;
layout(location=7) in vec4 aAtlasBounds;
layout(location=8) in vec2 aSpaceDiffs;

out vec2 glyphUV;
out float vGlyphChannel;
out float vS;


uniform vec2 uAtlasResolution;
uniform vec2 uResolution;
uniform vec2 uResolutionInPx;
uniform float uFontLineHeight;
uniform float uOriginLineHeight;
uniform float uLineHeight;
uniform float uBaseLine;
uniform vec4 uPadding;
uniform float uFontSize;

#define FONT_SCALE uFontSize/uResolutionInPx
#define SCALED_LINE_HEIGHT uFontSize/uResolutionInPx.y


vec4 getBounds () {
  
  vec2 diffs = aSpaceDiffs;

  vec2 start = aGlyphStart;
  start.x += diffs.x;
  
  vec2 end = aGlyphStart + vec2( aGlyphSize.x, uFontLineHeight);
  end.x += diffs.y;
  
  
  return vec4(start, end);
}


vec2 getPosition(){
  vec2 pos = aPosition;

  vec4 bounds = getBounds();
  
  // manage space between lines 
  bounds.yw += aGlyphRowColumn.y * uOriginLineHeight * (1. - uLineHeight);
  
  pos = mix(bounds.xy, bounds.zw, pos);
  
  pos *= FONT_SCALE;
  return pos;

}

vec2 getUV () {
  
  vec4 ab = aAtlasBounds;
  vec2 ar = uAtlasResolution;
  

  vec2 gpos = aPosition;

  vec4 bounds = getBounds();
  float height = (bounds.w - bounds.y);
  float width = bounds.z - bounds.x;
  
  // offset y
  float glyphHeight = aGlyphSize.y;
  float heightScale = height /glyphHeight; 
  
  // fix height scaling
  gpos.y *= heightScale;
  //gpos.y += .06;

  // move scaled pos up to the base
  float base = uBaseLine;

  gpos.y -= (1. - (base)/height) * heightScale;
    
  // offset y
  gpos.y -= aGlyphOffset.y/height * heightScale;

  // padding 
  vec2 p = uPadding.xy * .5;
  gpos.y +=  p.y / aGlyphSize.y;
  
  gpos.x +=  p.x / width;
  gpos.x *= width/(width + uPadding.x);
  

  // diff delta
  vec2 diffs = aSpaceDiffs;
  float xSpaceDelta = (diffs.y - diffs.x)/(width + uPadding.x);
  float leftSpaceDelta = (diffs.x)/(width + uPadding.x);
  float d = leftSpaceDelta;
  gpos.x += leftSpaceDelta;
  gpos.x *= 1./(1. - xSpaceDelta);
  
  
  vec2 from = (ab.xy)/ar;
  vec2 to = ab.zw/ar;
  vec2 uv = mix(from, to, gpos);


  return uv;

}

void main(){

  
  vec2 pos = getPosition();
  
  pos = mix(vec2(-1.), vec2(1.), pos);

  gl_Position = vec4(pos, 0.,1.);

  glyphUV = getUV();
 
  vGlyphChannel = aGlyphChannel;
  
}