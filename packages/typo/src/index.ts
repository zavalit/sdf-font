import textVertexShader from './shaders/glyph/glyph.vertex.glsl';
import textFragmentShader from './shaders/glyph/glyph.fragment.glsl';
import chain, { CustomChainPassPops, createTexture} from '@webglify/chain'
import {WindowUniformsPlugin, VAOBufferMap} from '@webglify/chain'
import { FontMetaType } from '@webglify/sdf-texture/lib/sdfTexture';

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
  textData: number[][]
  glyphData: Float32Array
  sdfItemSize: number
  fontSize: number
  paddingBottom: number,
  rowsCount: number,
  rowInstances: number,
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
  rowInstances: 1,
  paddingBottom: 0.
}

type TextMetaProps = typeof defaultTextMeta
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

export const getTextMetaData = (textRows: string[], meta: FontTextureMetaType, textMeta: TextMetaProps): RenderTextProps  => {
   
  const {fontMeta, atlasMeta: { sdfParams: { sdfItemSize}}} = meta
  const {fontSize, letterSpacing, paddingBottom, rowInstances, rowHeight} = ensureTextMeta(textMeta, fontMeta)
  const columnCount = meta.atlasMeta.columnCount
  

  const rows = textRows;

  const textData = [...rows].reduce((acc, text, row) => {
    if(typeof text !== 'string'){
      throw new Error(`text value is wrong: "${text}"`)
    }
    const rowCharCodes = [...text].map((_, i) => {
      const rowIndex = rows.length - row - 1
      const length = text.length
      return {
        charCode: text.codePointAt(i) as number, 
        rowIndex,
        rowProgress: (i)/(text.length - 1) || 0, // how far in a row
        order: i, // order
        length
      }        
    })

    return [...acc, ...rowCharCodes]
  }, [])


  const textAttributes = textData.map(({rowIndex, ...row}) => {
    
    return [...Array(rowInstances).keys()].map(k => {
    
      const _rowIndex = rowIndex + k;
      const _rowPadding = _rowIndex * rowHeight
      return [_rowIndex, _rowPadding, row.rowProgress, row.order, row.length]
      
    })      
    
  }).flat()
  

  const charsMap = meta.fontMeta.charsMeta

  const fontSizeMult = 1. / fontMeta.unitsPerEm
      
  const glyphPositions: {xProgress: number}[][] = Array(rows.length).fill(null).map(() => []);
  
  const glyphData = textData
  // caluculate glyph positions
  .map(({charCode, rowIndex}) => {
    const data = charsMap[charCode]
      if(!data) return
      
      const [xMin, yMin, xMax, yMax, advanceWidth] = data
      const posIndex = glyphPositions[rowIndex].length;
      const x = glyphPositions[rowIndex][posIndex-1]?.xProgress || 0
      //const letterWidth = xMax - xMin
      //let betweenLetterSpace = (advanceWidth - letterWidth) * fontSizeMult
      let letterSpace = (advanceWidth) * fontSizeMult

      const xProgress = x + letterSpace - letterSpace * (1. - letterSpacing || 0.)
      // const xProgress = x + letterSpace + betweenLetterSpace * letterSpacing;

      glyphPositions[rowIndex][posIndex] = {           
          xProgress
      }
      
      const xMinD = xMin
      const yMinD = yMin || 0;
      const xMaxD = xMax || 0;
      const yMaxD = yMax || 0;
      
      // Determine final glyph position and add to glyphPositions array
      const posX =  x
      const posY = 0
      
      const glyphBounds = [
        posX + xMinD * fontSizeMult,
        posY + yMinD * fontSizeMult,
        posX + xMaxD * fontSizeMult,
        posY + yMaxD * fontSizeMult,
      ]

      return [...glyphBounds, charCode,  xMinD * fontSizeMult]
  })
  // calculate middles between glyphs
  const glyphDistanceData = textData.map((td, i) => {
    
    const glyph = glyphData[i]
    const [x,_,z,] = glyph
    const tdPrev = textData[i-1]
    const prevGlyph = glyphData[i-1]
    const tdNext = textData[i+1]
    const nextGlyph = glyphData[i+1]
    const prevZ = prevGlyph && tdPrev?.rowIndex === td.rowIndex ? prevGlyph[2] : 0
    const nextX = nextGlyph && tdNext?.rowIndex === td.rowIndex ? nextGlyph[0] : z
    let px = (x - prevZ) * .5;
    let pz = (nextX - z) * .5;
    pz = (nextGlyph ? pz : pz + px) || 0;
  
    px = (prevGlyph ? px : Math.max(pz, px)) || 0;

    return [...glyph, px, pz]
  })

  return {
      glyphData: new Float32Array(glyphDistanceData.flat()),        
      textData: textAttributes,
      sdfItemSize,
      rowsCount: rows.length,
      rowInstances,
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

export const passItem = (gl, {atlas, textResolution, glyphData, paddingBottom, fontSize, textData, sdfItemSize, rowInstances, fontMeta, columnCount, rowsCount, rowHeight}: any, pass: CustomChainPassPops = {}) => {
  
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
    vertexArrayObject(gl: W2, vaoMap: VAOBufferMap){
      
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
      // GlyphData
      //          
      
      const buf2 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf2)
      gl.bufferData(gl.ARRAY_BUFFER, glyphData, gl.STATIC_DRAW)          

      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 8*4, 0);
      gl.enableVertexAttribArray(1)
      gl.vertexAttribDivisor(1, rowInstances)

      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 8*4, 4*4);
      gl.enableVertexAttribArray(2)
      gl.vertexAttribDivisor(2, rowInstances)
  
      gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 8*4, 5*4);
      gl.enableVertexAttribArray(5)
      gl.vertexAttribDivisor(5, rowInstances)
  
      gl.vertexAttribPointer(6, 2, gl.FLOAT, false, 8*4, 6*4);
      gl.enableVertexAttribArray(6)
      gl.vertexAttribDivisor(6, rowInstances)
  
      
      //
      // Text Data
      //          

      const buf3 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf3)       
      const indexes = new Float32Array(textData.flat())
      gl.bufferData(gl.ARRAY_BUFFER, indexes, gl.STATIC_DRAW)
      
      gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 5 * 4, 0);
      gl.enableVertexAttribArray(3)
      gl.vertexAttribDivisor(3, 1)

      gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 5 * 4, 4 * 2);
      gl.enableVertexAttribArray(4)
      gl.vertexAttribDivisor(4, 1)

      gl.vertexAttribPointer(7, 1, gl.FLOAT, false, 5 * 4, 4 * 4);
      gl.enableVertexAttribArray(7)
      gl.vertexAttribDivisor(7, 1)



      vaoMap.set(vao, {
        quad: buf1,
        glyphData: buf2,
        textData: buf3
      })

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
      gl.uniform1f(locs.uRowHeight, rowHeight)
      
      
      pass.uniforms && pass.uniforms(gl, locs)

    },
    drawCall(gl: W2){
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0., 4, textData.length)
    }
  }
}


