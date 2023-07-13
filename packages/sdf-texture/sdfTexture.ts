import segmentsVertex from './shaders/segments/segments.vertex.glsl'
import segmentsFragment from './shaders/segments/segments.fragment.glsl'
import groupVertex from  './shaders/segments/group.vertex.glsl'
import groupFragment from './shaders/segments/group.fragment.glsl'
import metaVertex from  './shaders/meta/meta.vertex.glsl'
import metaFragment from './shaders/meta/meta.fragment.glsl'

import FontSvgApi, {getSegements, codeToGlyph, glyphToPath, FontDataType} from '@webglify/sdf-texture'
import chain, {createFramebuffer, createTexture, convertCanvasTexture} from '@webglify/chain'



export type FontMetaType = {
  unitsPerEm: number
  ascender: number
  descender: number
  capHeight: number
  xHeight: number
  lineGap: number
}
export interface SDFParams {sdfGlyphSize: number, sdfMargin: number,  sdfExponent: number}



interface CharsSDFParams extends SDFParams {
  chars: string
}

const addVertexData  = (gl: WebGL2RenderingContext) => {

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0,0,
    2,0,
    0,2
  ]), gl.STATIC_DRAW)
  
  
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  return vao

}

const renderGpyphSpriteTexture = (gl: WebGL2RenderingContext, charsMeta: CharMeta[], {sdfGlyphSize, sdfExponent, sdfMargin}: SDFParams, fontMeta: FontMetaType): Promise<WebGL2RenderingContext> => {
  const dpr = 2.
  const columnCount = 8
  
  
  const width = columnCount * sdfGlyphSize
  const height = Math.ceil( charsMeta.length / columnCount) * sdfGlyphSize
  const canvasWidth = width / dpr
  const canvasHeight = height / dpr
  
  const STATE: {sdfViewBox?: number[]} = {
    sdfViewBox: undefined
  }

  const segmentsFBO = createFramebuffer(gl, {width: sdfGlyphSize, height: sdfGlyphSize})

  const {programs} = chain(gl, [
    // single letter
    {
      name: 'segments',
      vertexShader: segmentsVertex,
      fragmentShader: segmentsFragment,
      addVertexData,
      addUniformData (gl, prog) {
        const vLoc = gl.getUniformLocation(prog, 'uGlyphBounds')        
        const eLoc = gl.getUniformLocation(prog, 'uExponent')
        const u3 = gl.getUniformLocation(prog, 'uMargin')
        const u4 = gl.getUniformLocation(prog, 'uAscender')
        const u5 = gl.getUniformLocation(prog, 'uDescender')
        const u6 = gl.getUniformLocation(prog, 'uUnitsPerEm')

        return () => {
          gl.uniform4fv(vLoc, STATE.sdfViewBox!)
          gl.uniform1f(eLoc, sdfExponent)
          gl.uniform1f(u3, sdfMargin)
          gl.uniform1f(u4, fontMeta.ascender)
          gl.uniform1f(u5, fontMeta.descender)
          gl.uniform1f(u6, fontMeta.unitsPerEm)


        }
      
      },
      
      drawCall (gl, data) {
          
        const {drawData, buffer} = data!
        const charMeta = drawData

        gl.bindFramebuffer(gl.FRAMEBUFFER, segmentsFBO.framebuffer)


        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)

                  
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(charMeta.lineSegments), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribDivisor(1, 1);
              
        
        gl.clear(gl.COLOR_BUFFER_BIT)
        // render
        
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, charMeta.lineSegments.length/4)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      }    
    },
    //put together 
    {
      name: 'sides',
      canvasWidth,
      canvasHeight,
      vertexShader: groupVertex,
      fragmentShader: groupFragment,
      addVertexData,
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
  charsMeta.forEach((charMeta, i) => { 
    const column = i%columnCount
    const row = Math.floor(i/columnCount)

    STATE.maxDistance = charMeta.maxDistance
    STATE.sdfViewBox = charMeta.sdfViewBox
    
    gl.viewport(0, 0, sdfGlyphSize, sdfGlyphSize)
    segNextDataDrawCall(0, {drawData: charMeta, buffer})

    const x = sdfGlyphSize * column;
    const y = sdfGlyphSize * row
    
    gl.viewport(x, y, sdfGlyphSize, sdfGlyphSize)
    sidesNextDataDrawCall(0)

  })
  gl.finish();

  // var dataURL = gl.canvas.toDataURL("image/png");

  // // Create a link element
  // var link = document.createElement('a');
  // link.download = 'canvas.png';
  // link.href = dataURL;

  // // Append the link to the body
  // document.body.appendChild(link);

  // // Simulate a click on the link
  // link.click();

  // // Remove the link from the body
  // document.body.removeChild(link);


  return Promise.resolve(gl)
  
}



interface CharMeta {
  maxDistance: number
  lineSegments: number[]
  path: string
  sdfViewBox: number[]
  advanceWidth: number
}

class CharsData {
  renderableGlyphCount: number;
  charsMap: Map<number, CharMeta>
  charCodes: number[];
  fontApi;
  fontMeta: FontDataType
  sdfMeta: {sdfGlyphSize: number, sdfMargin: number}
  
  // This regex (instead of /\s/) allows us to select all whitespace EXCEPT for non-breaking white spaces
  static lineBreakingWhiteSpace = `[^\\S\\u00A0]`
  static cmdArgLengths = {
      M: 2,
      L: 2,
      Q: 4,
      C: 6,
      Z: 0
  }

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
      
          return this.add(charCode, index)        
     
      })
  }

  add (charCode: number, index:number) {
      
      const glyphId = codeToGlyph(this.fontApi, charCode)
      const char = String.fromCharCode(charCode)
      const isWhitespace = !!char && new RegExp(CharsData.lineBreakingWhiteSpace).test(char)

      !isWhitespace && this.renderableGlyphCount++
      
      if(!this.charsMap.get(charCode)) {
          const {cmds, crds} = glyphToPath(this.fontApi, glyphId)
           // Build path string
           let path = ''
           let crdsIdx = 0
           for (let i = 0, len = cmds.length; i < len; i++) {
             const numArgs = CharsData.cmdArgLengths[cmds[i]]
             path += cmds[i]
             for (let j = 1; j <= numArgs; j++) {
               path += (j > 1 ? ',' : '') + crds[crdsIdx++]
             }
           }

           

           // Find extents - Glyf gives this in metadata but not CFF, and Typr doesn't
           // normalize the two, so it's simplest just to iterate ourselves.
           let xMin, yMin, xMax, yMax
           if (crds.length) {
             xMin = yMin = Infinity
             xMax = yMax = -Infinity
             for (let i = 0, len = crds.length; i < len; i += 2) {
               let x = crds[i]
               let y = crds[i + 1]
               if (x < xMin) xMin = x
               if (y < yMin) yMin = y
               if (x > xMax) xMax = x
               if (y > yMax) yMax = y
             }
           } else {
             xMin = xMax = yMin = yMax = 0
           }

          // Margin around path edges in SDF, based on a percentage of the glyph's max dimension.
          // Note we add an extra 0.5 px over the configured value because the outer 0.5 doesn't contain
          // useful interpolated values and will be ignored anyway.
          const {sdfGlyphSize, sdfMargin } = this.sdfMeta
          const fontUnitsMargin = 0;//this.fontMeta.unitsPerEm / sdfGlyphSize * (sdfMargin * sdfGlyphSize + .5)

          
          

          const lineSegments = getSegements(path)

          const edgePoints = lineSegments.reduce((acc, n, i) => {
              
            if(i%2 ==1) {
              let {minY, maxY} = acc    
                maxY = maxY < n ? n : maxY
                minY = minY > n ? n : minY

                return {...acc, maxY, minY}
            }else {
              let {minX, maxX} = acc    
              maxX = maxX < n ? n : maxX
              minX = minX > n ? n : minX

              return {...acc, maxX, minX}
            }
              
          }, {minX:0, minY:0, maxX: 0, maxY: 0})

          const sdfViewBox = [ 
            edgePoints.minX,
            edgePoints.minY,
            edgePoints.maxX,
            edgePoints.maxY,
          ]

          const advanceWidth = this.fontApi.hmtx.aWidth[glyphId]

          
          this.charsMap.set(charCode, {
              advanceWidth,
              sdfViewBox,             
              lineSegments,
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
const getCharsMap = (fontData: FontDataType, {sdfGlyphSize, sdfMargin}: SDFParams, chars: string) => {
        
  const charCodes = [...chars].map((_, i) => chars.codePointAt(i))

  const glyphsData = new CharsData(fontData, {sdfGlyphSize, sdfMargin}, charCodes)
  
  const {charsMap, fontMeta} = glyphsData

  return {charsMap, fontMeta}
  
}



export type TextureType = {
  texture: HTMLCanvasElement
  charsMap: any
}



const createSDFTexture = async (canvas: HTMLCanvasElement | OffscreenCanvas, fontUrl: string, params: SDFParams, charCodes: number[]): Promise<TextureType> => {


  const fontData = await initFont(fontUrl)
  const chars = charCodes.map(c => String.fromCodePoint(c)).join('')
  console.log('chars', chars)

  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;


  const os2 = fontData['OS/2']
    

  const {charsMap, fontMeta} = getCharsMap(fontData, params, chars)
  
  const occ: CharMeta[] = [];
  
  charsMap.forEach((v, k) => {    
    occ[k] = v
  });
 

 const rgl = await renderGpyphSpriteTexture(gl, occ, params, fontMeta)

 const sizesMap = occ.reduce((acc, v, i) => ({...acc,[i]:[...v.sdfViewBox, v.advanceWidth] }), {})

  return {
      texture: rgl.canvas as HTMLCanvasElement,
      sizesMap,
      fontMeta,
  }
}

export default createSDFTexture;