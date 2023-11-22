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
    text.split('').forEach((char, j) => {
      
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)
      rowWidth += g.xadvance
      
      // atlas
      const atlasPos = [
        g.x, 
        g.y, 
        g.x + g.width, 
        g.y + g.height
      ]

      atlasPosistions.push(atlasPos)
      
      // glyph
      const glyphPos = [
        // aGlyphBounds
        rowGlyphX,
        i * lineHeight,
        rowGlyphX + g.width,
        (i + 1) + lineHeight,
        // aGlyphSize
        g.width,
        g.height,
        // aGlyphOffset
        g.xoffset,
        g.yoffset
      ]

      glyphPositions.push(glyphPos)

      rowGlyphX += g.xadvance

    })
  
    rowWidthes.push(rowWidth)

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
          
          
          gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 8*4, 0);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribDivisor(1,1);
          
          gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8*4, 4*4);
          gl.enableVertexAttribArray(2);
          gl.vertexAttribDivisor(2,1);

          gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 8*4, 6*4);
          gl.enableVertexAttribArray(3);
          gl.vertexAttribDivisor(3,1);

          
          // atlas pos
          const ap = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, ap);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p.atlasPosistions.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(4);
          gl.vertexAttribDivisor(4,1);



          return vao
        },
        drawCall(gl) {
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, p.glyphPositions.length)
        }
      },

    ], [new WindowUniformsPlugin(gl)]
  )

  r.renderFrame(0)



}