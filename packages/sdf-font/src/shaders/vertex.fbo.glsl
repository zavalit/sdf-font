#version 300 es

in vec2 aUV;
in vec4 aLineSegments;

uniform vec4 uGlyphBounds;

out vec4 v_lineSegments;
out vec2 v_viewBox;

void main() {

    gl_Position = vec4(mix(vec2(-1.), vec2(1.), aUV), 0., 1.);

    v_lineSegments = aLineSegments;
    v_viewBox = mix(uGlyphBounds.xy, uGlyphBounds.zw, aUV);
}