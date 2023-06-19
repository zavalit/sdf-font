import textVertexShader from './shaders/text/text.vertex.glsl';
import textFragmentShader from './shaders/text/text.fragment.glsl';



import FontSvgApi, {getSegements, Typr} from '@webglify/svg-font'


import segmentsVertex from './shaders/segments/segments.vertex.glsl'
import segmentsFragment from './shaders/segments/segments.fragment.glsl'
import groupVertex from  './shaders/segments/group.vertex.glsl'

//import groupFragment from './shaders/segments/group.fragment.glsl'
import groupFragment from './shaders/segments/group.fragment.glsl'

export class Api {

    canvas: HTMLCanvasElement
    gl: WebGL2RenderingContext

    constructor(canvas: HTMLCanvasElement, options?: WebGLContextAttributes) {
        
        this.canvas = canvas
        
        const gl = this.canvas.getContext('webgl2', options)!
        
        if(gl === null) {
            throw new Error('webgl2 is not supported')
        }
        
        this.gl = gl;
        
    }
    
    static init(canvas?: HTMLCanvasElement, options?: WebGLContextAttributes) {
        
        if (!canvas) {
            canvas = document.createElement('canvas')
        }
        
        return new Api(canvas, options)

    }
}

const webgl = (gl, charsMeta: CharMeta[], sdfGlyphSize, sdfExponent, columnCount = 8) => {


    const tWidth = columnCount * sdfGlyphSize
    const tHeight = Math.ceil( sdfGlyphSize * charsMeta.length / columnCount)
   
    const textureSize = {
        width: tWidth,
        height: tHeight
    }

    gl.canvas.width = textureSize.width
    gl.canvas.height = textureSize.height
    const textureUnit = 0
    const position = new Float32Array([
        0,0,
        2,0,
        0,2
    ])

    // create texture for sdf
    const sdfTexture = gl.createTexture()!;
    // bind to global state and specify it
        
    gl.bindTexture(gl.TEXTURE_2D, sdfTexture);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        textureSize.width,
        textureSize.height,
        0, gl.RGBA, gl.UNSIGNED_BYTE, null
      )
    
    {  
        // calculate sdf pro segment
        const frameBuffer = gl.createFramebuffer()!;     
        // switch to Framwebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        // attach sdf texture to framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sdfTexture, 0
        )

       
        // compile shaders
        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, segmentsVertex);    
        gl.compileShader(vs)
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, segmentsFragment);    
        gl.compileShader(fs)
        
        // init porgramm
        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        
        // provide vertex attribute 
        const pb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pb);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW)
        
        
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        {
            // provde lineSegments attribute

            charsMeta.forEach((charMeta, i) => {
                const column = i%columnCount
                const row = Math.floor(i/columnCount)
                const b2 = gl.createBuffer()
                
                gl.bindBuffer(gl.ARRAY_BUFFER, b2)
                gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array(charMeta.lineSegments), gl.DYNAMIC_DRAW)
                gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(1);
                gl.vertexAttribDivisor(1, 1);


                // schedule Program
                gl.useProgram(prog)
                //...
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE)
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)
            
                gl.viewport(column*sdfGlyphSize, row*sdfGlyphSize, sdfGlyphSize, sdfGlyphSize)
                //gl.clear(gl.COLOR_BUFFER_BIT)

                // provide maxDist uniform
                const mLoc = gl.getUniformLocation(prog, 'uMaxDistance')
                gl.uniform1f(mLoc, charMeta.maxDistance)
                
                const vLoc = gl.getUniformLocation(prog, 'uGlyphBounds')
                gl.uniform4fv(vLoc, charMeta.sdfViewBox)

                const eLoc = gl.getUniformLocation(prog, 'uExponent')
                gl.uniform1f(eLoc, sdfExponent)
                
                // render
                gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, charMeta.lineSegments.length/4)
        
            })

            
        }
        
        //gl.bindTexture(gl.TEXTURE_2D, null)
        gl.deleteFramebuffer(frameBuffer)
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }    


    
    //put texture drawn to framebuffer into canvas
   
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, groupVertex);
    gl.compileShader(vs);


    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, groupFragment);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    // providde position attribute
    // put data in a buffer
    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, position,gl.STATIC_DRAW);
    
    //point buffer to attribute
    const pLoc = gl.getAttribLocation(prog, 'aUV');
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pLoc);

    gl.viewport(0, 0, textureSize.width, textureSize.height)
    gl.colorMask(false, false, false, true);

    gl.useProgram(prog);


    // add texture unifoform
    const tPos = gl.getUniformLocation(prog, 'tex');
    gl.uniform1i(tPos, textureUnit)


    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    

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
        
        const glyphId = Typr.U.codeToGlyph(this.fontMeta, charCode)
        const char = String.fromCharCode(charCode)
        const isWhitespace = !!char && new RegExp(CharsData.lineBreakingWhiteSpace).test(char)

        !isWhitespace && this.renderableGlyphCount++
        
        if(!this.charsMap[charCode]) {
            const {cmds, crds} = Typr.U.glyphToPath(this.fontMeta, glyphId)
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
                
             this.charsMap[charCode] = {
                index,
                glyphId,
                advanceWidth: this.fontMeta.hmtx.aWidth[glyphId],
                xMin,
                yMin,
                xMax,
                yMax,
                path,
                pathCommandCount: cmds.length,
                sdfViewBox,
                fontUnitsMargin,
                char,
                isWhitespace,
                maxDistance,
                lineSegments
            }
        }

      
        return this;
    }

   
    get(charCode){
        return this.charsMap[charCode]
    }
}


