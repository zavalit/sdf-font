import textVertexShader from './shaders/glyph/glyph.vertex.glsl';
import textFragmentShader from './shaders/glyph/glyph.fragment.glsl';
import chain, {convertCanvasTexture} from '@webglify/chain'
import {WindowPlugin} from '@webglify/chain'

export interface SDFParams {sdfItemSize: number, sdfMargin: number,  sdfExponent: number}
type W2 = WebGL2RenderingContext

export interface ParamsProps{
  text: string,
  fontSize: number, 
  letterSpacing: number,
  sdfParams: SDFParams 
}


export interface TextCharMeta {
  sdfViewBox: number[]
  advanceWidth: number
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
  fontUnitsMargin: number,
}


export type RenderTextProps = { 
  charCodesData: [number, number][]
   glyphBounds: Float32Array
   sdfItemSize: number
   fontSize: number
   rowHeight: number 
   fontMeta: {
    unitsPerEm: number
    ascender: number
    descender: number
    capHeight: number
    xHeight: number
    lineGap: number
  } }


export const defaultSdfParams = {
  sdfItemSize: 64.,
  sdfExponent: 10.
}

export const defaultTextMeta = {
  fontSize: 16,
  letterSpacing: 1.,
  rowHeight: 20,
}

type TextMetaType = typeof defaultTextMeta
type FontTextureMetaType = {
  atlasMeta: {
    sdfParams: typeof defaultSdfParams,
    columnCount: number    
  },
  fontMeta: {
    unitsPerEm: number
    ascender: number
    descender: number
    capHeight: number
    xHeight: number
    lineGap: number
    charsMeta: {[key: number]: number[]}

  }
}






export const getTextMetaData = (textRows: string[], meta: FontTextureMetaType, textMeta: TextMetaType): RenderTextProps  => {
  
    const {fontMeta, atlasMeta: { sdfParams: { sdfItemSize}}} = meta
    const {fontSize, letterSpacing} = textMeta
    
    const rowHeight = textMeta.rowHeight || fontSize * (1 + fontMeta.lineGap/fontMeta.unitsPerEm)

    const charCodesData = textRows.reduce((acc, text, row) => {
      if(typeof text !== 'string'){
        throw new Error(`text value is wrong: "${text}"`)
      }
      const rowCharCodes = [...text].map((_, i) => {
        const rowIndex = textRows.length - row - 1
        const rowPadding = rowIndex * rowHeight
        return [
          text.codePointAt(i) as number, 
          textRows.length - row - 1,
          rowPadding
        ]
      })

      return [...acc, ...rowCharCodes]
    }, [])
    
    

    const glyphBounds = new Float32Array(charCodesData.length * 4)
    
    let boundsIdx = 0

    const charsMap = meta.fontMeta.charsMeta

    const fontSizeMult = 1. / fontMeta.unitsPerEm
      
    let lineHeight = (fontMeta.ascender - fontMeta.descender + fontMeta.lineGap) / fontMeta.unitsPerEm
    
    // Determine line height and leading adjustments
    lineHeight = lineHeight * fontSize
    const halfLeading = (lineHeight - (fontMeta.ascender - fontMeta.descender) * fontSizeMult) / 2
    let topBaseline = -(fontMeta.ascender * fontSizeMult + halfLeading)
    
    // since there is no multiline now, handle it by default
    topBaseline = 0;
    
  
    
    //const glyphPositions = new Float32Array(renderableGlyphCount * 2)
    const glyphPositions: {xProgress: number}[][] = Array(textRows.length).fill(null).map(() => []);
    
    charCodesData.forEach(([charCode, rowIndex], i: number) => {
      const data = charsMap[charCode]
        if(!data) return
        
        const [xMin, yMin, xMax, yMax, advanceWidth] = data
        const posIndex = glyphPositions[rowIndex].length;
        const x = glyphPositions[rowIndex][posIndex-1]?.xProgress || 0
        const letterSpace = advanceWidth * fontSizeMult
        const xProgress = x + letterSpace - letterSpace * (1. - letterSpacing || 0.)

        glyphPositions[rowIndex][posIndex] = {           
            xProgress
        }
        
        const xMinD = xMin;
        const yMinD = yMin;
        const xMaxD = xMax || 0;
        const yMaxD = yMax || 0;
        
        // Determine final glyph position and add to glyphPositions array
        const posX =  x
        const posY = topBaseline
        
        glyphBounds[boundsIdx++] = posX + xMinD * fontSizeMult
        glyphBounds[boundsIdx++] = posY + yMinD * fontSizeMult
        glyphBounds[boundsIdx++] = posX + xMaxD * fontSizeMult
        glyphBounds[boundsIdx++] = posY + yMaxD * fontSizeMult
        
    })

    
    return {
        glyphBounds,        
        charCodesData,
        sdfItemSize,
        fontMeta,
        fontSize,
        rowHeight
    }
  }




export type ViewportType = {
  x: number,
  y: number,
  width: number,
  height: number
}

