#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aSegments;

uniform float uUnitsPerEm;
uniform vec4 uGlyphBounds;
uniform vec2 uItemResolution;


out vec2 vViewBox;
out float vMaxDistance;
out vec4 vSegmentsCoord;
out vec2 vUv;



void main() {
    
    vec4 gb = uGlyphBounds;

    
		
		//gb.xz -= gb.x;
		gb.yw -= gb.y;


		// float scale = size / uUnitsPerEm;

		float height = (gb.w - gb.y) / uUnitsPerEm;
    float width = (gb.z - gb.x) / uUnitsPerEm;
    
    float p = 0.;
    // gb.xy -= p;
    // gb.zw += p;
    
    vec2 ir = uItemResolution;
    vec2 scale = ir/(gb.zw - gb.xy);
    
    
    
    vec2 pos = aPosition;  
    
    
    pos = mix(gb.xy/gb.zw, vec2(1.), pos);
    
		
	
    vec2 glpos = mix(vec2(-1.), vec2(1.), pos);


    gl_Position = vec4(glpos, 0., 1.);


    vec2 uv = aPosition; 
    uv *= scale;
    uv += (1. - scale) * .5;
    

    
		//uv.y *= 1. + 100. / uUnitsPerEm;
    
    //uv.y -= 1./height * 50. / uUnitsPerEm;
		
    
    //uv.x *= 1. + 100./uUnitsPerEm;
    //uv.x -= 1./width * 50. / uUnitsPerEm;

    
		
    vViewBox = mix(gb.xy, gb.zw, uv);    

    vMaxDistance = uUnitsPerEm;
    vSegmentsCoord = aSegments;    
    

}