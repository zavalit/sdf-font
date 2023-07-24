#version 300 es

precision mediump float;

in vec4 vLine;
in float vOffset;
in float vDistance;
in vec2 vViewBox;

uniform vec2 u_resolution;
uniform float u_distance;
uniform float u_maxDist;

out vec4 fragColor; // r,g,b,a

float remap(float value, float min_in, float max_in, float min_out, float max_out) {
    float progess = (value - min_in) / (max_in - min_in);
    return mix(min_out, max_out, progess);
}

float drawLine (vec2 p, vec2 a, vec2 b, vec2 range) {

    vec2 pa = p - a;
    vec2 ba = b - a;

    float k = clamp(dot(pa, ba)/dot(ba, ba), 0., 1.);
    
    vec2 line = a + k*ba;

    float d = distance(p, line);
    d = smoothstep(0.01, .02, d);
    
    float _k = remap(k, 0., 1., range.x, range.y);
    float gr = max(d, _k);
    return gr;
    
}

vec4 line1 = vec4(vec2(0., .5), vec2(.5, 0.));
vec4 line2 = vec4(vec2(.5, 0.), vec2(0, -.5));
vec4 line3 = vec4(vec2(0., -.5), vec2(-.5, 0.));
vec4 line4 = vec4(vec2(812., 0.), vec2(808., 107.));
vec4 line5 = vec4(vec2(.7, 0.), vec2(.8, .107));


void main () {

    vec2 clipSpace = (2.*gl_FragCoord.xy - u_resolution) / u_resolution;

    float line_a = drawLine(clipSpace, line1.xy, line1.zw, vec2(0., .33));
    float line_b = drawLine(clipSpace, line2.xy, line2.zw, vec2(.33, .66));
    float line_c = drawLine(clipSpace, line3.xy, line3.zw, vec2(.66, 1.));

    float from = vOffset/u_distance;
    float to = (vOffset + vDistance) / u_distance;
    vec2 range = vec2(from, to);
    // float line = drawLine(vViewBox, vLine.xy, vLine.zw, range);  

    // line /= u_maxDist; 

    //float line = drawLine(clipSpace, line5.xy/u_maxDist, line5.zw/u_maxDist, vec2(0., 1.));


    float line_d = drawLine(clipSpace, vLine.xy / u_maxDist, vLine.zw / u_maxDist, range);

    float line = min(line_a, line_b);
    line = min(line, line_c);
    line = min(line, line_d);

    line = line_d;
    line = 1. - line;
    //line = line - .99803921;

    fragColor = vec4(vec3(1.), line);
    //fragColor = vec4(vec3(fract(u_distance)), 1.0);
}