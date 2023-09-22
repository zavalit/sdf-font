#version 300 es


layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aGlyphBounds;
layout(location=2) in float aGlyphIndex;
layout(location=3) in vec2 aRow;
layout(location=4) in vec2 aRowColumn;
layout(location=5) in float aGylphPadding;

out vec2 glyphUV;
out vec2 textUV;
out float vChannel;
out vec4 vGlyphBounds;

uniform float uAtlasColumnCount;
uniform vec2 uSDFTextureSize;
uniform float uSdfItemSize;
uniform vec2 uResolution;
uniform vec2 uResolutionInPx;
uniform float uFontSize;
uniform float uDescender;
uniform float uAscender;
uniform float uUnitsPerEm;
uniform float uBottomPadding;
uniform float uPaddingLeft;
uniform float uPaddingBottom;

const float leftPadding = 0.;

vec2 getGlyphPosition () {
  
  vec4 gb = aGlyphBounds;

  vec2 pos = aPosition;
  
  pos.x += leftPadding;
  
  float height = gb.w + gb.y;
  float width = gb.z - gb.x;
  
  float overStep = (uAscender - uDescender)/uUnitsPerEm;
  
  pos.y += ((gb.w - gb.y) * .5 - .5);
  // pos.y += (.5 - overStep * .5 );
  // pos.x += (.5 - overStep * .5 );
  
  pos.x += width * .5 - .5;
  
  pos *= 2.;
  
  pos.y -= height * .5;
  
  pos.x -= width * .5;
  
  pos.y -= uDescender;
  
  
  pos.x += gb.x;
  pos.x -= 2. * aGylphPadding;
  
  

  vec2 fontScale = uFontSize / (uResolutionInPx);

  pos.y += uPaddingBottom  / (uResolutionInPx.y);
  
  
  
  
  pos *= fontScale;

  pos.y += aRow.y/uResolutionInPx.y;
  
  return pos;
}

vec2 getGlyphUV () {
    vec4 gb = aGlyphBounds;

  vec2 pos = aPosition;
  
  
  vec2 itemSize = (uSdfItemSize * 2.)/ uSDFTextureSize ;
  
  float c = floor(aGlyphIndex/4.);
  float column = mod(c, uAtlasColumnCount) * itemSize.x;
  float row = floor(c/uAtlasColumnCount) * itemSize.y;


  float u = mix(column, column + itemSize.x, pos.x);
  float v = mix(row, row + itemSize.y, pos.y);

  vec2 uv = vec2(u,v);
  return uv;
}


#pragma glslify2: topDot = require('./glyph.position.vertex.glsl)


void main(){


  vec2 pos = getGlyphPosition();

  gl_Position = vec4(mix(vec2(-1.), vec2(1.), pos), 0.,1.);


  glyphUV = getGlyphUV();
  textUV = pos;
  vChannel = mod(aGlyphIndex, 4.);
  vGlyphBounds = aGlyphBounds;
}