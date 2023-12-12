#version 300 es

  layout(location=0) in vec2 aPosition;
  layout(location=1) in vec2 aMove;
  
vec2 getGlyphPosition () {

  vec2 pos = aPosition;
  
  return pos * 2.;
}

vec2 getGlyphPosition2 () {

vec2 pos = aPosition;

return pos * 10.;
}

vec2 getGlyphUV () {

  return vec2(0.);
}

`