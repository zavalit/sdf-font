import textVertexShader from './shaders/glyph/glyph.vertex.glsl';
import textFragmentShader from './shaders/glyph/glyph.fragment.glsl';
import chain, { CustomChainPassPops, createTexture} from '@webglify/chain'
import {WindowUniformsPlugin} from '@webglify/chain'

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
  paddingBottom: number,
  rowsCount: number,
  rowHeight: number 
  columnCount: number
  fontMeta: {
    unitsPerEm: number
    ascender: number
    descender: number
    capHeight: number
    xHeight: number
    lineGap: number 
  } 
}


export const defaultSdfParams = {
  sdfItemSize: 64.,
  sdfExponent: 10.
}

export const defaultTextMeta = {
  fontSize: 16,
  letterSpacing: 1.,
  rowHeight: 20,
  paddingBottom: 0.
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
    const columnCount = meta.atlasMeta.columnCount
    
    const rowHeight = textMeta.rowHeight || fontSize * (1 + fontMeta.lineGap/fontMeta.unitsPerEm)
    const paddingBottom = textMeta.paddingBottom || defaultTextMeta.paddingBottom

    const charCodesData = textRows.reduce((acc, text, row) => {
      if(typeof text !== 'string'){
        throw new Error(`text value is wrong: "${text}"`)
      }
      const rowCharCodes = [...text].map((_, i) => {
        const rowIndex = textRows.length - row - 1
        const rowPadding = rowIndex * rowHeight
        const rowData = [
          text.codePointAt(i) as number, 
          textRows.length - row - 1,
          rowPadding,          
          (i)/(text.length - 1) || 0, // how far in a row
          i, // order
        ];

        return rowData
      })

      return [...acc, ...rowCharCodes]
    }, [])
    
    const glyphBounds = new Float32Array(charCodesData.length * 5)
    
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
    
  
    
    const glyphPositions: {xProgress: number}[][] = Array(textRows.length).fill(null).map(() => []);
    
    charCodesData.forEach(([charCode, rowIndex], i: number) => {
      const data = charsMap[charCode]
        if(!data) return
        
        const [xMin, yMin, xMax, yMax, advanceWidth] = data
        const posIndex = glyphPositions[rowIndex].length;
        const x = glyphPositions[rowIndex][posIndex-1]?.xProgress || 0
        const letterWidth = xMax - xMin
        let betweenLetterSpace = (advanceWidth - letterWidth) * fontSizeMult
        let letterSpace = (advanceWidth) * fontSizeMult

        const xProgress = x + letterSpace - letterSpace * (1. - letterSpacing || 0.)
//        const xProgress = x + letterSpace + betweenLetterSpace * letterSpacing;

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
        glyphBounds[boundsIdx++] = xMinD * fontSizeMult
        
    })

    return {
        glyphBounds,        
        charCodesData,
        sdfItemSize,
        rowsCount: textRows.length,
        fontMeta,
        fontSize,
        paddingBottom,
        rowHeight,
        columnCount
        
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

export const passItem = (gl, {atlas, textResolution, glyphBounds, paddingBottom, fontSize, charCodesData, sdfItemSize, fontMeta, columnCount, rowsCount}: any, pass: CustomChainPassPops = {}) => {
  
  const glyphMapTexture = createTexture(gl, atlas)

  const fragmentShader = pass.fragmentShader || textFragmentShader
  const vertexShader = pass.vertexShader || textVertexShader
  const textures = pass.textures || []
  return {
    framebuffer: pass.framebuffer,
    vertexShader,
    fragmentShader,
    resolution: pass.resolution,
    textures: [glyphMapTexture!,...textures],
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

      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 5*4, 0);
      gl.enableVertexAttribArray(1)
      gl.vertexAttribDivisor(1, 1)
  
      gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 5*4, 4*4);
      gl.enableVertexAttribArray(5)
      gl.vertexAttribDivisor(5, 1)
  
      
      //
      // Letter Position
      //          

      console.log('charCodesData', charCodesData)

      const buf3 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf3)       
      const indexes = new Float32Array(charCodesData.flat())
      gl.bufferData(gl.ARRAY_BUFFER, indexes, gl.STATIC_DRAW)
      

      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 5 * 4, 0);
      gl.enableVertexAttribArray(2)
      gl.vertexAttribDivisor(2, 1)

      gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 5 * 4, 4);
      gl.enableVertexAttribArray(3)
      gl.vertexAttribDivisor(3, 1)

      gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 5 * 4, 4 * 3);
      gl.enableVertexAttribArray(4)
      gl.vertexAttribDivisor(4, 1)

      return vao;

    },
    uniforms(gl: W2, locs){

          const glyphSpace = fontMeta.ascender - fontMeta.descender;
          gl.uniform2fv(locs.uSDFTextureSize, [atlas.width, atlas.height])
          gl.uniform1f(locs.uSdfItemSize, sdfItemSize);
          gl.uniform1f(locs.uAscender, fontMeta.ascender/glyphSpace)
          gl.uniform1f(locs.uUnitsPerEm, fontMeta.unitsPerEm/glyphSpace)
          gl.uniform1f(locs.uDescender, fontMeta.descender/glyphSpace)
          gl.uniform1f(locs.uAtlasColumnCount, columnCount)
          gl.uniform1f(locs.uFontSize, fontSize)
          gl.uniform1f(locs.uPaddingLeft, 1/fontSize)
          gl.uniform1f(locs.uPaddingBottom, paddingBottom)          
          gl.uniform2fv(locs.uTextResolution, [...textResolution.resolution])
          gl.uniform1f(locs.uMaxGylphX, textResolution.maxGylphX)
          gl.uniform1f(locs.uRowCount, rowsCount)
          
          pass.uniforms && pass.uniforms(gl, locs)
    },
    drawCall(gl: W2){
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0., 4, charCodesData.length)
    }
  }
}


