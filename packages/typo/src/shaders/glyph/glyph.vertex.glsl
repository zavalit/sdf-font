#version 300 es


layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aGlyphBounds;
layout(location=2) in float aGlyphIndex;
layout(location=3) in vec2 aRow;
layout(location=4) in float aRowColumn;

out vec2 vUV;
out vec2 pUV;


uniform float uAtlasColumnCount;
uniform vec2 uSDFTextureSize;
uniform float uSdfItemSize;
uniform vec2 uResolution;
uniform vec2 uResolutionInPx;
uniform float uFontSize;
uniform float uDescender;
uniform float uBottomPadding;
uniform float uPaddingLeft;


vec2 getGlyphPosition () {
  
  float paddingLeft = uPaddingLeft;
  
  vec4 gb = aGlyphBounds;

  vec2 pos = aPosition;
  
  vec2 fontScale = uFontSize / uResolutionInPx;
  pos.x += max(gb.x, 0.);
  pos.x += paddingLeft;
  pos.y -= uDescender;
  

  float width = gb.z - gb.x;
  float height = gb.w - gb.y;

  
  float centerShiftX = .5 - .5 * width;
  
  float centerShiftY = (1. - height) * .5;

  pos.x -= centerShiftX;
  
  
  pos.y -= centerShiftY;
  pos.y += min(0., gb.y) * height + aRow.y/uFontSize;
    
  pos *= fontScale;
  return pos;
}

vec2 getGlyphUV () {
  vec2 itemSize = uSdfItemSize / uSDFTextureSize;
  float column = mod(aGlyphIndex, uAtlasColumnCount) * itemSize.x;
  float row = floor(aGlyphIndex/uAtlasColumnCount) * itemSize.y;


  float u = mix(column, column + itemSize.x, aPosition.x);
  float v = mix(row, row + itemSize.y, aPosition.y);

  vec2 uv = vec2(u,v);
  return uv;
}


#pragma glslify2: topDot = require('./glyph.position.vertex.glsl)


void main(){


  vec2 pos = getGlyphPosition();

  gl_Position = vec4(mix(vec2(-1.), vec2(1.), pos), 0.,1.);


  vUV = getGlyphUV();
  pUV = aPosition;
}