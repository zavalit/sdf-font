#version 300 es

precision mediump float;

uniform sampler2D uTexture0;
uniform highp vec2 uResolution;

in vec2 vMetaTextureUV;

out vec4 fragColor;

void main (){

  vec2 uv = (gl_FragCoord.xy/uResolution);

  vec4 metaTexture = texture(uTexture0, uv);

  fragColor = metaTexture;

  

}


