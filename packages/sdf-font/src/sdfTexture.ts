import segmentsVertex from './shaders/segments/segments.vertex.glsl'
import segmentsFragment from './shaders/segments/segments.fragment.glsl'
import groupVertex from  './shaders/segments/group.vertex.glsl'
import groupFragment from './shaders/segments/group.fragment.glsl'
import FontSvgApi, {getSegements, codeToGlyph, glyphToPath, FontDataType} from '@webglify/svg-font'
import chain, {createFramebuffer} from '@webglify/chain'
import { SDFParams } from '.'


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

const renderChainedTextute = (gl: WebGL2RenderingContext, charsMeta: CharMeta[], {sdfGlyphSize, sdfExponent}: SDFParams, columnCount = 8) => {

  const dpr = Math.min(2, window.devicePixelRatio)
  
  const width = columnCount * sdfGlyphSize
  const height = Math.ceil( charsMeta.length / columnCount) * sdfGlyphSize
  const canvasWidth = width / dpr
  const canvasHeight = height / dpr
  
  const STATE: {maxDistance?: number, sdfViewBox?: number[]} = {
    maxDistance: undefined,
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
      const mLoc = gl.getUniformLocation(prog, 'uMaxDistance')        
      const vLoc = gl.getUniformLocation(prog, 'uGlyphBounds')        
      const eLoc = gl.getUniformLocation(prog, 'uExponent')

      return () => {
        gl.uniform1f(mLoc, STATE.maxDistance!)
        gl.uniform4fv(vLoc, STATE.sdfViewBox!)
        gl.uniform1f(eLoc, sdfExponent)
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
  }])


  const segNextDataDrawCall = programs['segments'].nextDataDrawCall
  const sidesNextDataDrawCall = programs['sides'].nextDataDrawCall
  

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

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
  
}



interface CharMeta {
  maxDistance: number
  lineSegments: number[]
  sdfViewBox: number[]
}

class CharsData {
  renderableGlyphCount: number;
  charsMap: Map<number, CharMeta>
  charCodes: number[];
  fontMeta;
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

  constructor (fontMeta, sdfMeta, charCodes: number[]) {
      this.renderableGlyphCount = 0;
      this.charsMap = new Map()
      this.charCodes = charCodes
      this.fontMeta = fontMeta
      this.sdfMeta = sdfMeta

      charCodes.forEach((charCode: number, index:number) => {
      
          return this.add(charCode, index)        
     
      })
  }

  add (charCode: number, index:number) {
      
      const glyphId = codeToGlyph(this.fontMeta, charCode)
      const char = String.fromCharCode(charCode)
      const isWhitespace = !!char && new RegExp(CharsData.lineBreakingWhiteSpace).test(char)

      !isWhitespace && this.renderableGlyphCount++
      
      if(!this.charsMap.get(charCode)) {
          const {cmds, crds} = glyphToPath(this.fontMeta, glyphId)
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
          const fontUnitsMargin = Math.max(xMax - xMin, yMax - yMin)
          / sdfGlyphSize * (sdfMargin * sdfGlyphSize + 0.5)

          
          const sdfViewBox = [
              xMin - fontUnitsMargin,
              yMin - fontUnitsMargin,
              xMax + fontUnitsMargin,
              yMax + fontUnitsMargin,
          ]
          
          const maxDistance =  Math.max(sdfViewBox[2] - sdfViewBox[0], sdfViewBox[3] - sdfViewBox[1])

          const lineSegments = getSegements(path)
          
          this.charsMap.set(charCode, {
              sdfViewBox,             
              maxDistance,
              lineSegments
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
  
  const {charsMap} = glyphsData

  return charsMap
  
}



export type TextureType = {
  texture: HTMLCanvasElement
}



const createSDFTexture = async (gl: WebGL2RenderingContext, fontData: FontDataType, params: SDFParams, chars: string): Promise<TextureType> => {

    
  const charsMap = getCharsMap(fontData, params, chars)
  
  const occ: CharMeta[] = [];
  
  charsMap.forEach((v, k) => {    
    occ[k] = v
  });
 
  renderChainedTextute(gl, occ, params)
  
  return {
      texture: gl.canvas as HTMLCanvasElement
  }
}

export default createSDFTexture;