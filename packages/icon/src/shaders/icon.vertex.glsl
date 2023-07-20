#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in float aItemIndex;

uniform float uItemSize;
uniform vec2 uTextureSize;


out vec2 vItemUv;
out float vItemIndex;

void main () {

  //1. obtain texture block coords
  float texWidth = uTextureSize.x;
  
  vec4 itemBox = vec4(
    aItemIndex * uItemSize / texWidth,        // x0
    0.,                                       // y0
    (aItemIndex + 1.) * uItemSize / texWidth, // x1
    1.                                        // y1
  );

  vec2 normalPos = aPosition;
  vec2 itemUv = mix(itemBox.xy, itemBox.zw, normalPos);
  vec2 pos = mix(vec2(-1.), vec2(1.),aPosition);

  gl_Position = vec4(pos, 0., 1.);

  vItemUv = itemUv;
  vItemIndex = aItemIndex;


}