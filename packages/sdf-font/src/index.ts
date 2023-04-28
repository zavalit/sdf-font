import vertexShader from './shaders/text/card.vertex.debug.glsl';
import fragmentShader from './shaders/text/card.fragment.debug.glsl';



import FontSvgApi, {getSegements, Typr} from '@webglify/svg-font'

import lengthFragment from './shaders/fragment.fbo.glsl'
import mainVertex from './shaders/vertex.fbo.glsl'
import viewportQuadVertex from  './shaders/vertex.glsl'
import postFragment from './shaders/fragment.glsl'

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

const webgl = (gl, charsMeta: CharMeta[], sdfGlyphSize, sdfExponent) => {

    console.log('charsMeta', charsMeta)
    const textureSize = {
        width: charsMeta.length * sdfGlyphSize,
        height: sdfGlyphSize
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

        // gl.activeTexture(gl.TEXTURE0 + textureUnit)
        // gl.bindTexture(gl.TEXTURE_2D, sdfTexture)

        // attach sdf texture to framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sdfTexture, 0
        )

       
        // compile shaders
        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, mainVertex);    
        gl.compileShader(vs)
        console.log('fbo verex status: ', gl.getShaderInfoLog(vs));
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, lengthFragment);    
        gl.compileShader(fs)
        console.log('fbo ragment status: ', gl.getShaderInfoLog(fs));
        
        // init porgramm
        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        
        // provide vertex attribute 
        const pb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pb);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW)
        
        const pLoc = gl.getAttribLocation(prog, 'aUV')
        gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pLoc);
        gl.vertexAttribDivisor(pLoc, 0);

        {
            // provde lineSegments attribute

            charsMeta.forEach((charMeta, i) => {

                const b2 = gl.createBuffer()
                
                gl.bindBuffer(gl.ARRAY_BUFFER, b2)
                gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array(charMeta.lineSegments), gl.DYNAMIC_DRAW)
                const b2l = gl.getAttribLocation(prog, 'aLineSegments');
                gl.vertexAttribPointer(b2l, 4, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(b2l);
                gl.vertexAttribDivisor(b2l, 1);


                // schedule Program
                gl.useProgram(prog)
                //...
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE)
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)
            
                gl.viewport(i*sdfGlyphSize, 0, sdfGlyphSize, sdfGlyphSize)
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
    gl.shaderSource(vs, viewportQuadVertex);
    gl.compileShader(vs);
    console.log('vertex shader status: ', gl.getShaderInfoLog(vs))

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, postFragment);
    gl.compileShader(fs);
    console.log('fragment shader status: ', gl.getShaderInfoLog(fs))

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    console.log('outer program status:', gl.getProgramInfoLog(prog));

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

    gl.useProgram(prog);

    //gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)


    // add texture unifoform
    const tPos = gl.getUniformLocation(prog, 'tex');
    gl.uniform1i(tPos, textureUnit)


    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    
    
    
    const ext = gl.getExtension('GMAN_webgl_memory');
    if(ext) {
        console.log(ext.getMemoryInfo())
    }

    

}


interface CharMeta {
    maxDistance: number
    lineSegments: number[]
    sdfViewBox: number[]
}

class CharsData {
    renderableGlyphCount: number;
    charsMap: Map<number, CharMeta>
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

    constructor (fontMeta, sdfMeta) {
        this.renderableGlyphCount = 0;
        this.charsMap = new Map()
        this.fontMeta = fontMeta
        this.sdfMeta = sdfMeta
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
    
    console.log('typrFont', typrFont, os2)

    const fontMeta = {
      unitsPerEm: typrFont.head.unitsPerEm,
      ascender: os2.sTypoAscender,
      descender: os2.sTypoDescender,
      capHeight: os2.sCapHeight,
      xHeight: os2.sxHeight,
      lineGap: os2.sTypoLineGap,
    };
    
    
    const charCodes = new Uint16Array(
        [...text].map((_, i) => text.codePointAt(i)))
      
    

    const glyphsData = charCodes.reduce((acc: any, charCode: number, index:number) => {
        
        return acc.add(charCode, index)        
   
    }, new CharsData(typrFont, {sdfGlyphSize, sdfMargin}))
    
    const {charsMap, renderableGlyphCount} = glyphsData

    const fontSizeMult = fontSize / fontMeta.unitsPerEm
     // Determine appropriate value for 'normal' line height based on the font's actual metrics
      // TODO this does not guarantee individual glyphs won't exceed the line height, e.g. Roboto; should we use yMin/Max instead?
      
    let lineHeight = (fontMeta.ascender - fontMeta.descender + fontMeta.lineGap) / fontMeta.unitsPerEm
    
    // Determine line height and leading adjustments
    lineHeight = lineHeight * fontSize
    const halfLeading = (lineHeight - (fontMeta.ascender - fontMeta.descender) * fontSizeMult) / 2
    const topBaseline = -(fontMeta.ascender * fontSizeMult + halfLeading)
    
  
    
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
        charsMap
    }

} 


