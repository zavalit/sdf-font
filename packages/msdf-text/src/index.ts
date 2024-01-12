import glyphVertexShader from './shaders/glyph.vertex.glsl';
import glyphFragmentShader from './shaders/glyph.fragment.glsl';
import chain, { ChainPassPops, WindowUniformsPlugin, createTexture, FramebufferChainProp} from '@webglify/chain'


 
const calculateAtlasPositions = (textRows, config) => {
  
  const {chars} = config
  const atlasPosistions = []
  
  textRows.forEach((text) => {
  
    text.split('').forEach((char) => {
      
      const unicode = char.charCodeAt(0)
      if(unicode == 32) return
      
      const g = chars.get(unicode)
       
      // atlas
      const atlasPos = [
        g.x, 
        g.y, 
        g.x + g.width, 
        g.y + g.height
      ]

      atlasPosistions.push(atlasPos)
  
      })
    })

    return atlasPosistions
}


const calculateCanvasTextData = (textRows, config, opts: CanvasTextOptions): GlyphData => {

  const {letterSpacing, alignBounds} = opts
  const {chars} = config
  
  const rowWidthes = []
  
  const ff = 1./(config.info.size)
  
  const fontLineHeight = config.common.lineHeight * ff 
  const lineHeight = opts.lineHeight || fontLineHeight  
  
  const padding = config.info.padding.map(p => p * ff)


  const glyphPositions = []
  const heightBounds = []
  const spaceDiffs = []

  const pad = padding[0]

  let ii = 0;
  
  textRows.forEach((text, i) => {
  
    
    let rowGlyphX = 0.;  
    const y = (textRows.length - i - 1 ) * lineHeight

    text.split('').forEach((char, j) => {

      const prevUnicode = text.charCodeAt(j - 1)
      const nextUnicode = text.charCodeAt(j + 1)  
            
      // glyph pos in text      
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)

      
      const isFirstLetter = j === 0 || prevUnicode == 32
      const isLastLetter = text.length - 1 === j || nextUnicode == 32
      
      const letterSpace = isLastLetter
      ? g.xadvance * ff//(g.width + g.xoffset) * ff
      : g.xadvance * letterSpacing * ff;
                  
      if(unicode == 32){
        rowGlyphX += letterSpace        
        glyphPositions[++ii] = undefined
        return
      }      
      
      
      // prepate value for next x
      const x = rowGlyphX + g.xoffset * ff
      const width = g.width * ff - pad;
    
      rowGlyphX += letterSpace        
      
      // glyph
      const glyphPos = [
        // aGlyphStart
        x, 
        y,
        
        // aGlyphSize
        width,
        g.height * ff,
        
        // aGlyphOffset
        g.xoffset * ff,
        g.yoffset * ff,
        
        // aGlyphRowColumn
        i,
        j,

        // aGlyphRowColumnNormalized
        i/(textRows.length - 1),
        j/(text.length - 1),

        // aChannel
        g.chnl
      ]
      heightBounds[ii] = [glyphPos[5], glyphPos[3] + glyphPos[5] - pad]

      glyphPositions[ii] = glyphPos

      // close space

      // change x and z
      
      // first x sticks to canvas start
      let dx = 0;
      // last z sticks to line end
      let dz = 0;
      
      if(alignBounds) {

        // dx
        // first stick to start 
        if(isFirstLetter) {
          
          dx = Math.min(g.xoffset * ff * -1., 0);

        } else if(prevUnicode !== 32) {          
          
          const [prevX, _, prevWidth] = glyphPositions[ii - 1]
          const prevZ = prevX + prevWidth
          dx = (prevZ - x) * .5 
        }

          
        // dz
        // last stick to end 
        if(isLastLetter){
          
          dz = rowGlyphX - (x + width)

        } else if (nextUnicode !== 32) {
          
          const currentZ = x + width
          
          const nextChar = chars.get(text.charCodeAt(j+1));
          const nextX = rowGlyphX + nextChar.xoffset * ff

          dz = (nextX - currentZ) * .5;
        }

      } 

      spaceDiffs.push([dx, dz])
      ii++; 


    })
  

    rowWidthes.push(rowGlyphX)

  })


  // position base line, depending on the line height or/and height align
  const gb = Math.min(...heightBounds.map(g => g[0]))
  const gt = Math.max(...heightBounds.map(g => g[1]))

  const base = opts.alignHeight
  ? lineHeight + gb - (gt - gb)* (lineHeight - 1.) * .5
  : config.common.base * ff * lineHeight / fontLineHeight
  
  
  return {
    rowWidthes,
    glyphPositions: glyphPositions.filter(p => p),
    heightBounds: [gb, gt],
    spaceDiffs,
    lineHeight,
    base,
    padding
  }
}


