

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


#pragma glslify2: export(getGlyphUV)