export const createSDFTexture = async (gl, params) => {

    
    const fontSvgApi = await FontSvgApi.asyncInit(params.fontUrl)
    
    const typr = fontSvgApi.parse()
    
    console.log('fontSvgApi', fontSvgApi, params.fontUrl)

    const {glyphBounds, charsMap} = getFontMetaData(typr, params)

    gl.canvas.width = params.sdfWidth
    gl.canvas.height = params.sdfHeight

    console.log('charsMap', charsMap, 'glyphBounds', glyphBounds)
    

    const {sdfExponent, sdfGlyphSize} = params
    const oc = Object.values(charsMap).sort((a,b) => a.index - b.index)
    webgl(gl, oc, sdfGlyphSize, sdfExponent)
    
    
    return {
        texture: gl.canvas,
        meta: {glyphBounds, sdfExponent, sdfGlyphSize}
    }
}


export const renderText = (gl, sdfTexture) => {
    const {texture, meta} = sdfTexture
    console.log('meta', meta)
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);
    console.log('fragment:',gl.getShaderInfoLog(fs))
    
    // attach shaders to programm
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    
    console.log(gl.getProgramInfoLog(prog))
    console.log(gl.getShaderInfoLog(vs));
    
    // provide attributes
    const bp = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bp)
    const positions = new Float32Array([    
        -1, -1, 
        -1, 1, 
        1, -1,
        1, 1, 
    ])
    
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    
    //const pLoc = gl.getAttribLocation(prog, 'position');
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribDivisor(0, 0)

    
    // const barycentric = new Float32Array([
    //     1, 0, 0, 
    //     0, 1, 0, 
    //     0, 0, 1, 
    //     1, 0, 0, 
    //     0, 1, 0, 
    //     0, 0, 1, 
    // ])
    
    // const bb = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, bb)
    
    // gl.bufferData(gl.ARRAY_BUFFER, barycentric, gl.STATIC_DRAW)
    
    // const bLoc = gl.getAttribLocation(prog, 'barycentric');
    // gl.vertexAttribPointer(bLoc, 3, gl.FLOAT, false, 3*4, 0);
    // gl.enableVertexAttribArray(bLoc);
    
    // create the buffer
    const indexBuffer = gl.createBuffer();

    // debug draw
    //drawStateStats(drawStateCanvasGL!, gl)
     
    // make this buffer the current 'ELEMENT_ARRAY_BUFFER'
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
     
    //Fill the current element array buffer with data
    const indices = [
      0, 1, 2,   // first triangle
      2, 1, 3,   // second triangle
    ];
    // const indices = [
    //     0, 2, 1,   // first triangle
    //     2, 3, 1,   // second triangle
    //  ];

    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );
    
    //
    // provide UV attrib
    //
    const b4 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b4)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0,0,
        0,1,
        1,0,
        1,1
    ]), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 2*4, 0)
    gl.enableVertexAttribArray(4)
    gl.vertexAttribDivisor(4, 0)


    
    //
    // GlyphBounds
    //
    
    console.log('meta.glyphBounds', meta.glyphBounds)
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

    const b3Data = [...Array(meta.glyphBounds.length/4)].map((_, i) => i)
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(b3Data), gl.STATIC_DRAW)
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


    // // glyphIndex
    // const gilLoc = gl.getUniformLocation(prog, 'uGlyphIndex')    
    // gl.uniform1f(gilLoc, 0)

    //uTroikaSDFTextureSize
    const stsLoc = gl.getUniformLocation(prog, 'uSDFTextureSize')    
    gl.uniform2fv(stsLoc, [texture.width, texture.height])
    console.log(' [texture.width, texture.height]',  [texture.width, texture.height])

    // console.log('meta', meta)
    // //uSDFExponent
    // const sesLoc = gl.getUniformLocation(prog, 'uSDFExponent')    
    // gl.uniform1f(sesLoc, meta.sdfExponent)

    // //uSDFGlyphSize
    // const sgsLoc = gl.getUniformLocation(prog, 'uSDFGlyphSize')    
    // gl.uniform1f(sgsLoc, meta.sdfGlyphSize)

    //uGlyphBounds
    // const gbLoc = gl.getUniformLocation(prog, 'aGlyphBounds')    
    // gl.uniform4fv(gbLoc, [...meta.glyphBounds])
    // console.log('meta.glyphBounds', [...meta.glyphBounds])

    //uGlyphBounds
    const arLoc = gl.getUniformLocation(prog, 'uResolution')    
    gl.uniform2fv(arLoc, [gl.canvas.width, gl.canvas.height])
    console.log('uResolution', [gl.canvas.width, gl.canvas.height])

    const u3 = gl.getUniformLocation(prog, 'uSDFExponent')    
    gl.uniform1f(u3, meta.sdfExponent)

    const u5 = gl.getUniformLocation(prog, 'uColor')    
    gl.uniform3fv(u5, [.1,1.,.0])

    const u6 = gl.getUniformLocation(prog, 'uFontSize')    
    gl.uniform1f(u6, meta.fontSize)
    console.log('meta.fontSize', meta.fontSize)

    const u4 = gl.getUniformLocation(prog, 'uTroikaSDFGlyphSize')    
    gl.uniform1f(u4, meta.sdfGlyphSize)

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    // const uclLoc = gl.getUniformLocation(prog, 'uClipRect')    
    // gl.uniform4fv(uclLoc, meta.clipRect)
    
    // draw
    //gl.drawRangeElements(gl.TRIANGLES, 0,6,-1, gl.UNSIGNED_BYTE, 0);
    gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, b3Data.length)

}