type CanvasTextOptions = {
  letterSpacing: number
  alignBounds: boolean
  alignHeight: boolean,
  fontSize: number
  lineHeight?: number
}

const defaultCanvasTextOptions: CanvasTextOptions = {
  letterSpacing: 1,
  alignBounds: false,
  alignHeight: false,
  fontSize: 100

}


export const calculateFontSizeByCanvas = (canvas: HTMLCanvasElement, text: string, config, options?: Partial<CanvasTextOptions>) => {

  const textRows = text.split('\n')

  const opts = {...defaultCanvasTextOptions, ...options}
    
  const {rowWidthes} = calculateCanvasTextData(textRows, config, opts)
  
  const maxRowWidth = Math.max(...rowWidthes)
  
  const dpr = Math.min(2., window.devicePixelRatio)

  const fontSize = canvas.width / (maxRowWidth * dpr)

  return fontSize

}

const canvasTextPass = (gl: WebGL2RenderingContext, shaderData: ShaderData): ChainPassPops => {

  const {glyphData, 
    atlasMap,
    atlasCanvas,
    fontSize, 
    passGLSL: {vertexShader, fragmentShader, uniforms, framebuffer, viewport},
  } = shaderData

  const atlasTexture = createTexture(gl, atlasCanvas)
  const atlasRes = [atlasCanvas.width, atlasCanvas.height]

  return {
        vertexShader: vertexShader || glyphVertexShader,
        fragmentShader: fragmentShader || glyphFragmentShader,
        textures: [atlasTexture],
        framebuffer,
        viewport,
        uniforms(gl, locs) {
          gl.uniform2fv(locs.uAtlasResolution, atlasRes);
          gl.uniform1f(locs.uLineHeight, glyphData.lineHeight);
          gl.uniform1f(locs.uBaseLine, glyphData.base);
          gl.uniform4fv(locs.uPadding, glyphData.padding);
          gl.uniform1f(locs.uFontSize, fontSize);

          uniforms && uniforms(gl, locs)
    
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
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glyphData.glyphPositions.flat()), gl.STATIC_DRAW)
          const stride = glyphData.glyphPositions[0].length * 4
          
          gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribDivisor(1,1);
          
          gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 2*4);
          gl.enableVertexAttribArray(2);
          gl.vertexAttribDivisor(2,1);

          gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 4*4);
          gl.enableVertexAttribArray(3);
          gl.vertexAttribDivisor(3,1);


          gl.vertexAttribPointer(4, 2, gl.FLOAT, false, stride, 6*4);
          gl.enableVertexAttribArray(4);
          gl.vertexAttribDivisor(4,1);

          gl.vertexAttribPointer(5, 2, gl.FLOAT, false, stride, 8*4);
          gl.enableVertexAttribArray(5);
          gl.vertexAttribDivisor(5,1);

          gl.vertexAttribPointer(6, 1, gl.FLOAT, false, stride, 10*4);
          gl.enableVertexAttribArray(6);
          gl.vertexAttribDivisor(6,1);

          // atlas pos
          const ap = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, ap);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(atlasMap.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(7);
          gl.vertexAttribDivisor(7,1);

          // space diffs
          const sp = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, sp);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glyphData.spaceDiffs.flat()), gl.STATIC_DRAW)
          
          
          gl.vertexAttribPointer(8, 2, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(8);
          gl.vertexAttribDivisor(8,1);

          return vao
        },
        drawCall(gl) {

          gl.enable(gl.BLEND)
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, glyphData.glyphPositions.length)
        }
      }

}