export type ColorType = {
  r: number
  g: number
  b: number
}
const BlackColor = {r:0, g:0, b:0}
const uColor = BlackColor

export const passItem = ({glyphMapTexture, framebuffer, glyphBounds, bottomPadding, fontSize, charCodesData, atlasTexture, sdfItemSize, fontMeta, atlasColumnCount, shaders}: any) => {
  
  const fragmentShader = shaders?.fragmentShader || textFragmentShader
  const vertexShader = shaders?.vertexShader || textVertexShader
  return {
    vertexShader,
    fragmentShader,
    textures: [glyphMapTexture!],
    vertexArrayObject(gl: W2){
      
      const vao = gl.createVertexArray()!
      gl.bindVertexArray(vao)
      
      //
      // Base quad
      //
      const buf1 = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([    
        0., 0., 
        0., 1, 
        1, 0.,
        1, 1, 
      ]), gl.STATIC_DRAW)
       
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
      gl.enableVertexAttribArray(0);
  
     
     
      //
      // GlyphBounds
      //          


      console.log('glyphBounds', glyphBounds)
      
      const buf2 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf2)
      gl.bufferData(gl.ARRAY_BUFFER, glyphBounds, gl.STATIC_DRAW)          

      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4*4, 0);
      gl.enableVertexAttribArray(1)
      gl.vertexAttribDivisor(1, 1)
  
      
      //
      // Letter Position
      //          
      const buf3 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf3)       
      console.log('charCodesData', charCodesData)
      const indexes = new Float32Array(charCodesData.flat())
      gl.bufferData(gl.ARRAY_BUFFER, indexes, gl.STATIC_DRAW)
      

      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 3 * 4, 0);
      gl.enableVertexAttribArray(2)
      gl.vertexAttribDivisor(2, 1)

      gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 3 * 4, 4);
      gl.enableVertexAttribArray(4)
      gl.vertexAttribDivisor(4, 1)
  
      //
      // Letter Order
      //          
      const buf4 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf4)       
      const order = new Uint16Array([...Array(charCodesData.length).keys()])
      gl.bufferData(gl.ARRAY_BUFFER, order, gl.STATIC_DRAW)
      

      gl.vertexAttribPointer(3, 1, gl.UNSIGNED_SHORT, false, 2, 0);
      gl.enableVertexAttribArray(3)
      gl.vertexAttribDivisor(3, 1)
  

      return vao;

    },
    uniforms(gl: W2, loc){

          gl.uniform2fv(loc.uSDFTextureSize, [atlasTexture.width, atlasTexture.height])
          gl.uniform1f(loc.uSdfItemSize, sdfItemSize);
          gl.uniform1f(loc.uAscender, fontMeta.ascender/fontMeta.unitsPerEm)
          gl.uniform1f(loc.uDescender, fontMeta.descender/fontMeta.unitsPerEm)
          gl.uniform1f(loc.uAtlasColumnCount, atlasColumnCount)
          gl.uniform1f(loc.uFontSize, fontSize)
          gl.uniform1f(loc.uBottomPadding, bottomPadding)


    },
    drawCall(gl: W2){

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      

      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0., 4, charCodesData.length)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    }

  }
}

const prepareCanvas = (gl, fontSize, glyphBounds, rowsNumber, rowHeight) => {
  const dpr = Math.min(2, window.devicePixelRatio)
  const heightSize = rowsNumber * rowHeight

  const outerX = [];

  for (let i = 2; i < glyphBounds.length; i += 4) {
    outerX.push(glyphBounds[i]);
  }
  const edgeLettersEnd = Math.max(...outerX);
  const widthSize = fontSize * (edgeLettersEnd) + fontSize

  const canvas = gl.canvas as HTMLCanvasElement
  canvas.height = heightSize * dpr;
  canvas.width = widthSize * dpr;
  canvas.style.height = `${heightSize}px`;
  canvas.style.width =  `${widthSize}px`;


} 

export const renderTextCanvas = (gl: W2, textRows, atlasTexture: HTMLCanvasElement, fontTextureMeta: FontTextureMetaType, textMeta?: TextMetaType, shaders?:{} ) => {
  
  const textMetaData =  textMeta || defaultTextMeta
  
  const {charCodesData, sdfItemSize, glyphBounds, fontMeta, fontSize, rowHeight} = getTextMetaData(textRows, fontTextureMeta, textMetaData)
  
  prepareCanvas(gl, fontSize, glyphBounds, textRows.length, rowHeight)
    
  const glyphMapTexture = convertCanvasTexture(gl, atlasTexture)

  const windowPlugin = new WindowPlugin(gl)
  
  const pass = passItem({glyphMapTexture, glyphBounds, charCodesData, atlasTexture, sdfItemSize, fontMeta, fontSize, atlasColumnCount: fontTextureMeta.atlasMeta.columnCount, shaders})
  
  const {renderFrame} = chain(gl, [
    pass  
  ], [windowPlugin])
  
  renderFrame(0)

}



//export {obtainPassChain} from './passchain'