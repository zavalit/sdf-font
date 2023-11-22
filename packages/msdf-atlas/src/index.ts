import chain, {VAOBufferMap, createFramebufferTexture} from '@webglify/chain'
import edgeSegmentsVertex from './shaders/edge/edge.segments.vertex.glsl'
import edgeSegmentsFragment from './shaders/edge/edge.segments.fragment.glsl'
import groupVertexShader from './shaders/edge/edge.group.vertex.glsl'
import groupFragmentShader from './shaders/edge/edge.group.fragment.glsl'

import { AtlasGlyph } from './glyph'
type W2 = WebGL2RenderingContext
type ConfigChar = {
  id: number
  index: number
  char: string
  xadvance: number
  width?: number
  height?: number
  xoffset?: number
  yoffset?: number
  chnl?: number
  x?: number
  y?: number
  page?: number
}

const vertexArrayObject  = (gl: W2, vaoMap: VAOBufferMap) => {

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  

  const pb = gl.createBuffer()!;
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0,1,
      0,0,
      1,1,
      1,0
    ]), gl.STATIC_DRAW)
    
    
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
  
  }  

  const sb = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, sb);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4*4, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribDivisor(1, 1);

  // gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 4*5, 4*4);
  // gl.enableVertexAttribArray(2);
  // gl.vertexAttribDivisor(2, 1);

  vaoMap.set(vao, {
    'position': pb,
    'segments': sb
  })

  return vao

}

const getWhitspaceConfigChar = (ag: AtlasGlyph) => {
  const {glyph} = ag.obtainCharData(` `)
  
  return {
    id: glyph.unicode,
    index: glyph.index,
    xadvance: glyph.advanceWidth,
    char: ` `
  }
}


const calculateCavasSize = (atlasGlyph: AtlasGlyph, charset: string[]) => {
  
  const res = {
    width: 0,
    height: 0,
    glyphMaxWidth: 0,
    glyphMaxHeight: 0
  }
  
  charset.forEach((char, i) => { 

    const {bbox: {width, height}} = atlasGlyph.obtainCharData(char)
    res.width += width
    res.glyphMaxWidth = Math.max(width, res.glyphMaxWidth)
    
    res.height = Math.max(height, res.height)
    res.glyphMaxHeight = Math.max(height, res.glyphMaxHeight)
  
  })

  return res
}

export type AtlasInput = {
  fontUrl: string,
  chars: string
}

export const renderAtlas = async ({fontUrl, chars}: AtlasInput) => {

  const atlasGlyph: AtlasGlyph = await AtlasGlyph.init(fontUrl)
  const canvas = document.createElement('canvas')  
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;
  
  const charset = chars.split('').filter(c => c!= ' ' && c!='\n' && c!='\t')
  const res = calculateCavasSize(atlasGlyph, charset)
  // const res = {
  //   width: 2675,
  //   height: 1000
  // }

  const size = 512
  
  const sdfExponent = 10

  const width = res.width
  const height = res.height
  const canvasWidth = width 
  const canvasHeight = height 
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  
  

  const {programs, renderFrame} = chain(gl, [
    // single sdf target
    {
      passId: 'segments',
  //    framebuffer: [segmentsFBO.framebuffer, null],
      vertexShader: edgeSegmentsVertex,
      fragmentShader: edgeSegmentsFragment,
      vertexArrayObject,
      uniforms (gl, loc) {
        
        gl.uniform1f(loc.uExponent, sdfExponent)
        gl.uniform1f(loc.uUnitsPerEm, atlasGlyph.font.unitsPerEm)
            
      }
     
    },
     //put together 
     {
      passId: 'atlas',
      vertexShader: groupVertexShader,
      fragmentShader: groupFragmentShader,
      //textures: [segmentsFBO.texture!],
      vertexArrayObject,
           
    } 
  ])
  

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  let prevX = 0;
  const pageId = 0;
  const pages = []
  pages[pageId] = canvas
  const config = {
    pages,
    chars: new Map(),
    info: {
      face: atlasGlyph.fontName,
      size: undefined,
      bold: undefined,
      italic: undefined,
      charset,
      unicode: true,
      stretchH: 100,
      smooth: true,
      aa: true,
      padding: [2,2,2,2],
      spacing: [0, 0]      
    },
    common: {
      lineHeight: atlasGlyph.font.ascender - atlasGlyph.font.descender + atlasGlyph.font.tables.os2.sTypoLineGap,
      base: atlasGlyph.font.ascender,
      scaleW: width,
      scaleH: height,
      pages: 1,
      alphaChnl: 0, 
      redChnl: 0, 
      greenChnl: 0, 
      blueChnl: 0
    },
    distanceField: {
      fieldType: 'msdf',
      distanceRange: undefined
    }
  }
  // render a gpyph sprite
  charset.forEach((char, i) => { 

    const charData = atlasGlyph.obtainCharData(char)
    
    const {glyphBounds: [_x,_y,_z,_w], glyph, bbox: {minX, minY}} = charData
    const width = _z - _x
    const height = _w - _y
    
    const x = prevX;
    prevX += width
    const y = canvasHeight - height;

    const segmentsFBO = createFramebufferTexture(gl, [width, height])
    
//     // segments
    programs['segments'].chainDrawCall(0, (gl, props) => {


      const {buffers, uniformLocations} = props
      if(!buffers) {
        throw new Error(`segments draw call pass lacks of buffer or payload data`)
      }
      
              
      const composedData = [];
//      for(let i =0, j=0; i < charData.segments.length; i+=4, j++){
//        const dist = data.segmentsDist && data.segmentsDist[j]
//        const vertexData = [
//          ...data.segmentsCoord.slice(i, i+4), 
//          dist
//        ]
//        composedData.push(...vertexData)
//      }

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.segments)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(charData.segments), gl.DYNAMIC_DRAW)


 
      gl.uniform4fv( uniformLocations.uGlyphBounds, charData.glyphBounds)
      //gl.uniform1f(uniformLocations.uDistance, t.distance!)
      
      //segmentsBlendCb(gl);       
      
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX) 
      
      gl.colorMask(true, true, true, true)
      
       gl.viewport(0, 0, width, height)
       gl.scissor(0, 0, width, height)
      

      //gl.clear(gl.COLOR_BUFFER_BIT)
      // var viewport = gl.getParameter(gl.VIEWPORT);
      // console.log("Viewport state:", viewport);

      gl.bindFramebuffer(gl.FRAMEBUFFER, segmentsFBO.framebuffer)
      // render

      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, charData.segments.length/4)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      
      
    })


    const adjustedSdfItemSize = size;
    
    programs['atlas'].chainDrawCall(0, (gl) => {
      gl.viewport(x, y, width, height)
      gl.bindTexture(gl.TEXTURE_2D, segmentsFBO.texture);

      const r = i%4 === 0
      const g = i%4 === 1 
      const b = i%4 === 2
      const a = i%4 === 3
      //gl.colorMask(r, g, b, a)
      gl.disable(gl.BLEND)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          
    })
    const cc = {
      id: glyph.unicode,
      index: glyph.index,
      char: char,
      width: width,
      height: height,
      xoffset: minX,
      yoffset: minY,
      xadvance: glyph.advanceWidth,
      chnl: undefined,
      x: x,
      y: y,
      page: pageId,
    }
    config.chars.set(cc.id, cc)


  })

  // add whitespace data
  const wsCC = getWhitspaceConfigChar(atlasGlyph)
  config.chars.set(wsCC.id, wsCC)

  return config


  

}
