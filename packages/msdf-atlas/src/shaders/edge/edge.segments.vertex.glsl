#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec4 aSegments;

uniform float uUnitsPerEm;
uniform vec4 uGlyphBounds;


out vec2 vViewBox;
out float vMaxDistance;
out vec4 vSegmentsCoord;
out vec2 vUv;



void main() {
    
    vec4 gb = uGlyphBounds;

    
		
		//gb.xz -= gb.x;
		gb.yw -= gb.y;

		float size = uUnitsPerEm / (gb.z - gb.x) ;

		// float scale = size / uUnitsPerEm;

		// float height = (gb.w - gb.y) * scale;
    // float width = (gb.z - gb.x) * scale;
    
    
		vec2 from = gb.xy / gb.zw;    
    vec2 to = gb.zw / gb.zw;    
		
    vec2 pos = aPosition;  
		
    //pos = mix(from, to, pos);

		
	
    vec2 glpos = mix(vec2(-1.), vec2(1.), pos);


    gl_Position = vec4(glpos, 0., 1.);


    vec2 uv = aPosition;    
		//uv.y -= 1./height * 100. / uUnitsPerEm;
		//uv.x -= 1./height * 50. / uUnitsPerEm;
    
		
    vViewBox = mix(gb.xy, gb.zw, uv);    

    vMaxDistance = uUnitsPerEm;
    vSegmentsCoord = aSegments;    
    

}