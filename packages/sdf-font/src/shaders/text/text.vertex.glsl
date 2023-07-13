#version 300 es
layout(location=0) in vec2 aPositions;
layout(location=1) in vec4 glyphBounds;
layout(location=2) in float glyphIndex;

uniform vec2 uSDFTextureSize;
uniform mat4 uProjectionMatrix;
uniform float uAspectRatio;
uniform vec2 uResolution;
uniform float uSDFGlyphSize;
uniform float uAscender;
uniform float uDescender;

out vec2 vGlyphUV;
out vec2 vUV;



float vertexAlignOffset = -.9;
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
    
    float maxHeight = uAscender - uDescender;
    vec4 gb = glyphBounds;

    float width = gb.z - gb.x;
    float height = gb.w - gb.y;
    
    vec4 glyphClip = vec4(
        (uSDFGlyphSize * (column))/maxX,                // x0
        uSDFGlyphSize * (row + gb.y)/maxY,                       // y0
        (uSDFGlyphSize * (column + width))/maxX,        // x1
        uSDFGlyphSize * (row + gb.w)/maxY             // y1
    );

    vec2 box = aPositions;
    
    box.y -= (uDescender/maxHeight);

    vec2 pos = aPositions;
    vec2 glyphUV = mix(glyphClip.xy, glyphClip.zw, box);
    
    
    


    pos = mix(gb.xy, gb.zw, pos);
    
    
    pos = (vec4(pos, 0., 1.) * uProjectionMatrix).xy;
    pos.x += vertexAlignOffset;
    
    

    gl_Position = vec4(pos, 0., 1.);

    
    vGlyphUV = glyphUV;
    vUV = aPositions;

}

