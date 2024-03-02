precision mediump float;
in vec2 position;
in float aGlyphChannel;
in vec2 aGlyphStart;
in vec2 aGlyphSize;
in vec2 aGlyphOffset;
in vec2 aWordRow;
in vec2 aWordGlyph;
in vec2 aRowWord;

in vec4 aAtlasBounds;
in vec2 aSpaceDiffs;


out vec2 vUV;
out vec2 vGlyphUV;
out float vGlyphChannel;


uniform vec2 uAtlasResolution;
uniform vec2 uResolution;
uniform vec2 uResolutionInPx;
uniform float uFontLineHeight;
uniform float uOriginLineHeight;
uniform float uLineHeight;
uniform float uBaseLine;
uniform vec4 uPadding;
uniform float uFontSize;
uniform float uWordsCount;


#define FONT_SCALE uFontSize/uResolutionInPx
#define SCALED_LINE_HEIGHT uFontSize/uResolutionInPx.y


vec4 getBounds () {
  
  vec2 diffs = aSpaceDiffs;

  vec2 start = aGlyphStart;
  start.x += diffs.x;
  
  vec2 end = aGlyphStart + vec2( aGlyphSize.x, uFontLineHeight);
  //end = aGlyphStart + aGlyphSize;
  end.x += diffs.y;
  
  
  return vec4(start, end);
}


vec2 getPosition(){
  vec2 pos = position;

  vec4 bounds = getBounds();
  
  // manage space between lines 
  bounds.yw += aWordRow.y * uOriginLineHeight * (1. - uLineHeight);
  
  pos = mix(bounds.xy, bounds.zw, pos);
  
  pos *= FONT_SCALE;
  return pos;

}

vec2 getUV () {

  vec4 ab = aAtlasBounds;
  vec2 ar = uAtlasResolution;
  

  vec2 gpos = position;

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
  //uv = clamp(uv, from, to);

  return uv;

}

void main() {
  vec2 glyphPos = getPosition();
  glyphPos = mix(vec2(-1.), vec2(1.), glyphPos);

  gl_Position = vec4(glyphPos, 0., 1.0);

  vUV = position.xy;
  vGlyphChannel = aGlyphChannel;
  vGlyphUV = getUV();
}
