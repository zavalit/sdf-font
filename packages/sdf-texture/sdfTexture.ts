import edgeSegmentsVertex from './shaders/segments/edge/edge.segments.vertex.glsl'
import edgeSegmentsFragment from './shaders/segments/edge/edge.segments.fragment.glsl'
import edgeGroupVertex from  './shaders/segments/edge/edge.group.vertex.glsl'
import edgeGroupFragment from './shaders/segments/edge/edge.group.fragment.glsl'

import FontSvgApi, {getSegements, codeToGlyph, glyphToPath, cmdsToPath, FontDataType} from '@webglify/sdf-texture'
import chain, {createFramebuffer} from '@webglify/chain'



export type FontMetaType = {
  unitsPerEm: number
  ascender: number
  descender: number
  capHeight: number
  xHeight: number
  lineGap: number
}
export interface SDFParams {sdfGlyphSize: number, sdfExponent: number, isCentered: boolean, mirrorInside: boolean}



const addVertexData  = (gl: WebGL2RenderingContext) => {

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0,0,
    10,0,
    0,10
  ]), gl.STATIC_DRAW)
  
  
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  return vao

}

type RenderParams = {
  isCentered: boolean
  mirrorInside: boolean
  flipTextureY: boolean
}

export const renderGlyphSpriteTexture = (gl: WebGL2RenderingContext, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: true,
    mirrorInside: true,
    flipTextureY: false
  }
  return renderSpriteTexture(gl, targets, sdfParams, renderParams, unitsPerEm)
}

export const renderIconSpriteTexture = (gl: WebGL2RenderingContext, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: false,
    mirrorInside: false,
    flipTextureY: true,
  }
  return renderSpriteTexture(gl, targets, sdfParams, renderParams, unitsPerEm)
}

export const renderIconDistanceSpriteTexture = (gl: WebGL2RenderingContext, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: false,
    mirrorInside: false,
    flipTextureY: true,
  }
  return renderSpriteTexture(gl, targets, sdfParams, renderParams, unitsPerEm)
}


const renderSpriteTexture = (gl: WebGL2RenderingContext, targets: Target[], {sdfGlyphSize, sdfExponent}: SDFParams, {isCentered, mirrorInside, flipTextureY}: RenderParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  const dpr = 2.
  const columnCount = 8
  
  
  const width = columnCount * sdfGlyphSize
  const height = Math.ceil( targets.length / columnCount) * sdfGlyphSize
  const canvasWidth = width / dpr
  const canvasHeight = height / dpr
  
  const STATE = {
    viewBox: undefined,
    distance: undefined,
  }

  const segmentsFBO = createFramebuffer(gl, {width: sdfGlyphSize, height: sdfGlyphSize})

  const {programs} = chain(gl, [
    // single sdf target
    {
      name: 'segments',
      vertexShader: edgeSegmentsVertex,
      fragmentShader: edgeSegmentsFragment,
      //fragmentShader: segmentsDistanceFragment,
      addVertexData,
      addUniformData (gl, prog) {
        const u1 = gl.getUniformLocation(prog, 'uGlyphBounds')        
        const u2 = gl.getUniformLocation(prog, 'uExponent')
        const u3 = gl.getUniformLocation(prog, 'uUnitsPerEm')
        const u4 = gl.getUniformLocation(prog, 'uDistance')
        const u5 = gl.getUniformLocation(prog, 'uIsCentered')


        return () => {
          gl.uniform4fv(u1, STATE.viewBox!)
          gl.uniform1f(u2, sdfExponent)
          gl.uniform1f(u3, unitsPerEm)
          gl.uniform1f(u4, STATE.distance)
          gl.uniform1f(u5, isCentered)
        }
      
      },
      
      drawCall (gl, data) {
          
        const {drawData, buffer} = data!

        gl.bindFramebuffer(gl.FRAMEBUFFER, segmentsFBO.framebuffer)


        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)
        //gl.blendEquation(gl.MAX)
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)

        const composedData = [];
        for(let i =0, j=0; i < drawData.segmentsCoord.length; i+=4, j++){
          const dist = drawData.segmentsDist && drawData.segmentsDist[j]
          const vertexData = [
            ...drawData.segmentsCoord.slice(i, i+4), 
            dist
          ]
          composedData.push(...vertexData)
        }
                  
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(composedData), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4*5, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribDivisor(1, 1);
        
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 4*5, 4*4);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribDivisor(2, 1);
              
        
        gl.clear(gl.COLOR_BUFFER_BIT)
        // render
        
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, drawData.segmentsCoord.length/4)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      }    
    },
    //put together 
    {
      name: 'sides',
      canvasWidth,
      canvasHeight,
      vertexShader: edgeGroupVertex,
      fragmentShader: edgeGroupFragment,
      addVertexData,
      addUniformData (gl, prog) {
        const u1 = gl.getUniformLocation(prog, 'uMirrorInside')
        const u2 = gl.getUniformLocation(prog, 'uFlipY')

        return () => {
          gl.uniform1f(u1, mirrorInside)
          gl.uniform1f(u2, flipTextureY)
        }
      
      },
      textures: [segmentsFBO.texture!],
      drawCall (gl)  {
        gl.disable(gl.BLEND)
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }
  ])

  const segNextDataDrawCall = programs['segments'].nextDataDrawCall
  const sidesNextDataDrawCall = programs['sides'].nextDataDrawCall
  

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // render a gpyph sprite
  targets.forEach((t, i) => { 
    const column = i%columnCount
    const row = Math.floor(i/columnCount)

    STATE.viewBox = t.viewBox
    STATE.distance = t.distance
    
    console.log(STATE)
    
    gl.viewport(0, 0, sdfGlyphSize, sdfGlyphSize)
    segNextDataDrawCall(0, {drawData: t, buffer})

    const x = sdfGlyphSize * column;
    const y = sdfGlyphSize * row
    
    gl.viewport(x, y, sdfGlyphSize, sdfGlyphSize)
    sidesNextDataDrawCall(0)

  })
  gl.finish();

  return Promise.resolve(gl)
  
}


