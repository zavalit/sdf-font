#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in vec4 glyphBounds;
layout(location=2) in float glyphIndex;

uniform vec2 uResolution;
uniform float uFontSize;
uniform vec2 uSDFTextureSize;

out float vGlyphIndex;
out vec4 vGlyphBounds;
out vec2 vClippedXY;
out vec2 vUv;
out vec4 vGlyphClip;
out vec2 vGlyphUV;

float fontSize = 150.;

vec4 pos1 = vec4(0.006110191345214844, -0.8317804336547852, 0.5363702774047852, -0.006598472595214844);
vec4 pos2 = vec4(0.5618572235107422, -0.8199787139892578, 1.0685138702392578, -0.2015056610107422);


// .5
// 0, 1
// 0, 10
float remap (float value, float inMin, float inMax, float outMin, float outMax) {

    float lerpValue = (value - inMin) / (inMax - inMin);

    return mix(outMin, outMax, lerpValue);
}

void main(){

    float aspectRatio = uResolution.y / uResolution.x;
    vec2 pos = position;
    pos.x = remap(pos.x, -1., 1., 0.,1.);
    pos.y = remap(pos.y, -1., 1., 0.,1.); 
    pos.y /= aspectRatio;
    vec4 gb = glyphBounds;

    vec2 clippedXY; 
    clippedXY = (mix(gb.xy, gb.zw, pos) - gb.xy) / (gb.zw - gb.xy);
   // clippedXY = pos;

    
    pos = mix(gb.xy, gb.zw, clippedXY);

    // float fs = fontSize / uResolution.y;
    // pos *= fs;
    // //pos.x *= aspectRatio;

    float glyphSize = 256.;
    float maxX = uSDFTextureSize.x;
    float maxY = uSDFTextureSize.y;
    vec4 glyphClip = vec4((glyphSize * (glyphIndex))/maxX, 0./maxY, (glyphSize * (glyphIndex + 1.))/maxX, glyphSize/maxY);
    vec2 glyphUV = mix(glyphClip.xy, glyphClip.zw, clippedXY);
    //glyphUV = clippedXY;
    glyphUV.y *= aspectRatio;
    
    gl_Position = vec4(pos, 0., 1.);

    vGlyphIndex = glyphIndex;
    vGlyphBounds = glyphBounds;
    vClippedXY = clippedXY;
    vUv = mix(vec2(0.), vec2(1.), pos);
    vGlyphClip = glyphClip;
    vGlyphUV = glyphUV;

}














//     vec2 clippedXY = (mix(bounds.xy, bounds.zw, pos) - bounds.xy) / (bounds.zw - bounds.xy);
