import edgeSegmentsVertex from './shaders/segments/edge/edge.segments.vertex.glsl'
import edgeSegmentsFragment from './shaders/segments/edge/edge.segments.fragment.glsl'
import edgeGroupVertex from  './shaders/segments/edge/edge.group.vertex.glsl'
import edgeGroupFragment from './shaders/segments/edge/edge.group.fragment.glsl'


import distanceSegmentsVertex from './shaders/segments/distance/distance.segments.vertex.glsl'
import distanceSegmentsFragment from './shaders/segments/distance/distance.segments.fragment.glsl'
import distanceGroupVertex from  './shaders/segments/distance/distance.group.vertex.glsl'
import distanceGroupFragment from './shaders/segments/distance/distance.group.fragment.glsl'


import FontSvgApi, {getSegements, codeToGlyph, glyphToPath, cmdsToPath, FontDataType} from '@webglify/sdf-texture'
import chain, {createFramebuffer} from '@webglify/chain'


type W2 = WebGL2RenderingContext


export type FontMetaType = {
  unitsPerEm: number
  ascender: number
  descender: number
  capHeight: number
  xHeight: number
  lineGap: number
}
export interface SDFParams {
  sdfItemSize: number
  sdfExponent: number
}


const getTargetsWithDistance = (targets: Target[]) => {
  return targets.map(t => {
    let distance = 0;
    const segmentsDist = []
    for(let j=0; j < t.segmentsCoord.length; j+=4) {
      const[x0, y0, x1, y1] = t.segmentsCoord.slice(j, j+4)
      const dist = Math.hypot(x1-x0, y1-y0)
  
      segmentsDist.push(distance)      
      distance += dist;
    }

    return {...t, segmentsDist, distance}
  })
}

const addVertexData  = (gl: W2) => {

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

export const renderGlyphSpriteTexture = (gl: W2, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: true,
    mirrorInside: true,
    flipTextureY: false
  }

  const shaders = {
    vertexShader: edgeSegmentsVertex,
    fragmentShader: edgeSegmentsFragment,
    groupVertexShader: edgeGroupVertex,
    groupFragmentShader: edgeGroupFragment
  }

  const blendSegmentsCb = (gl: W2) => {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)
  }

  return renderSpriteTexture(gl, targets, sdfParams, renderParams, shaders, blendSegmentsCb, unitsPerEm)
}

export const renderIconSpriteTexture = (gl: W2, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: false,
    mirrorInside: false,
    flipTextureY: true,
  }
  const shaders = {
    vertexShader: edgeSegmentsVertex,
    fragmentShader: edgeSegmentsFragment,
    groupVertexShader: edgeGroupVertex,
    groupFragmentShader: edgeGroupFragment
  }
  const blendSegmentsCb = (gl: W2) => {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)
  }

  return renderSpriteTexture(gl, targets, sdfParams, renderParams, shaders, blendSegmentsCb, unitsPerEm)
}

export const renderIconDistanceSpriteTexture = async (gl: W2, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: false,
    mirrorInside: false,
    flipTextureY: true,
  }
  const shaders = {
    vertexShader: distanceSegmentsVertex,
    fragmentShader: distanceSegmentsFragment,
    groupVertexShader: distanceGroupVertex,
    groupFragmentShader: distanceGroupFragment
  }
  
  const blendSegmentsCb = (gl: W2) => {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquation(gl.MAX) 
  }

  const targetsWithDistance = getTargetsWithDistance(targets)
  

  const r = await renderSpriteTexture(gl, targetsWithDistance, sdfParams, renderParams,shaders, blendSegmentsCb, unitsPerEm);
  console.log(gl.getParameter(gl.VIEWPORT))

  return r
}

export const renderGlyphDistanceSpriteTexture = (gl: W2, targets: Target[], sdfParams, unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  
  const renderParams = {
    isCentered: true,
    mirrorInside: false,
    flipTextureY: false
  }

  const shaders = {
    vertexShader: distanceSegmentsVertex,
    fragmentShader: distanceSegmentsFragment,
    groupVertexShader: distanceGroupVertex,
    groupFragmentShader: distanceGroupFragment
  }
  
  const blendSegmentsCb = (gl: W2) => {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquation(gl.MAX) 
  }
  const targetsWithDistance = getTargetsWithDistance(targets)

  return renderSpriteTexture(gl, targetsWithDistance, sdfParams, renderParams,shaders, blendSegmentsCb, unitsPerEm)
}