interface Target {
  segmentsCoord: number[]
  segmentsDist: number[]
  viewBox: number[]
  distance: number
}


interface CharMeta extends Target{
  path: string
  advanceWidth: number
}

class CharsData {
  renderableGlyphCount: number;
  charsMap: Map<number, CharMeta>
  charCodes: number[];
  fontApi;
  fontMeta: FontDataType
  sdfMeta: {sdfGlyphSize: number}
  
  // This regex (instead of /\s/) allows us to select all whitespace EXCEPT for non-breaking white spaces
  static lineBreakingWhiteSpace = `[^\\S\\u00A0]`


  constructor (fontApi, sdfMeta, charCodes: number[]) {
      this.renderableGlyphCount = 0;
      this.charsMap = new Map()
      this.charCodes = charCodes
      this.fontApi = fontApi
      this.sdfMeta = sdfMeta

      const os2 = fontApi['OS/2']
    
      this.fontMeta = {
        unitsPerEm: fontApi.head.unitsPerEm,
        ascender: os2.sTypoAscender,
        descender: os2.sTypoDescender,
        capHeight: os2.sCapHeight,
        xHeight: os2.sxHeight,
        lineGap: os2.sTypoLineGap,
      };   
        
      charCodes.forEach((charCode: number, index:number) => {
      
          return this.add(charCode)        
     
      })
  }

  add (charCode: number) {
      
      const glyphId = codeToGlyph(this.fontApi, charCode)
      const char = String.fromCharCode(charCode)
      const isWhitespace = !!char && new RegExp(CharsData.lineBreakingWhiteSpace).test(char)

      !isWhitespace && this.renderableGlyphCount++
      
      if(!this.charsMap.get(charCode)) {
          const {cmds, crds} = glyphToPath(this.fontApi, glyphId)
             
          const path = cmdsToPath(cmds, crds)
         
          const segmentsCoord = getSegements(path)

          const edgePoints = segmentsCoord.reduce((acc, n, i) => {
              
            if(i%2 ==1) {
              let {minY, maxY} = acc    
                maxY = typeof maxY === 'undefined' || maxY < n ? n : maxY
                minY = typeof minY === 'undefined' || minY > n ? n : minY

                return {...acc, maxY, minY}
            }else {
              let {minX, maxX} = acc    
              maxX = typeof maxX === 'undefined' || maxX < n ? n : maxX
              minX = typeof minX === 'undefined' || minX > n ? n : minX

              return {...acc, maxX, minX}
            }
              
          }, {minX:0, minY:0, maxX: undefined, maxY: undefined})

          const viewBox = [ 
            edgePoints.minX,
            edgePoints.minY,
            edgePoints.maxX,
            edgePoints.maxY,
          ]

          const advanceWidth = this.fontApi.hmtx.aWidth[glyphId]

          this.charsMap.set(charCode, {
              advanceWidth,
              viewBox,             
              segmentsCoord,
              path
            })
          }
      

    
      return this;
  }

 
  get(charCode){
      return this.charsMap[charCode]
  }
}


export const initFont = async (fontUrl: string) => {
    
  const fontSvgApi = await FontSvgApi.asyncInit(fontUrl)
  
  return fontSvgApi.parse()

  
  
}
const getCharsMap = (fontData: FontDataType, {sdfGlyphSize}: SDFParams, chars: string) => {
        
  const charCodes = [...chars].map((_, i) => chars.codePointAt(i))

  const glyphsData = new CharsData(fontData, {sdfGlyphSize}, charCodes)
  
  const {charsMap, fontMeta} = glyphsData

  return {charsMap, fontMeta}
  
}



export type TextureType = {
  texture: HTMLCanvasElement
  sizesMap: {[key: string]: number[]}
  fontMeta: FontMetaType
}



const createSDFTexture = async (canvas: HTMLCanvasElement | OffscreenCanvas, fontUrl: string, sdfParams: SDFParams, charCodes: number[]): Promise<TextureType> => {


  const fontData = await initFont(fontUrl)
  const chars = charCodes.map(c => String.fromCodePoint(c)).join('')

  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;

  const {charsMap, fontMeta} = getCharsMap(fontData, sdfParams, chars)
  
  const occ: CharMeta[] = [];
  
  charsMap.forEach((v, k) => {    
    occ[k] = v
  });
 

 const rgl = await renderGlyphSpriteTexture(gl, occ, sdfParams, fontMeta.unitsPerEm)

 const sizesMap = occ.reduce((acc, v, i) => ({...acc,[i]:[...v.viewBox, v.advanceWidth] }), {})

  return {
      texture: rgl.canvas as HTMLCanvasElement,
      sizesMap,
      fontMeta,
  }
}

export default createSDFTexture;