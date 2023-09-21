#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aGlyphBounds;
layout(location=2) in float aGlyphIndex;
layout(location=3) in float aGlyphOrder;

out vec2 vUV;
out vec2 pUV;
out vec4 vGB;


uniform float uAtlasColumnCount;
uniform vec2 uSDFTextureSize;
uniform float uSdfItemSize;
uniform vec2 uResolution;
uniform vec2 uResolutionInPx;
uniform float uFontSize;
uniform float uDescender;

mat2 rotate2D(float angle) {
  return mat2(
    cos(angle), -sin(angle),
    sin(angle), cos(angle)
  );
}

void main(){
  vec4 gb = aGlyphBounds;

  vec2 pos = aPosition;
  
  // float angle = aGlyphOrder * .1 * 3.1415;
  // float radius = .25;

  // vec2 circularOffset;
  // circularOffset.x = radius * sin(angle);
  // circularOffset.y = radius * cos(angle);

  // pos += circularOffset;
  // pos = rotate2D(angle) * pos;

  vec2 nPos = aPosition * .5 + .5;

  vec2 fontScale = uFontSize / uResolutionInPx;
  pos.x += gb.x;
  pos.y -= uDescender;


  float width = gb.z - gb.x;
  float height = gb.w - gb.y;
  
  float centerShiftX = (1. - width) * .5;
  
  float centerShiftY = (1. - height) * .5;

  pos.x -= centerShiftX;
  pos.y -= centerShiftY;
  pos.y += min(0., gb.y) * height;
    
  pos *= fontScale;
  
  //pos.x -= .561;
  //pos.x += gb.x;
  // pos.y += aGlyphBounds.y;



  gl_Position = vec4(mix(vec2(-1.), vec2(1.), pos), 0.,1.);


  vec2 itemSize = uSdfItemSize / uSDFTextureSize;
  float column = mod(aGlyphIndex, uAtlasColumnCount) * itemSize.x;
  float row = floor(aGlyphIndex/uAtlasColumnCount) * itemSize.y;


  float u = mix(column, column + itemSize.x, aPosition.x);
  float v = mix(row, row + itemSize.y, aPosition.y);

  vec2 uv = vec2(u,v);


  vUV = uv;
  pUV = nPos;
  vGB = gb;
}