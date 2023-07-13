#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aLineSegments;

uniform vec4 uGlyphBounds;
uniform float uMaxDistance;
uniform float uAscender;
uniform float uDescender;
uniform float uUnitsPerEm;
uniform float uMargin;

out vec4 vLineSegments;
out vec2 vViewBox;

void main() {

    float maxHeight = uAscender - uDescender;
    maxHeight = uUnitsPerEm;
    
    vec2 from = uGlyphBounds.xy/maxHeight;
    
    vec2 to = uGlyphBounds.zw/maxHeight;
    
    float height = (uGlyphBounds.w - uGlyphBounds.y)/maxHeight;
    float width = (uGlyphBounds.w - uGlyphBounds.y)/maxHeight;

    float aspectRatio = height/width;

    vec2 gplyphCenter = (to - from) * .5;

    vec2 map = aPosition;
    map.y -= uDescender/maxHeight;
    
    
    vec2 box = mix(from, to, map);
    
    vec2 pos = mix(vec2(-1.), vec2(1.), box);
    
    gl_Position = vec4(pos, 0., 1.);

    vLineSegments = aLineSegments;



    vViewBox = mix(uGlyphBounds.xy, uGlyphBounds.zw, aPosition);
}