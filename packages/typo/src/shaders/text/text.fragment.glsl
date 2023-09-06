#version 300 es
#define DEBUG 1


precision highp float;

in vec2 vGlyphUV;
in vec2 vUV;

uniform vec2 uResolution;
uniform sampler2D uTexture0;
uniform vec3 uColor;


out vec4 fragColor;

void main() {

    vec4 rgba = texture(uTexture0, vGlyphUV);

    float d = fwidth(rgba.a);
    float a = .45;
    float alpha = smoothstep(a - d, a + d, rgba.a);
    float b = .4;
    float beta = smoothstep(b - d, b + d, rgba.a);

    //alpha = smoothstep(.4, .5, rgba.a);

    vec3 color;

    color = mix(color, uColor, beta);
    color = mix(color, vec3(1.), alpha);
  
    fragColor = vec4(color, beta);
    
    //fragColor = vec4(vec3(rgba.rgb), 1.);

    // fragColor.xy = vGlyphUV;
    fragColor.w = 1.;

    fragColor.xy = vUV;

}