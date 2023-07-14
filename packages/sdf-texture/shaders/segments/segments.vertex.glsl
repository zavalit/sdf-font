#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aLineSegments;

uniform vec4 uGlyphBounds;
uniform float uMaxDistance;
uniform float uAscender;
uniform float uDescender;
uniform float uUnitsPerEm;
uniform float uZoom;

out vec4 vLineSegments;
out vec2 vViewBox;
out vec2 vUv;
out float vMaxDistance;



void main() {

    float maxHeight = uUnitsPerEm;
    
    
    vec2 from = uGlyphBounds.xy/maxHeight;
    
    vec2 to = uGlyphBounds.zw/maxHeight;

    float width = (uGlyphBounds.z - uGlyphBounds.x)/maxHeight;
    float toRight = (maxHeight - uGlyphBounds.z)/maxHeight;
    
    vec2 map = aPosition;
    
    vec2 box = mix(from, to, map);
    
    
    
    vec2 pos = mix(vec2(-1.), vec2(1.), box);
    
    gl_Position = vec4(pos, 0., 1.);

    vLineSegments = aLineSegments;

    
    vec2 uv = aPosition;
    
    uv.y -= .5;
    uv.x -= .5;
    
    uv /= uZoom;

    vViewBox = mix(uGlyphBounds.xy, uGlyphBounds.zw, uv);
    vMaxDistance = maxHeight;
    
    vUv = aPosition;
}