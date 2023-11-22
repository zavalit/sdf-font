#version 300 es
precision highp float;

out vec4 fragColor;

in vec4 vSegmentsCoord;
in vec2 vViewBox;
in float vMaxDistance;

uniform float uExponent;


float absDistToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 ba = b - a;
  vec2 pa = p - a;
  float t = clamp((dot(pa, ba) / dot(ba, ba)), 0.0, 1.0);
  vec2 line = a + t * ba;
  return distance(p, line);
}

void main() {
    
    float maxHeight = vMaxDistance;
    
    vec4 seg = vSegmentsCoord;
    
    vec2 p = vViewBox;
    
    float lineDist = absDistToSegment(p, seg.xy, seg.zw);
    
    float val = pow(1.0 - clamp(lineDist / maxHeight, 0.0, 1.0), uExponent) * 0.5;


    bool crossing = (seg.y > p.y != seg.w > p.y) && (p.x < (seg.z - seg.x) * (p.y - seg.y) / (seg.w - seg.y) + seg.x);
    bool crossingUp = crossing && seg.y < seg.w;
    
    float channelMax = 255.;

    fragColor = vec4(crossingUp ? 1.0 / channelMax : 0.0, crossing && !crossingUp ? 1.0 / channelMax  : 0.0, 0.0, val);

    

    
    
    
    
}