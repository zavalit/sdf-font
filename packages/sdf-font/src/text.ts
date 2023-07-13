import textVertexShader from './shaders/text/text.vertex.glsl';
import textFragmentShader from './shaders/text/text.fragment.glsl';
import chain, {convertCanvasTexture} from '@webglify/chain'

export interface SDFParams {sdfGlyphSize: number, sdfMargin: number,  sdfExponent: number}

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




export type RenderTextProps = { charCodes: number[]; glyphBounds: Float32Array; sdfGlyphSize: number; fontMeta: {
    unitsPerEm: number
    ascender: number
    descender: number
    capHeight: number
    xHeight: number
    lineGap: number
  } }


type TextMetaType ={
  text: string
  fontSize: number
  letterSpacing: number
  sdfParams: {
    sdfGlyphSize: number,
    sdfMargin: number
  },
  sizesMap: {[key: number]: [number, number, number, number, number]}
  fontMeta: {
    unitsPerEm: number
    ascender: number
    descender: number
    capHeight: number
    xHeight: number
    lineGap: number
  }
}





export const getTextMetaData = (meta: TextMetaType): RenderTextProps  => {
  
    const {text, fontSize, letterSpacing, fontMeta, sdfParams: {sdfGlyphSize}} = meta
    if(typeof text !== 'string'){
      throw new Error(`text value is wrong: "${text}"`)
    }
    const charCodes = [...text].map((_, i) => {
      return text.codePointAt(i) as number
    })
    
    console.log('meta', meta)
    
    const charsMap = meta.sizesMap

    const fontSizeMult = fontSize / fontMeta.unitsPerEm
      
    let lineHeight = (fontMeta.ascender - fontMeta.descender + fontMeta.lineGap) / fontMeta.unitsPerEm
    
    // Determine line height and leading adjustments
    lineHeight = lineHeight * fontSize
    const halfLeading = (lineHeight - (fontMeta.ascender - fontMeta.descender) * fontSizeMult) / 2
    let topBaseline = -(fontMeta.ascender * fontSizeMult + halfLeading)
    
    // since there is no multiline now, handle it by default
    topBaseline = 0;
    
  
    
    //const glyphPositions = new Float32Array(renderableGlyphCount * 2)
    const glyphPositions: {xProgress: number, x:number, y:number}[] = []    
    
    charCodes.forEach((charCode: number, i: number) => {
      const data = charsMap[charCode]
        if(!data) return
        
        const [xMin, yMin, xMax, yMax, advanceWidth] = data
        const x = glyphPositions[i-1]?.xProgress || 0
        const letterSpace = advanceWidth * fontSizeMult
        const xProgress = x + letterSpace - letterSpace * (1. - letterSpacing || 0.)

        glyphPositions[i] = {
            x,
            y:topBaseline,
            xProgress
        }
    })
  
    const glyphBounds = new Float32Array(charCodes.length * 4)
    
    let boundsIdx = 0
    const d = 0;//fontMeta.unitsPerEm / sdfGlyphSize * (meta.sdfParams.sdfMargin * sdfGlyphSize + .5)
    charCodes.forEach((charCode: number, i: number) => {
        const data = charsMap[charCode]
        if(!data) return
        const [xMin, yMin, xMax, yMax] = data
        
        const xMinD = xMin - d;
        const yMinD = yMin - d;
        const xMaxD = xMax + d;
        const yMaxD = yMax + d;
        
        // Determine final glyph position and add to glyphPositions array
        const posX = glyphPositions[i].x
        const posY = glyphPositions[i].y
        
        glyphBounds[boundsIdx++] = posX + xMinD * fontSizeMult
        glyphBounds[boundsIdx++] = posY + yMinD * fontSizeMult
        glyphBounds[boundsIdx++] = posX + xMaxD * fontSizeMult
        glyphBounds[boundsIdx++] = posY + yMaxD * fontSizeMult
    })


    return {
        glyphBounds,        
        charCodes,
        sdfGlyphSize,
        fontMeta
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

export const renderText = (gl: WebGL2RenderingContext, sdfTexture: {texture: HTMLCanvasElement}, meta: TextMetaType, viewport:ViewportType, color?: ColorType ) => {
  

    const {charCodes, sdfGlyphSize, glyphBounds, fontMeta} = getTextMetaData(meta)
    const letterMap = convertCanvasTexture(gl, sdfTexture.texture)

    const {renderFrame} = chain(gl, [
      {
        vertexShader: textVertexShader,
        fragmentShader: textFragmentShader,
        textures: [letterMap!],
        addVertexData(gl){
          
          const vao = gl.createVertexArray()!
          gl.bindVertexArray(vao)
          
          //
          // Base quad
          //
          const buf1 = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([    
            0, 0, 
            0, 1, 
            1, 0,
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
          gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(charCodes), gl.STATIC_DRAW)
          

          gl.vertexAttribPointer(2, 1, gl.UNSIGNED_SHORT, false, 2, 0);
          gl.enableVertexAttribArray(2)
          gl.vertexAttribDivisor(2, 1)
      

          return vao;

        },
        addUniformData(gl, prog){

            const u1 = gl.getUniformLocation(prog, 'uSDFTextureSize')    
            
            const u2 = gl.getUniformLocation(prog, 'uColor')    

            const uColor = color || BlackColor
            
            const projectionMatrix = createProjectionMatrix(viewport.width, viewport.height)            
            const u3 = gl.getUniformLocation(prog, 'uProjectionMatrix')    
            
            const u4 = gl.getUniformLocation(prog, 'uSDFGlyphSize')    

            const u5 = gl.getUniformLocation(prog, 'uAscender')
            const u6 = gl.getUniformLocation(prog, 'uDescender')
    
           
            
            console.log('texture.width, texture.height', sdfTexture.width, sdfTexture.height)
            return () => {
              gl.uniform2fv(u1, [sdfTexture.width, sdfTexture.height])
              gl.uniform3fv(u2, [uColor.r + 1,uColor.g,uColor.b])    
              gl.uniformMatrix4fv(u3, false, projectionMatrix);
              gl.uniform1f(u4, sdfGlyphSize);
              gl.uniform1f(u5, fontMeta.ascender)
              gl.uniform1f(u6, fontMeta.descender)
            }


        },
        drawCall(gl){
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
          const {x, y, width, height} = viewport
          gl.viewport.call(gl, x, y, width, height);

          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0., 4, charCodes.length)

        }

      }
    ])
    
   renderFrame(0)
 
  }


  function orthographic(left, right, bottom, top, near, far) {
    return [
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, 2 / (near - far), 0,
        -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
    ];
  }



  function createProjectionMatrix(width, height) {
    // Calculate the aspect ratio of the canvas
    var aspectRatio = width / height;

    // Calculate the extents of the viewing volume in the x direction
    var left = -aspectRatio;
    var right = aspectRatio;

    // The extents in the y direction are -1 and 1
    var bottom = -1;
    var top = 1;

    // Create and return the orthographic projection matrix
    //return orthographic(-1, 1, -1, 1, -1, 1);
    return orthographic(left, right, bottom, top, -1, 1);
  
  }
