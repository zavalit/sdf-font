#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aLineSegments;

uniform vec4 uGlyphBounds;

out vec4 vLineSegments;
out vec2 vViewBox;

void main() {

    vec2 pos = mix(vec2(-1.), vec2(1.), aPosition);
    gl_Position = vec4(pos, 0., 1.);

    vLineSegments = aLineSegments;
    vViewBox = mix(uGlyphBounds.xy, uGlyphBounds.zw, aPosition);
}