type TextResulutionProps = {
  resolution: [number, number],
  dpr: number,
  maxGylphX: number,
}

const calcTextResolution = (rowsNumber, meta): TextResulutionProps => {
  const {fontSize, glyphBounds, rowHeight} = meta
  const heightSize = rowsNumber * rowHeight
  const dpr = Math.min(2, window.devicePixelRatio)

  const outerX = [];

  for (let i = 2; i < glyphBounds.length; i += 5) {
    outerX.push(glyphBounds[i]);
  }
  const maxGylphX = Math.max(...outerX);
  const widthSize = fontSize * (maxGylphX)

  return {resolution: [widthSize*dpr, heightSize*dpr], dpr, maxGylphX}
}

const prepareCanvas = (gl, textResolution: TextResulutionProps) => {

  const {resolution: [widthSize, heightSize], dpr} = textResolution

  const canvas = gl.canvas as HTMLCanvasElement
  canvas.height = heightSize;
  canvas.width = widthSize;
  canvas.style.height = `${heightSize/dpr}px`;
  canvas.style.width =  `${widthSize/dpr}px`;


} 

export const renderTextCanvas = (gl: W2, textRows, atlas: HTMLCanvasElement, fontData: FontTextureMetaType, textMeta?: TextMetaType, customPass: CustomChainPassPops = {} ) => {
  
  const textMetaData =  textMeta || defaultTextMeta
  
  const textPassMetaData = getTextMetaData(textRows, fontData, textMetaData)

  const textResolution = calcTextResolution(textRows.length,textPassMetaData)
  
  prepareCanvas(gl, textResolution)
  
  const pass = passItem(gl, {atlas, textResolution, ...textPassMetaData}, customPass)
  
  const {renderFrame} = chain(gl, [
    pass  
  ], [new WindowUniformsPlugin(gl)])
  
  renderFrame(0)

}


export const getTypoPass = (gl: W2, {textRows, atlas, fontData, textMeta}) => {
  const textMetaData =  textMeta || defaultTextMeta
  
  const textPassMetaData = getTextMetaData(textRows, fontData, textMetaData)

  const textResolution = calcTextResolution(textRows.length,textPassMetaData)
  
  return [(pass: CustomChainPassPops) => {
    return passItem(gl, {atlas, textResolution, ...textPassMetaData}, pass)
  }, textResolution]
}