type TextResulutionProps = {
  resolution: [number, number],
  dpr: number,
  maxGylphX: number,
}

const calcTextResolution = (rowsNumber, meta): TextResulutionProps => {
  const {fontSize, glyphData, rowHeight} = meta
  const heightSize = rowsNumber * rowHeight
  const dpr = Math.min(2, window.devicePixelRatio)

  const outerX = [];

  for (let i = 2; i < glyphData.length; i += 8) {
    outerX.push(glyphData[i]);
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

export const renderTextCanvas = (gl: W2, textRows, atlas: HTMLCanvasElement, fontData: FontTextureMetaType, textMeta?: TextMetaProps, customPass: CustomChainPassPops = {} ) => {
  
  
  const textPassMetaData = getTextMetaData(textRows, fontData, textMeta)

  const textResolution = calcTextResolution(textRows.length,textPassMetaData)
  
  prepareCanvas(gl, textResolution)
  
  const pass = passItem(gl, {atlas, textResolution, ...textPassMetaData}, customPass)
  
  const {renderFrame} = chain(gl, [
    pass  
  ], [new WindowUniformsPlugin(gl)])
  
  renderFrame(0)

}

const ensureTextMeta = (textMeta: TextMetaProps, fontMeta: FontMetaType) => {

  const _m = {...defaultTextMeta, ...textMeta}
  const rowHeight = _m.rowHeight || _m.fontSize * (1 + fontMeta.lineGap/fontMeta.unitsPerEm)
  return {..._m, rowHeight}

}


export const getTypoPass = (gl: W2, {textRows, atlas, fontData, textMeta}) => {
  
  const textPassMetaData = getTextMetaData(textRows, fontData, textMeta)

  const textResolution = calcTextResolution(textRows.length,textPassMetaData)
  
  return [(pass: CustomChainPassPops) => {
    return passItem(gl, {atlas, textResolution, ...textPassMetaData}, pass)
  }, textResolution]
}


