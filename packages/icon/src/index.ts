import chain, {convertCanvasTexture} from '@webglify/chain'
import {IconTexturesType, TextureFormat} from '@webglify/sdf-texture/sdfTexture'
import iconVertexShader from './shaders/icon.vertex.glsl'
import iconFragmentShader from './shaders/icon.fragment.glsl'





const renderIcon = (canvas, iconTextures: IconTexturesType, uniforms?) => {


  const gl = canvas.getContext('webgl2', {antialias: true})

  const {textures, sdfParams: {sdfItemSize}, itemsCount} = iconTextures

  const edgeCanvas = textures[TextureFormat.EDGE];
  const texSize = [edgeCanvas.width, edgeCanvas.height]

  const edgeTexture = convertCanvasTexture(gl, textures[TextureFormat.EDGE])
  const distanceTexture = convertCanvasTexture(gl, textures[TextureFormat.DISTANCE], (gl) => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  })

  
  const indices = ([...Array(itemsCount).keys()]).map(k => k)
  console.log('indices')

  const {renderFrame} = chain(gl, [
    {
      vertexShader: iconVertexShader,
      fragmentShader: iconFragmentShader,
      textures: [edgeTexture, distanceTexture],
      addVertexData(gl) {
          const vao = gl.createVertexArray()!;
          gl.bindVertexArray(vao)
          
          //
          // Base quad
          //
          const buf1 = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([    
            0, 0, 
            0, 1, 
            1, 0,
            1, 1, 
          ]), gl.STATIC_DRAW)
           
          gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
          gl.enableVertexAttribArray(0);
      
         //
          // Item Path Position
          //          
          const buf2 = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, buf2)                     
          gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
          

          gl.vertexAttribPointer(1, 1, gl.UNSIGNED_SHORT, false, 2, 0);
          gl.enableVertexAttribArray(1)
          gl.vertexAttribDivisor(1, 1)
      

          return vao;
      },
      addUniformData(gl, prog) {

        const u1 = gl.getUniformLocation(prog, 'uItemSize');
        const u2 = gl.getUniformLocation(prog, 'uTextureSize');

        const customUniforms = uniforms || []
        const uniformsNames = Object.keys(customUniforms)

        const locs = uniformsNames.map(name => [name, gl.getUniformLocation(prog, name)])
        
        return () => {
          gl.uniform1f(u1, sdfItemSize)
          gl.uniform2fv(u2, texSize)
          locs.forEach(([name, loc]) => {
            gl.uniform1f(loc, customUniforms[name])
          })
        }
      },
      drawCall(gl) {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, itemsCount)
      }
    },
    
  ])

  const animate = (time) => {
    requestAnimationFrame(animate)
    renderFrame(time)
  }

  animate(0)

}


export default renderIcon