type GlyphData = {
  lineHeight: number
  glyphPositions: number[][]
  heightBounds: [number, number]
  spaceDiffs: number[][]
  rowWidthes: number[]
  base: number
  padding: number[]
}

type ShaderData = {
  glyphData: GlyphData,
  atlasMap: number[][]
  fontSize: number,
  passGLSL: PassGLSL
  atlasCanvas: HTMLCanvasElement
  

}




type PassGLSL = Pick<ChainPassPops, "vertexShader" | "fragmentShader" | "uniforms" | "framebuffer" | "viewport">

const defatulPassGLSL: PassGLSL = {
  vertexShader: glyphVertexShader,
  fragmentShader: glyphFragmentShader
}

export class MSDFText {
  textRows: string[]
  opts: CanvasTextOptions
  shaderData: ShaderData
  nWidth: number
  nHeight: number
  nBottom: number
  nTop: number

  constructor (textRows: string[], shaderData: ShaderData, opts: CanvasTextOptions) {

    this.textRows = textRows
    this.opts = opts
    this.shaderData = shaderData

    // calculate normalised width & height
    const {rowWidthes, lineHeight, heightBounds} = this.shaderData.glyphData

    this.nBottom = heightBounds[0]
    this.nTop = heightBounds[1]

    this.nWidth = Math.max(...rowWidthes)

    if(opts.alignHeight) {
      this.nHeight = (this.nTop - this.nBottom) * lineHeight * this.textRows.length;
    } else {
      this.nHeight = this.textRows.length * lineHeight;
    }

    
  }

  static init(text: string, config, options?: Partial<CanvasTextOptions>) {
    
    const textRows = text.split('\n')
    const opts = {...defaultCanvasTextOptions, ...options}
    
    const atlasMap = calculateAtlasPositions(textRows, config)
    const glyphData = calculateCanvasTextData(textRows, config, opts)
    
    const shaderData = {
      atlasMap,
      glyphData,
      fontSize: opts.fontSize,
      passGLSL: defatulPassGLSL,
      atlasCanvas: config.pages[0]
    }
    return new MSDFText(textRows, shaderData, opts)
  }

  renderCanvasText (canvas: HTMLCanvasElement)  {
    
    const {fontSize} = this.opts
    
    const canvasWidth = this.nWidth * fontSize
    const canvasHeight = this.nHeight * fontSize;
  
    const gl = canvas.getContext('webgl2')
    const dpr = Math.min(2., window.devicePixelRatio)
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`
    
    const pass = canvasTextPass(gl, this.shaderData)

    const r = chain(gl,
      [pass], 
      [new WindowUniformsPlugin(gl)]
    )

    r.renderFrame(0)
  }

  calculateFontSizeByWidth(width: number)  {

    const dpr = Math.min(2., window.devicePixelRatio)

    return width / (this.nWidth * dpr)
  }


  calculateFontSizeByCanvas (canvas: HTMLCanvasElement)  {

    const dpr = Math.min(2., window.devicePixelRatio)

    const wFontSize = canvas.width / (this.nWidth * dpr)
    const hFontSize = canvas.height / (this.nHeight * dpr)
    
    return Math.min(wFontSize, hFontSize)
  }

  static calculateDrawingBufferSizeByFontSize (mt: MSDFText, fontSize: number): [number, number] {
    const dpr = Math.min(2., window.devicePixelRatio)
    const w = mt.nWidth * fontSize * dpr;
    const h = mt.nHeight * fontSize * dpr;
  
    return [w, h]
  }

  

  updateFontSize (fontSize: number) {
    this.shaderData.fontSize = fontSize
  }

  canvasTextPass (gl: WebGL2RenderingContext, passGLSL?: Partial<PassGLSL>) {

    this.shaderData.passGLSL = {...defatulPassGLSL, ...passGLSL}    
    return canvasTextPass(gl, this.shaderData)    
  
  }
}