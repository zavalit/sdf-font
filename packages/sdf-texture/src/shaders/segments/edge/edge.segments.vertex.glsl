#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aSegmentsCoord;
layout(location=2) in float aSegmentsDist;
layout(location=3) in vec3 aGlyphBounds;

uniform vec4 uGlyphBounds;
uniform float uUnitsPerEm;
uniform bool uIsCentered;

out vec4 vSegmentsCoord;
out float vSegmentsDist;
out vec2 vViewBox;
out vec2 vUv;
out float vMaxDistance;


vec2 moveToCenter(vec2 uv) {
    
    vec4 gb = uGlyphBounds;
    float width = (gb.z - gb.x)/uUnitsPerEm;
    float height = (gb.w - gb.y)/uUnitsPerEm;
    
    
    uv.y += min(0.,gb.y)/uUnitsPerEm;
    uv.y -= 1./height * .5 - .5;
    uv.x -= 1./width * .5 - .5;

    return uv;
    
    
}


void main() {
    
    vec4 gb = uGlyphBounds;

    vec2 from = gb.xy/uUnitsPerEm;    
    vec2 to = gb.zw/uUnitsPerEm;

        
    vec2 pos = aPosition;
    
    pos = mix(from, to, pos);
    
    vec2 glpos = mix(vec2(-1.), vec2(1.), pos);
    
    gl_Position = vec4(glpos, 0., 1.);

    
    vec2 uv = aPosition;


    uv = uIsCentered ? moveToCenter(uv) : uv;
    
    vViewBox = mix(gb.xy, gb.zw, uv);
   //vViewBox.x -= gb.x;
    
    
    vMaxDistance = uUnitsPerEm;
    vSegmentsCoord = aSegmentsCoord;    
    vSegmentsDist = aSegmentsDist;
    vUv = pos;
}