#version 300 es
precision highp float;

out vec4 fragColor;

in vec4 vSegmentsCoord;
in vec2 vViewBox;
in float vSegmentsDist;


uniform float uUnitsPerEm;
uniform float uDistance;


float remap(float value, float min_in, float max_in, float min_out, float max_out) {
    float progess = (value - min_in) / (max_in - min_in);
    return mix(min_out, max_out, progess);
}
float drawLine (vec2 p, vec2 a, vec2 b, vec2 range) {

    vec2 pa = p - a;
    vec2 ba = b - a;

    float k = clamp(dot(pa, ba)/dot(ba, ba), 0., 1.);
    
    vec2 line = a + k*ba;

    float border = .05 * uUnitsPerEm;
    float d = distance(p, line);
    d = step(border, d);
    
    float _k = remap(k, 0., 1., range.x, range.y);
    float gr = max(d, _k);
    return gr;
    
}


void main() {
    
    vec2 uv = vViewBox;

    vec4 segs = vSegmentsCoord;
    float segDist = distance(segs.xy, segs.zw);
    
    vec2 fromP = segs.xy;
    vec2 toP = segs.zw;

    float fromD = vSegmentsDist/uDistance;
    float toD = (vSegmentsDist + segDist) / uDistance;

    vec2 rangeD = vec2(fromD, toD);


    float line_d = drawLine(uv, fromP, toP, rangeD);



    fragColor = vec4(vec3(1. - line_d),  line_d);
    

}