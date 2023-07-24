#version 300 es

// layout(location=0) in vec2 position;

// layout(location=1) in vec4 aLine;
// layout(location=2) in float aOffset;
// layout(location=3) in float aDistance;

in vec2 position;
in vec4 aLine;
in float aOffset;
in float aDistance;

vec4 _aLine = vec4(803, 295, 803, 1082);
float _aOffset = 3364.3856280458153;
float _aDistance = 787.;

uniform vec4 u_viewbox;
vec4 _u_viewbox = vec4(124.3046875, -31.6953125, 999.6953125, 1488.6953125);

out vec4 vLine;
out float vOffset;
out float vDistance;
out vec2 vViewBox;

void main () {

    gl_Position = vec4(position, 0., 1.);

    // 
    vLine = aLine;
    vOffset = aOffset;
    vDistance = aDistance;
   
    vViewBox = mix(u_viewbox.xy, u_viewbox.zy, position);

}