const getFontMetaData = (typrFont, {text, sdfGlyphSize, sdfMargin, fontSize, letterSpacing}) => {
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
      
    

    const glyphsData = new CharsData(typrFont, {sdfGlyphSize, sdfMargin}, charCodes)
    
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
        charCodes
    }

} 


const getCharsMap = (typrFont, {text, sdfGlyphSize, sdfMargin}) => {
    
    
    const charCodes = [...text].map((_, i) => text.codePointAt(i))          

    const glyphsData = new CharsData(typrFont, {sdfGlyphSize, sdfMargin}, charCodes)
    
    const {charsMap} = glyphsData

    return charsMap
    
}


export const initTypr = async (fontUrl) => {
    
    const fontSvgApi = await FontSvgApi.asyncInit(fontUrl)
    
    const typr = fontSvgApi.parse()

    return typr
    
}


export const createSDFTexture = async (gl, typr, params) => {

    
    const charsMap = getCharsMap(typr, params)
    

    const {sdfExponent, sdfGlyphSize} = params
    const oc = Object.values(charsMap).sort((a,b) => a.index - b.index)
    webgl(gl, oc, sdfGlyphSize, sdfExponent)
    
    
    return {
        texture: gl.canvas
    }
}


export const renderText = (gl, sdfTexture, typr, params, text ) => {
  
    const {texture} = sdfTexture

    const meta = getFontMetaData(typr, {...params, text})
    
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, textVertexShader);
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, textFragmentShader);
    gl.compileShader(fs);
    
    // attach shaders to programm
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    

    // provide attributes
    const bp = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bp)
    const positions = new Float32Array([    
        0, 0, 
        0, 1, 
        1, 0,
        1, 1, 
    ])
    
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    
    //const pLoc = gl.getAttribLocation(prog, 'position');
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribDivisor(0, 0)

   
   
    //
    // GlyphBounds
    //
    
    const b2 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, b2)
    gl.bufferData(gl.ARRAY_BUFFER, meta.glyphBounds, gl.STATIC_DRAW)
    
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4*4, 0);
    gl.enableVertexAttribArray(1)
    gl.vertexAttribDivisor(1, 1)

    
    //
    // Letter Position
    //
    
    const b3 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, b3)     

    const glyphIndexes = meta.charCodes
    
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(glyphIndexes), gl.STATIC_DRAW)
    gl.vertexAttribPointer(2, 1, gl.UNSIGNED_SHORT, false, 2, 0);
    gl.enableVertexAttribArray(2)
    gl.vertexAttribDivisor(2, 1)



    // provide texture
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    const letterTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, letterTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    

    
    // prepare programm
    gl.useProgram(prog)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    
    //uSDFTextureSize
    const stsLoc = gl.getUniformLocation(prog, 'uSDFTextureSize')    
    gl.uniform2fv(stsLoc, [texture.width, texture.height])
  
    
    const u5 = gl.getUniformLocation(prog, 'uColor')    
    gl.uniform3fv(u5, [.1,1.,.0])    

    const projectionMatrix = createProjectionMatrix(gl.canvas.width, gl.canvas.height)
    
    const u7 = gl.getUniformLocation(prog, 'uProjectionMatrix')    
    gl.uniformMatrix4fv(u7, false, projectionMatrix);
    
    const u4 = gl.getUniformLocation(prog, 'uSDFGlyphSize')    
    
    gl.uniform1f(u4, params.sdfGlyphSize)

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    // draw
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0., 4, glyphIndexes.length)

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
