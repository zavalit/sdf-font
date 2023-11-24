import glyphVertexShader from './shaders/glyph/glyph.vertex.glsl';
import glyphFragmentShader from './shaders/glyph/glyph.fragment.glsl';
import chain, {WindowUniformsPlugin, createTexture} from '@webglify/chain'

const calculateCanvasTextData = (textRows, config, opts: CanvasTextOptions) => {

  const {letterSpacing, closeSpace} = opts
  const {chars, info: {padding}} = config
  const [pt, pr, lb, pl] = padding
  const rowWidthes = []
  const lineHeight = config.common.lineHeight
  
  const glyphPositions = []
  const spaceDiffs = []
  const atlasPosistions = []

  
  textRows.forEach((text, i) => {
  
    

    
    const firstGlyph = chars.get(text.charCodeAt(0));

    // to align on left border
    const alignToStart = firstGlyph.xoffset
    
    let rowGlyphX = alignToStart * -1;
    

    text.split('').forEach((char, j) => {
      
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)


      // atlas
      const atlasPos = [
        g.x, 
        g.y, 
        g.x + g.width, 
        g.y + g.height
      ]

      atlasPosistions.push(atlasPos)
            
      // glyph pos in text      
      
      const isFirstLetter = j === 0
      const isLastLetter = text.length - 1 === j
      const letterSpace = isLastLetter
      ? g.width + g.xoffset
      : g.xadvance * letterSpacing;
                

      const x = rowGlyphX + g.xoffset     
      const y = i * lineHeight
      
      // prepate value for next x
      rowGlyphX += letterSpace
              
      
      // glyph
      const glyphPos = [
        // aGlyphStart
        x, 
        y,
        
        // aGlyphSize
        g.width,
        g.height,
        
        // aGlyphOffset
        g.xoffset,
        g.yoffset,
        
        // aChannel
        g.chnl
      ]

      glyphPositions.push(glyphPos)

      // close space

      // change x and z
      
      // first x stays the same
      let dx = 0;
      if(closeSpace && !isFirstLetter) {
          // calculate previos z
          const pd = glyphPositions[j-1];
          const pg = chars.get(text.charCodeAt(j -1));

          const prevZ = pd[0] + pg.width
          
          dx = (prevZ - x) * .5                
      }
      let dz = 0;
      // last z stays the same
      if(closeSpace && !isLastLetter) {
        // calculate next x
        
        const currentZ = x + g.width
        const ng = chars.get(text.charCodeAt(j+1));

        const nextX = rowGlyphX + ng.xoffset 
        
        dz = (nextX - currentZ) * .5                
      }

      spaceDiffs.push([dx, dz])

    })
  
    //rowWidthes.push(rowWidth - 30  ) // bW
    rowWidthes.push(rowGlyphX)

  })

  const canvasWidth = Math.max(...rowWidthes)
  const canvasHeight = textRows.length * lineHeight

  return {
    res: {canvasWidth, canvasHeight},
    atlasPosistions,
    glyphPositions,
    spaceDiffs,
  }

}

type CanvasTextOptions = {
  letterSpacing: number
  closeSpace: boolean
}

const defaultCanvasTextOptions: CanvasTextOptions = {
  letterSpacing: 1,
  closeSpace: false

}

export const renderCanvasText = (canvas: HTMLCanvasElement, text: string, config, options?: Partial<CanvasTextOptions>) => {

  const textRows = text.split('\n')
  const opts = {...defaultCanvasTextOptions, ...options}

  const {res,...p} = calculateCanvasTextData(textRows, config, opts)

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
          
          
          gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 7*4, 0);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribDivisor(1,1);
          
          gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 7*4, 2*4);
          gl.enableVertexAttribArray(2);
          gl.vertexAttribDivisor(2,1);

          gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 7*4, 4*4);
          gl.enableVertexAttribArray(3);
          gl.vertexAttribDivisor(3,1);


          gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 7*4, 6*4);
          gl.enableVertexAttribArray(4);
          gl.vertexAttribDivisor(4,1);

          
          // atlas pos
          const ap = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, ap);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p.atlasPosistions.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(5);
          gl.vertexAttribDivisor(5,1);

          // space diffs
          const sp = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, sp);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p.spaceDiffs.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(6, 2, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(6);
          gl.vertexAttribDivisor(6,1);

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