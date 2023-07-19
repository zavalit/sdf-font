#version 300 es

precision highp float;
uniform sampler2D tex;
uniform bool uMirrorInside;
uniform bool uFlipY;



in vec2 vUV;

out vec4 fragColor;

// Main shader pass left us "counts" of directional segment crossings in the red+green channels; used as
// a "winding number", these values being unequal indicates a point inside the glyph. This pass will just
// use that to flip the distance value from the alpha channel across the midpoint to give us a "signed" value.

void main() {

  vec2 uv = vUV;
  uv.y = uFlipY ? 1. - uv.y : uv.y;
  vec4 color = texture(tex, uv);
  bool inside = color.r != color.g;
  float val = inside ? 1.0 - color.a : color.a;
  // Write to all channels; gl.colorMask will choose which one(s) survive.
  color = uMirrorInside ? vec4(val) : color;
  
  fragColor = color;

  
}
