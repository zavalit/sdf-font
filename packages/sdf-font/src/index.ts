import textVertexShader from './shaders/text/text.vertex.glsl';
import textFragmentShader from './shaders/text/text.fragment.glsl';
import chain, {convertCanvasTexture} from '@webglify/chain'

import FontSvgApi, { Typr} from '@webglify/svg-font'


class TextData {
    renderableGlyphCount: number;
    charsMap: Map<number, CharMeta>
    charCodes: number[];
    fontMeta;
    sdfMeta: {sdfGlyphSize: number, sdfMargin: number}
    
    // This regex (instead of /\s/) allows us to select all whitespace EXCEPT for non-breaking white spaces
    static lineBreakingWhiteSpace = `[^\\S\\u00A0]`
    
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


      if(this.charsMap[charCode]) return
        
      const glyphId = Typr.U.codeToGlyph(this.fontMeta, charCode)
      const {crds} = Typr.U.glyphToPath(this.fontMeta, glyphId)
    
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
      
          
        this.charsMap[charCode] = {
        
          advanceWidth: this.fontMeta.hmtx.aWidth[glyphId],
          xMin,
          yMin,
          xMax,
          yMax,
          sdfViewBox,
          fontUnitsMargin,                
          
      }
       
    }

   
    get(charCode){
        return this.charsMap[charCode]
    }
}


export const getFontMetaData = (typrFont, {text, sdfGlyphSize, sdfMargin, fontSize, letterSpacing}) => {
    const os2 = typrFont['OS/2']
    
    const fontMeta = {
      unitsPerEm: typrFont.head.unitsPerEm,
      ascender: os2.sTypoAscender,
      descender: os2.sTypoDescender,
      capHeight: os2.sCapHeight,
      xHeight: os2.sxHeight,
      lineGap: os2.sTypoLineGap,
    };
    
    
    const charCodes = [...text].map((_, i) => text.codePointAt(i))
      
    

    const glyphsData = new TextData(typrFont, {sdfGlyphSize, sdfMargin}, charCodes)
    
    const { charsMap } = glyphsData

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
        const {advanceWidth} = charsMap[charCode]
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
    charCodes.forEach((charCode: number, i: number) => {
        const {sdfViewBox} = charsMap[charCode]
        
        // Determine final glyph position and add to glyphPositions array
        const posX = glyphPositions[i].x
        const posY = glyphPositions[i].y
        glyphBounds[boundsIdx++] = posX + sdfViewBox[0] * fontSizeMult
        glyphBounds[boundsIdx++] = posY + sdfViewBox[1] * fontSizeMult
        glyphBounds[boundsIdx++] = posX + sdfViewBox[2] * fontSizeMult
        glyphBounds[boundsIdx++] = posY + sdfViewBox[3] * fontSizeMult
    })


    return {
        glyphBounds,
        charsMap,
        charCodes,
        sdfGlyphSize
    }

} 


export const initTypr = async (fontUrl) => {
    
    const fontSvgApi = await FontSvgApi.asyncInit(fontUrl)
    
    const typr = fontSvgApi.parse()

    return typr
    
}



export const renderText = (gl, sdfTexture, meta ) => {
  
    const {texture} = sdfTexture

    const letterMap = convertCanvasTexture(gl, texture)

    const glyphIndexes = meta.charCodes


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
          const buf2 = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, buf2)
          gl.bufferData(gl.ARRAY_BUFFER, meta.glyphBounds, gl.STATIC_DRAW)          

          gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4*4, 0);
          gl.enableVertexAttribArray(1)
          gl.vertexAttribDivisor(1, 1)
      
          
          //
          // Letter Position
          //          
          const buf3 = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, buf3)                     
          gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(glyphIndexes), gl.STATIC_DRAW)
          
          gl.vertexAttribPointer(2, 1, gl.UNSIGNED_SHORT, false, 2, 0);
          gl.enableVertexAttribArray(2)
          gl.vertexAttribDivisor(2, 1)
      

          return vao;

        },
        addUniformData(gl, prog){

            const u1 = gl.getUniformLocation(prog, 'uSDFTextureSize')    
            
            const u2 = gl.getUniformLocation(prog, 'uColor')    
            
            const projectionMatrix = createProjectionMatrix(gl.canvas.width, gl.canvas.height)            
            const u3 = gl.getUniformLocation(prog, 'uProjectionMatrix')    
            
            const u4 = gl.getUniformLocation(prog, 'uSDFGlyphSize')    
            
            return () => {
              gl.uniform2fv(u1, [texture.width, texture.height])
              gl.uniform3fv(u2, [.1,1.,.0])    
              gl.uniformMatrix4fv(u3, false, projectionMatrix);
              gl.uniform1f(u4, meta.sdfGlyphSize);
            }


        },
        drawCall(gl){
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0., 4, glyphIndexes.length)

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