const renderSpriteTexture = (gl: W2, targets: Target[], {sdfItemSize, sdfExponent}: SDFParams, {isCentered, mirrorInside, flipTextureY}: RenderParams, shaders, segmentsBlendCb: (gl: W2)=> void,  unitsPerEm: number): Promise<WebGL2RenderingContext> => {
  const dpr = 2.
  const columnCount = 8

  const {
    vertexShader, fragmentShader, groupVertexShader, groupFragmentShader
  } = shaders
  
  
  const width = columnCount * sdfItemSize
  const height = Math.ceil( targets.length / columnCount) * sdfItemSize
  const canvasWidth = width / dpr
  const canvasHeight = height / dpr
  
  const STATE = {
    viewBox: undefined,
    distance: undefined,
  }

  const segmentsFBO = createFramebuffer(gl, {width: sdfItemSize, height: sdfItemSize})
  
  const {programs} = chain(gl, [
    // single sdf target
    {
      name: 'segments',
      vertexShader,
      fragmentShader,
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


        segmentsBlendCb(gl);
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
      vertexShader: groupVertexShader,
      fragmentShader: groupFragmentShader,
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
        
    gl.viewport(0, 0, sdfItemSize, sdfItemSize)
    segNextDataDrawCall(0, {drawData: t, buffer})

    const x = sdfItemSize * column;
    const y = sdfItemSize * row
    
    gl.viewport(x, y, sdfItemSize, sdfItemSize)
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
  sdfMeta: {sdfItemSize: number}
  
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
const getCharsMap = (fontData: FontDataType, {sdfItemSize}: SDFParams, chars: string) => {
        
  const charCodes = [...chars].map((_, i) => chars.codePointAt(i))

  const glyphsData = new CharsData(fontData, {sdfItemSize}, charCodes)
  
  const {charsMap, fontMeta} = glyphsData

  return {charsMap, fontMeta}
  
}


type TexturesDict = {[key in TextureFormat]: (HTMLCanvasElement | OffscreenCanvas)} | {}

export type TexturesType = {
  textures: TexturesDict,
  sdfParams: SDFParams
}
export type GlyphTexturesType = {
  sizesMap: {[key: string]: number[]}
  fontMeta: FontMetaType
} & TexturesType

export type IconTexturesType = {
  itemsCount: number
} & TexturesType


export enum TextureFormat {
  EDGE = 'EDGE',
  DISTANCE = 'DISTANCE'
}
  

export const createGlyphTexture = async (texturesDict: TexturesDict, fontUrl: string, sdfParams: SDFParams, charCodes: number[]): Promise<GlyphTexturesType> => {


  const fontData = await initFont(fontUrl)
  const chars = charCodes.map(c => String.fromCodePoint(c)).join('')


  const {charsMap, fontMeta} = getCharsMap(fontData, sdfParams, chars)
  
  const occ: CharMeta[] = [];
  
  charsMap.forEach((v, k) => {    
    occ[k] = v
  });

  
  const textures = {}
  const edgeCanvas = texturesDict['EDGE']
  if(edgeCanvas){
    const glE = edgeCanvas.getContext('webgl2', {premultipliedAlpha: false})!;
    await renderGlyphSpriteTexture(glE, occ, sdfParams, fontMeta.unitsPerEm)
    textures['EDGE'] = edgeCanvas  
  }
  
  const distCanvas = texturesDict['DISTANCE']
  if(distCanvas){
    const glD = distCanvas.getContext('webgl2', {premultipliedAlpha: false})!;
    await renderGlyphDistanceSpriteTexture(glD, occ, sdfParams, fontMeta.unitsPerEm)
    textures['DISTANCE'] = distCanvas  
  }

    
  const sizesMap = occ.reduce((acc, v, i) => ({...acc,[i]:[...v.viewBox, v.advanceWidth] }), {})

  return {
      textures,
      sizesMap,
      fontMeta,
      sdfParams
  }
}

export const createIconTexture = async (texturesDict: TexturesDict, svgIcon: SVGElement ,sdfParams: SDFParams ): Promise<IconTexturesType> => {

  const pathElements = svgIcon.getElementsByTagName("path");
  const [minX, minY, svgWidth, svgHeight] = svgIcon.getAttribute('viewBox').split(/\s+/).map(v => parseInt(v))
  const viewBox = [ 
    minX,
    minY, 
    minX + svgWidth,
    minY + svgHeight
  ]
  const occ = []
  const itemsCount = pathElements.length
  for (let i = 0; i < itemsCount; i++) {


    const d = pathElements[i].getAttribute("d"); // Logs the 'd' attribute of each path
    const segmentsCoord = getSegements(d)
    
    const t = {segmentsCoord, viewBox}

    
    occ.push(t)

  }

  const unitsPerEm = Math.max(svgWidth, svgHeight)

  const textures = {}
  const edgeCanvas = texturesDict['EDGE']
  if(edgeCanvas){
    const glE = edgeCanvas.getContext('webgl2', {premultipliedAlpha: false})!;
    await renderIconSpriteTexture(glE, occ, sdfParams, unitsPerEm)
    textures['EDGE'] = edgeCanvas  
  }
  
  const distCanvas = texturesDict['DISTANCE']
  if(distCanvas){
    const glD = distCanvas.getContext('webgl2', {premultipliedAlpha: false})!;
    await renderIconDistanceSpriteTexture(glD, occ, sdfParams, unitsPerEm)
    textures['DISTANCE'] = distCanvas  
  }


  return {
      textures,
      sdfParams,
      itemsCount

  }  

}
