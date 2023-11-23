import glyphVertexShader from './shaders/glyph/glyph.vertex.glsl';
import glyphFragmentShader from './shaders/glyph/glyph.fragment.glsl';
import chain, {WindowUniformsPlugin, createTexture} from '@webglify/chain'

const calculateCanvasTextData = (textRows, config) => {

  const {chars} = config
  const rowWidthes = []
  const lineHeight = config.common.lineHeight
  
  const glyphPositions = []
  const atlasPosistions = []
  textRows.forEach((text, i) => {
    let rowWidth = 0
  
    let rowGlyphX = 0

    
    const firstGlyph = chars.get(text.charCodeAt(0));

    // to align on left border
    const alignToStart = firstGlyph.xoffset
    

    text.split('').forEach((char, j) => {
      
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)
      const nextChar = text[j + 1]
      const nextG = nextChar && chars.get(nextChar.charCodeAt(0))
      
      const prevChar = text[j - 1]
      
      const prevG = prevChar && chars.get(prevChar.charCodeAt(0)) || {}
            
      rowWidth += g.xadvance 
      
      // atlas
      const atlasPos = [
        g.x, 
        g.y, 
        g.x + g.width, 
        g.y + g.height
      ]

      atlasPosistions.push(atlasPos)
      
      

      const x = rowGlyphX + g.xoffset - alignToStart     
      const y = i * lineHeight
      const z = rowGlyphX + g.width + g.xoffset - alignToStart
      const w = (i + 1) + lineHeight

      rowGlyphX += g.xadvance

      let altZ = z
      if(nextG) {
         const nextX = rowGlyphX + nextG.xoffset
         altZ = (z + nextX) * .5
         
      }
      
      // glyph
      const glyphPos = [
        // aGlyphBounds
        x, //+ (altZ - z),
        y,
        z,
        w,
        
        // aGlyphSize
        g.width,
        g.height,
        
        // aGlyphOffset
        g.xoffset,
        g.yoffset,
        
        // Channel
        g.chnl
      ]

      glyphPositions.push(glyphPos)


    })
  
    rowWidthes.push(rowWidth - alignToStart)

  })

  const canvasWidth = Math.max(...rowWidthes)
  const canvasHeight = textRows.length * lineHeight

  return {
    res: {canvasWidth, canvasHeight},
    atlasPosistions,
    glyphPositions,
  }

}

export const renderCanvasText = (canvas: HTMLCanvasElement, text: string, config) => {

  const textRows = text.split('\n')


  const {res,...p} = calculateCanvasTextData(textRows, config)

  console.log('p', p)

  const gl = canvas.getContext('webgl2')
  canvas.width = res.canvasWidth
  canvas.height = res.canvasHeight
  const dpr = Math.min(2., window.devicePixelRatio)
  canvas.style.width = `${res.canvasWidth / dpr}px`
  canvas.style.height = `${res.canvasHeight / dpr}px`
  

  const atlasCanvas = config.pages[0]
  const atlasTexture = createTexture(gl, atlasCanvas)
  const atlasRes = [atlasCanvas.width, atlasCanvas.height]

  

  const r = chain(gl,
    [
      {
        vertexShader: glyphVertexShader,
        fragmentShader: glyphFragmentShader,
        textures: [atlasTexture],
        uniforms(gl, locs) {
          gl.uniform2fv(locs.uAtlasResolution, atlasRes);
          gl.uniform1f(locs.uLineHeight, config.common.lineHeight);
          gl.uniform1f(locs.uBaseLine, config.common.base);
          gl.uniform4fv(locs.uPadding, config.info.padding);
          
  
        },
        vertexArrayObject(gl){
          const vao = gl.createVertexArray()!
          gl.bindVertexArray(vao)

          const b1 = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, b1);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0,1,
            0,0,
            1,1,
            1,0
          ]), gl.STATIC_DRAW)

          gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(0);

          // text pos
          const b2 = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, b2);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p.glyphPositions.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 9*4, 0);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribDivisor(1,1);
          
          gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 9*4, 4*4);
          gl.enableVertexAttribArray(2);
          gl.vertexAttribDivisor(2,1);

          gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 9*4, 6*4);
          gl.enableVertexAttribArray(3);
          gl.vertexAttribDivisor(3,1);


          gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 9*4, 8*4);
          gl.enableVertexAttribArray(4);
          gl.vertexAttribDivisor(4,1);

          
          // atlas pos
          const ap = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, ap);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p.atlasPosistions.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(5);
          gl.vertexAttribDivisor(5,1);



          return vao
        },
        drawCall(gl) {

          gl.enable(gl.BLEND)
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, p.glyphPositions.length)
        }
      },

    ], [new WindowUniformsPlugin(gl)]
  )

  r.renderFrame(0)



}