#version 300 es
#define DEBUG 1


precision highp float;

in vec2 vGlyphUV;

uniform vec2 uResolution;
uniform sampler2D uSDFTexture;
uniform vec3 uColor;



out vec4 fragColor;


void main() {

    vec4 rgba = texture(uSDFTexture, vGlyphUV);

    float d = fwidth(rgba.a) * .5;
    float alpha = smoothstep(.5 - d, 0.5 + d, rgba.a);

    vec3 color;

    color = mix(color, uColor, alpha);
  
    fragColor = vec4(color, alpha);

}