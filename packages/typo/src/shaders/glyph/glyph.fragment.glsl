#version 300 es

precision mediump float;

out vec4 fragColor;

in vec2 glyphUV;
in vec2 textUV;
in float vChannel;
in vec4 vGlyphBounds;
in float vRowOrder;
in vec2 vGlyphPadding;

uniform sampler2D uTexture0;
uniform highp vec2 uResolution;
uniform float uMaxGylphX;
uniform vec3 uColor;
uniform float uRowCount;
uniform vec2 uTextResolution;



void main () {

  vec2 border = vec2(.5);

  vec2 uv = glyphUV;
  
  float mask = texture(uTexture0, uv).a;
  if(vChannel == 0.){
    mask = texture(uTexture0, uv).r;
  }
  if(vChannel == 1.){
    mask = texture(uTexture0, uv).g;
  }
  if(vChannel == 2.){
    mask = texture(uTexture0, uv).b;
  }
  
  float d = fwidth(mask);
  float edge = smoothstep(border.x - d, border.y - d*.05, mask);
  
  vec3 color = uColor * edge;
  
  
  vec4 gb = vGlyphBounds;
   
  vec2 gp = vGlyphPadding;

  float textWidth = uMaxGylphX;

  vec2 tUV = (gl_FragCoord.xy/uTextResolution);

  float pl = .01;
  float pr = .05;
  float glyphBox = step((gb.x - gp.x)/textWidth, tUV.x);
  glyphBox = min(glyphBox,1. - step((gb.z + gp.y)/textWidth, tUV.x));

  float yShift = -.0;
  glyphBox = min(glyphBox, (1. - step((1. + vRowOrder)/uRowCount, tUV.y)));
  glyphBox = min(glyphBox, (step((vRowOrder - yShift)/uRowCount, tUV.y)));
  
   
   if(vChannel == 0.){    
     color.r += glyphBox;
   }
   if(vChannel == 1.){
     color.g += glyphBox;
   }
  
  if(vChannel == 2.){
    color.b += glyphBox;
  }
  if(vChannel == 3.){
    color.rgb -= glyphBox;
  }
  
  fragColor = vec4(color, max(edge,glyphBox * .8));
  //fragColor = vec4(color, edge);

  //fragColor.xy = tUV;
  //fragColor.w += .1;

  
}