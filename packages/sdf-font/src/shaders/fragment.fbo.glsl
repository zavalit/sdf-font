#version 300 es
precision highp float;
out vec4 pixelColor;

in vec4 v_lineSegments;
in vec2 v_viewBox;

uniform float uMaxDistance;
uniform float uExponent;


float dist_c2 (vec2 p, vec4 lineseg) {
    vec2 from = lineseg.xy;
    vec2 to = lineseg.zw;
    vec2 lintToPoint = p - from;
    vec2 line = to - from;
    float progress = clamp(dot(lintToPoint, line) / dot(line, line),0., 1.);

    vec2 lp = from + line * progress;

    float _d = length(p - lp);
    return _d;
}


float absDistToSegment(vec2 point, vec2 lineA, vec2 lineB) {
  vec2 lineDir = lineB - lineA;
  float lenSq = dot(lineDir, lineDir);
  float t = lenSq == 0.0 ? 0.0 : clamp(dot(point - lineA, lineDir) / lenSq, 0.0, 1.0);
  vec2 linePt = lineA + t * lineDir;
  return distance(point, linePt);
}

void main() {

    vec4 seg = v_lineSegments;
    vec2 p = v_viewBox;
    float lineDist;
    //lineDist = dist_c2(p, seg);
    lineDist = absDistToSegment(p, seg.xy, seg.zw);
    // lineDist /= uMaxDistance;
    
    //float val = pow(1.0 - lineDist / uMaxDistance, uExponent) * .5;
    float val = pow(1.0 - clamp(lineDist / uMaxDistance, 0.0, 1.0), uExponent) * 0.5;


    bool crossing = (seg.y > p.y != seg.w > p.y) && (p.x < (seg.z - seg.x) * (p.y - seg.y) / (seg.w - seg.y) + seg.x);
    bool crossingUp = crossing && seg.y < seg.w;
    
  

    pixelColor = vec4(crossingUp ? 1.0 / 255.0 : 0.0, crossing && !crossingUp ? 1.0 / 255. : 0.0, 0.0, val);
    

}