#version 300 es
#define DEBUG 1

precision mediump float;


out vec4 fragColor;

uniform sampler2D uTroikaSDFTexture;
uniform vec2 uResolution;
uniform float uTroikaDistanceOffset;
uniform float uSDFExponent;
uniform float uTroikaSDFGlyphSize;
uniform vec3 uColor;


in vec4 vGlyphBounds;
in vec2 vGlyphUV;
in vec2 vTroikaGlyphDimensions;
in vec4 vTroikaTextureUVBounds;
in float vTroikaTextureChannel;
in vec2 vUv;
in float vGlyphIndex;


float maskLine (vec2 p, vec2 a, vec2 b) {

    vec2 pa = p - a;
    vec2 ba = b - a;

    float k = clamp(dot(pa, ba)/dot(ba, ba), 0., 1.);

    vec2 line = a + k*ba;

    float d = distance(line, p);
    //return d;

    return smoothstep(0.,.01, d);


}
void main(){
    
    
    vec2 uv = vUv;//(gl_FragCoord.xy * 2. - uResolution)/min(uResolution.x, uResolution.y);
    
    
    vec4 gb = vGlyphBounds;
    vec2 letterUV = (uv - gb.xy) / (gb.zw - gb.xy);

    float aaDist = length(fwidth(letterUV * vTroikaGlyphDimensions)) * 0.5;
    //letterUV = mix(vec2(.0, .0), vec2(.5, 1.), letterUV);
    vec4 rgba = texture(uTroikaSDFTexture, letterUV);
    // // float ch = floor(vTroikaTextureChannel + 0.5); //NOTE: can't use round() in WebGL1
    // // float alpha = ch == 0.0 ? rgba.r : ch == 1.0 ? rgba.g : ch == 2.0 ? rgba.b : rgba.a;
    float alpha = rgba.r;

    // Inverse of exponential encoding in webgl-sdf-generator
    
    //  TODO - there's some slight inaccuracy here when dealing with interpolated alpha values; those
    // are linearly interpolated where the encoding is exponential. Look into improving this by rounding
    // to nearest 2 whole texels, decoding those exponential values, and linearly interpolating the result.
  
    float maxDimension = max(vTroikaGlyphDimensions.x, vTroikaGlyphDimensions.y);
    float absDist = (1.0 - pow(2.0 * (alpha > 0.5 ? 1.0 - alpha : alpha), 1.0 / uSDFExponent)) * maxDimension;
    float signedDist = absDist * (alpha > 0.5 ? -1.0 : 1.0);
    
    

    float edgeAlpha = smoothstep(
    uTroikaDistanceOffset + aaDist,
    uTroikaDistanceOffset - aaDist,
    signedDist
    );
   
    vec3 color = vec3(0.);
    
   color = mix(color, uColor, edgeAlpha);

    #ifdef DEBUG
        //color = mix(color, vec3(1.), maskLine(vUv, gb.xy, gb.xw));
        vec2 p = vUv;
        color = mix(vec3(1.), color, maskLine(p, gb.xy, gb.xw));
        color = mix(vec3(1.), color, maskLine(p, gb.xy, gb.zy));
        color = mix(vec3(1.), color, maskLine(p, gb.xw, gb.zw));
        color = mix(vec3(1.), color, maskLine(p, gb.zy, gb.zw));
    #endif
 
    fragColor = vec4(color, 1.);
    fragColor = vec4(uColor, 1.);
    //fragColor = vec4(letterUV, vGlyphIndex, 1.);
    // fragColor = vec4(vGlyphUV, vGlyphIndex, 1.);
    //fragColor = vec4(vUv, vGlyphIndex, 1.);
    //fragColor = vec4(uv, vGlyphIndex, 1.);
            

}