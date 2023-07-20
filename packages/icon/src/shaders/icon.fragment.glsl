#version 300 es

precision mediump float;

out vec4 fragColor;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform vec2 uResolution;
uniform float uPROGRESS;

in vec2 vItemUv;
in float vItemIndex;


void main () {

  vec2 uv = (gl_FragCoord.xy/uResolution);

  vec3 color;
  float alpha = 1.;

  vec4 edgesTex = texture(uTexture0, vItemUv);
  vec4 distanceTex = texture(uTexture1, vItemUv);
  
  float e = smoothstep(.4,.42, edgesTex.a);
  float d = distanceTex.r;
  
  
  float i = step(uPROGRESS + .01, d);
  float ii = min(i, e);


  //fragColor = vec4(color, alpha);
  fragColor.rgb = vec3(0.4, vItemIndex/2., 0.);
  //fragColor.rgb = vec3(1. - edgesTex.x);
  fragColor.w = ii;
  //fragColor.w = d;

  //fragColor.xy = uv;

}