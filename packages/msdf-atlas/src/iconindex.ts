import chain, {VAOBufferMap, createFramebufferTexture} from '@webglify/chain'
import iconSegmentsVertex from './shaders/icon/icon.segments.vertex.glsl'
import iconSegmentsFragment from './shaders/icon/icon.segments.fragment.glsl'
import groupVertexShader from './shaders/icon/icon.group.vertex.glsl'
import groupFragmentShader from './shaders/icon/icon.group.fragment.glsl'



type W2 = WebGL2RenderingContext

const vertexArrayObject  = (gl: W2, vao: WebGLVertexArrayObject, vaoMap: VAOBufferMap) => {

  
  const pb = gl.createBuffer()!;
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0,1,
      0,0,
      1,1,
      1,0
    ]), gl.STATIC_DRAW)
    
    
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
  
  }  

  const sb = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, sb);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4*4, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribDivisor(1, 1);

  
  vaoMap.set(vao, {
    'position': pb,
    'segments': sb
  })

  return vao

}


const defaultRenderOptions = {
  sdfExponent: 10,
  padding: 50  
}


export const renderIcon = async (data, inputOptions, res): Promise<HTMLCanvasElement> => {

  const options = {...defaultRenderOptions, ...inputOptions}

  
  const canvas = document.createElement('canvas')  
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;
  
  
  
  const [width, height] = res
  
  const canvasWidth = width 
  const canvasHeight = height 
  canvas.width = canvasWidth
  canvas.height = canvasHeight

    // render a gpyph sprite
    const segmentsFBO = createFramebufferTexture(gl, [width, height])

  

    const {programs} = chain(gl, [
      // single sdf target
      {
        passId: 'segments',
    //    framebuffer: [segmentsFBO.framebuffer, null],
        vertexShader: iconSegmentsVertex,
        fragmentShader: iconSegmentsFragment,
        vertexArrayObject,
        uniforms (gl, loc) {
          
          gl.uniform1f(loc.uExponent, options.sdfExponent)
          gl.uniform1f(loc.uUnitsPerEm, Math.max(width, height))
              
        }
      
      },
      //put together 
      {
        passId: 'atlas',
        vertexShader: groupVertexShader,
        fragmentShader: groupFragmentShader,
        //textures: [segmentsFBO.texture!],
        vertexArrayObject,
            
      } 
    ])
  

    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  

    
    
     // segments
    programs['segments'].chainDrawCall({frame:0, elapsedTime:0}, (gl, props) => {


    const {buffers, uniformLocations} = props
    if(!buffers) {
      throw new Error(`segments draw call pass lacks of buffer or payload data`)
    }              
   

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.segments)
    const seg = new Float32Array(data.segments)
    console.log('seg', seg, data.bounds)
    gl.bufferData(gl.ARRAY_BUFFER, seg, gl.DYNAMIC_DRAW)


    
    gl.uniform4fv( uniformLocations.uGlyphBounds, data.bounds)
    gl.uniform2fv(uniformLocations.uItemResolution, [width, height])
    
            
    
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX) 
    
    
    

    gl.bindFramebuffer(gl.FRAMEBUFFER, segmentsFBO.framebuffer)
    // render

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, data.segments.length/4)
   gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    
    
  })


    
  programs['atlas'].chainDrawCall({frame:0, elapsedTime:0}, (gl) => {
  
    gl.bindTexture(gl.TEXTURE_2D, segmentsFBO.texture);

    
    gl.disable(gl.BLEND)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
  })
 

  return canvas


}

 

  


