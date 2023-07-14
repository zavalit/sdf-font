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
uniform float uZoom;

out vec2 vGlyphUV;
out vec2 vUV;



float vertexAlignOffset = -.9;
float texColumnCount = 8.;
float texRowCount = 8.;
    



float remap (float value, float inMin, float inMax, float outMin, float outMax) {

    float lerpValue = (value - inMin) / (inMax - inMin);

    return mix(outMin, outMax, lerpValue);
}

float margin = 0.01;
void main(){

    
    float maxX = uSDFTextureSize.x;
    float maxY = uSDFTextureSize.y;
    float column = mod(glyphIndex, texColumnCount);
    float row = floor(glyphIndex / texRowCount);
    
    vec4 gb = glyphBounds * 1.
;

    float width = gb.z - gb.x;
    float height = gb.w - gb.y;
    float centerShiftX = width * .5;
    float centerShiftY = height * .5;
    
    vec4 glyphClip = vec4(
        (uSDFGlyphSize * (column + centerShiftX ))/maxX,                // x0
        uSDFGlyphSize * (row + gb.y + centerShiftY )/maxY,                       // y0
        (uSDFGlyphSize * (column + width + centerShiftX ))/maxX,        // x1
        uSDFGlyphSize * (row + gb.w + centerShiftY)/maxY             // y1
    );

    glyphClip += 4./(uAscender - uDescender);
    
    
    
    vec2 box = aPositions;
        

    vec2 glyphUV = mix(glyphClip.xy, glyphClip.zw, box * uZoom);

    
    vec2 pos = mix(vec2(-0.), vec2(1.), aPositions);
    
    


    pos = mix(gb.xy, gb.zw, pos);
    
;
    

    
    
    vec4 position = vec4(pos, 0., 1.);
    
    pos = (position * uProjectionMatrix).xy;
    pos.x += vertexAlignOffset;
    
    

    gl_Position = vec4(pos, 0., 1.);

    
    vGlyphUV = glyphUV ;
    vUV = aPositions;

}

