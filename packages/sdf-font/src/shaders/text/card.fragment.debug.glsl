#version 300 es
#define DEBUG 1


precision highp float;

in float vGlyphIndex;
in vec4 vGlyphBounds;
in vec2 vClippedXY;
in vec2 vUv;
in vec2 vGlyphUV;

uniform vec2 uResolution;
uniform sampler2D uTroikaSDFTexture;
uniform float uSDFExponent;
uniform float uTroikaDistanceOffset;
uniform vec3 uColor;


float fontSize = 150.;


out vec4 fragColor;


void main() {

    vec2 uv = (gl_FragCoord.xy * 2. - uResolution)/min(uResolution.x, uResolution.y);
   // fragColor = vec4(1. - (vGlyphIndex + .1)/3., .2, .9, 1.);
    vec4 gb = vGlyphBounds;
    //vec2 letterUV = (uv - gb.xy) / (gb.zw - gb.xy);

    vec4 rgba = texture(uTroikaSDFTexture, vGlyphUV);

   
    fragColor = vec4(vClippedXY, 0., 1.);
    fragColor = vec4(vUv, 0., 1.);
    fragColor = rgba;

    vec2 vTroikaGlyphDimensions = vec2(gb.z - gb.x, gb.w - gb.y);
    vec2 letterUV = vGlyphUV;

    float aaDist = length(fwidth(letterUV * vTroikaGlyphDimensions)) * 0.5;
    //letterUV = mix(vec2(.0, .0), vec2(.5, 1.), letterUV);
    //vec4 rgba = texture(uTroikaSDFTexture, letterUV);
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
   
    vec3 color;
    
   color = mix(color, uColor, edgeAlpha);

    // #ifdef DEBUG
    //     //color = mix(color, vec3(1.), maskLine(vUv, gb.xy, gb.xw));
    //     vec2 p = vUv;
    //     color = mix(vec3(1.), color, maskLine(p, gb.xy, gb.xw));
    //     color = mix(vec3(1.), color, maskLine(p, gb.xy, gb.zy));
    //     color = mix(vec3(1.), color, maskLine(p, gb.xw, gb.zw));
    //     color = mix(vec3(1.), color, maskLine(p, gb.zy, gb.zw));
    // #endif
 
    fragColor = vec4(color, edgeAlpha);

    #ifdef DEBUG
    // fragColor.rgb = mix(vec3(0.), uColor, alpha);
    // fragColor.a = alpha;

    
    #endif

    //fragColor = vec4(vClippedXY, 0., 1.);
    //fragColor = vec4(vec3(vGlyphIndex/6., 0., 0.), 1.);
}