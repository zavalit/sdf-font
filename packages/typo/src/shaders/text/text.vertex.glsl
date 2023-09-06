#version 300 es
layout(location = 0) in vec2 aPositions;
layout(location = 1) in vec4 glyphBounds;
layout(location = 2) in float glyphIndex;

uniform vec2 uSDFTextureSize;
uniform mat4 uProjectionMatrix;
uniform vec2 uResolution;
uniform float uSdfItemSize;
uniform float uZoom;
uniform float uAscender;
uniform float uDescender;

out vec2 vGlyphUV;
out vec2 vUV;

float texColumnCount = 8.0;
float texRowCount = 8.0;
float vertexAlignOffset = -0.9;


void main() {
    float maxX = uSDFTextureSize.x;
    float maxY = uSDFTextureSize.y;
    float column = mod(glyphIndex, texColumnCount);
    float row = floor(glyphIndex / texRowCount);

    vec4 gb = glyphBounds;

    float width = gb.z - gb.x;
    float height = gb.w - gb.y;
    float centerShiftX = 0.5 - width * 0.5;
    float centerShiftY = -min(gb.y, 0.0) * height + 0.5 - height * 0.5;

    vec4 glyphClip = vec4(
        (uSdfItemSize * (column + centerShiftX)) / maxX,            // x0
        uSdfItemSize * (row + gb.y + centerShiftY) / maxY,          // y0
        (uSdfItemSize * (column + width + centerShiftX)) / maxX,    // x1
        uSdfItemSize * (row + gb.w + centerShiftY) / maxY           // y1
    );


    glyphClip += 5./(uAscender - uDescender);


    // glyphClip.yw -= 0.5 / uResolution.y;
    // glyphClip.xz -= 4.0 / uResolution.x;
    vec2 box = aPositions * 1.25;
    box = aPositions;

    vec2 glyphUV = mix(glyphClip.xy, glyphClip.zw, box);

    vec2 pos = mix(gb.xy, gb.zw, box);

    vec4 position = vec4(pos, 0.0, 1.0);
    pos = (position * uProjectionMatrix).xy;
    pos.x += vertexAlignOffset;

    gl_Position = vec4(pos, 0.0, 1.0);

    vGlyphUV = glyphUV;
    vUV = aPositions;
}
