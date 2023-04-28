#version 300 es

layout(location=0) in vec2 position;
layout(location=1) in vec4 glyphBounds;
layout(location=2) in float glyphIndex;
layout(location=4) in vec2 uv;


uniform vec4 uGlyphBounds;
uniform float uGlyphIndex;
uniform vec2 uSDFTextureSize;
uniform float uSDFGlyphSize;
uniform mediump vec2 uResolution;

out vec4 vGlyphBounds;
out vec4 vTroikaTextureUVBounds;
out vec2 vGlyphUV;
out vec2 vTroikaGlyphDimensions;
out float vTroikaTextureChannel;
out float vGlyphIndex;
out vec2 vUv;



void main() {
    
    vec4 bounds = glyphBounds;
    vGlyphBounds = glyphBounds;
    vGlyphIndex = glyphIndex;

    float aspectRatio = uResolution.x / uResolution.y;

    vec2 pos = position.xy;
    

    pos.x *= aspectRatio;

     vec2 clippedXY = (mix(bounds.xy, bounds.zw, pos) - bounds.xy) / (bounds.zw - bounds.xy);
    // //vec2 clippedXY = mix(bounds.xy, bounds.zw, pos);
    

     pos = mix(bounds.xy, bounds.zw, clippedXY);
     pos.x +=  glyphIndex;
    
    vGlyphUV = pos;
    
    // vTroikaGlyphUV = clippedXY.xy;
    vTroikaGlyphDimensions = vec2(bounds[2] - bounds[0], bounds[3] - bounds[1]);

   
    vUv = uv;
    vUv = pos;
    

    gl_Position = vec4(pos, 0., 1.);
}