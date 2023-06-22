#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in vec4 glyphBounds;
layout(location=2) in float glyphIndex;

uniform vec2 uSDFTextureSize;
uniform mat4 uProjectionMatrix;
uniform float uAspectRatio;
uniform vec2 uResolution;
uniform float uSDFGlyphSize;


out vec2 vGlyphUV;



float vertexAlignOffset = -1.;
float texColumnCount = 8.;
float texRowCount = 8.;
    



float remap (float value, float inMin, float inMax, float outMin, float outMax) {

    float lerpValue = (value - inMin) / (inMax - inMin);

    return mix(outMin, outMax, lerpValue);
}

void main(){

    
    float maxX = uSDFTextureSize.x;
    float maxY = uSDFTextureSize.y;
    float column = mod(glyphIndex, texColumnCount);
    float row = floor(glyphIndex / texRowCount);
    vec4 glyphClip = vec4(
        (uSDFGlyphSize * (column))/maxX, uSDFGlyphSize * row/maxY, // top left corner
        (uSDFGlyphSize * (column + 1.))/maxX, uSDFGlyphSize * (row + 1.)/maxY // bottom right corner 
    );
    vec2 glyphUV = mix(glyphClip.xy, glyphClip.zw, position);


    vec4 gb = glyphBounds;

    vec2 pos = mix(gb.xy, gb.zw, position);
    
    pos = (vec4(pos, 0., 1.) * uProjectionMatrix) .xy;
    pos.x += vertexAlignOffset;
    
    

    gl_Position = vec4(pos, 0., 1.);

    
    vGlyphUV = glyphUV;

}














//     vec2 clippedXY = (mix(bounds.xy, bounds.zw, pos) - bounds.xy) / (bounds.zw - bounds.xy);
