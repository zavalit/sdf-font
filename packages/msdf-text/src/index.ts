import glyphVertexShader from './shaders/glyph.vertex.glsl'
import glyphFragmentShader from './shaders/glyph.fragment.glsl'
import chain, {
  type ChainPassPops,
  CanvasUniformsPlugin,
  createTexture
} from '@webglify/chain'

type AtlasPosition = [number, number, number, number]
type AtlasPositions = AtlasPosition[]
const calculateAtlasPositions = (textRows, config): AtlasPositions => {
  const { chars } = config
  const atlasPosistions: AtlasPositions = []

  textRows.forEach((text) => {
    text.split('').forEach((char) => {
      const unicode = char.charCodeAt(0)
      if (unicode === 32) return

      const g = chars.get(unicode)

      // atlas
      const atlasPos: AtlasPosition = [g.x, g.y, g.x + g.width, g.y + g.height]

      atlasPosistions.push(atlasPos)
    })
  })

  return atlasPosistions
}

const calculateCanvasTextData = (
  textRows,
  config,
  opts: CanvasTextOptions
): GlyphData => {
  const { letterSpacing, alignBounds } = opts
  const { chars } = config

  const rowWidthes = []

  const ff = 1 / config.info.size

  const padding = config.info.padding.map((p) => p * ff)

  const glyphPositions: any[] = []
  const heightBounds: Array<[number, number]> = []
  const spaceDiffs: any = []

  const pad = padding[0]

  let ii = 0

  // find glyph min and max
  textRows.forEach((text, i) => {
    text.split('').forEach((char, j) => {
      // glyph pos in text
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)
      if(g.yoffset) {
        heightBounds.push([g.yoffset * ff, g.height * ff + g.yoffset * ff - pad])
      }
      
      
    })
  })

  // position base line, depending on the line height or/and height align
  const gb = Math.min(...heightBounds.map((g) => g[0]))
  const gt = Math.max(...heightBounds.map((g) => g[1]))

  const coreLineHeight = config.common.lineHeight * ff;
  const paddingHeight = 1 + opts.relativePaddingHeight
  const paddingSide = coreLineHeight * opts.relativePaddingWidth * .5;
  const lineHeight = coreLineHeight * paddingHeight

  ii = 0

  textRows.forEach((text, i) => {
    let rowGlyphX = paddingSide
    const y = (textRows.length - i - 1) * lineHeight

    text.split('').forEach((char, j) => {
      const prevUnicode = text.charCodeAt(j - 1)
      const nextUnicode = text.charCodeAt(j + 1)

      // glyph pos in text
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)

      const isFirstLetter = j === 0 || prevUnicode === 32
      const isLastLetter = text.length - 1 === j || nextUnicode == 32

      const letterSpace = isLastLetter
        ? g.xadvance * ff
        : g.xadvance * letterSpacing * ff

      if (unicode == 32) {
        rowGlyphX += letterSpace
        glyphPositions[++ii] = undefined
        return
      }

      // prepate value for next x
      const x = rowGlyphX + g.xoffset * ff
      const width = g.width * ff - pad

      rowGlyphX += letterSpace

      // glyph
      const glyphPos = [
        // aGlyphStart
        x,
        y,

        // aGlyphSize
        width,
        g.height * ff,

        // aGlyphOffset
        g.xoffset * ff,
        g.yoffset * ff,

        // aGlyphRowColumn
        j,
        i,

        // aGlyphRowColumnNormalized
        j / (text.length - 1),
        i / (textRows.length - 1),

        // aChannel
        g.chnl
      ]

      glyphPositions[ii] = glyphPos

      // close space

      // change x and z

      let dx = 0;
      // first x take a padding
      if (isFirstLetter) {
        dx = -paddingSide;
      }
      // last z sticks to line end
      let dz = 0
      // last z take a padding
      if (isLastLetter) {
        dz = paddingSide;
      }

      if (alignBounds) {
        // dx
        // first stick to start
        if (isFirstLetter) {
          dx = Math.min(g.xoffset * ff * -1 - paddingSide, 0)
        } else if (prevUnicode !== 32) {
          const [prevX, , prevWidth] = glyphPositions[ii - 1]
          const prevZ = prevX + prevWidth
          dx = (prevZ - x) * 0.5
        }

        // dz
        // last stick to end
        if (isLastLetter) {
          dz = rowGlyphX - (x + width) + paddingSide
        } else if (nextUnicode !== 32) {
          const currentZ = x + width

          const nextChar = chars.get(text.charCodeAt(j + 1))
          const nextX = rowGlyphX + nextChar.xoffset * ff

          dz = (nextX - currentZ) * 0.5
        }
      }

      spaceDiffs.push([dx, dz])
      ii++
    })

    rowWidthes.push(rowGlyphX + paddingSide)
  })

  //const ln = lineHeight + gb - (gt - gb) * ((opts.lineHeight || 1) - 1) * 0.5
  const fontLineHeight = opts.alignHeight ? (gt - gb) * paddingHeight : lineHeight;
  
  const basePadding =  (paddingHeight - 1.) * .5
  const base = opts.alignHeight ? gt + (gt - gb) * basePadding: config.common.base * ff * (1. + basePadding)

  

  return {
    rowWidthes,
    glyphPositions: glyphPositions.filter((p) => p),
    heightBounds: [gb, gt],
    spaceDiffs,
    textLineHeight: opts.textLineHeight,
    fontLineHeight,
    base,
    padding
  }
}

interface CanvasTextOptions {
  letterSpacing: number
  alignBounds: boolean
  alignHeight: boolean
  relativePaddingHeight: number
  relativePaddingWidth: number
  fontSize: number
  textLineHeight: number

}

const defaultCanvasTextOptions: CanvasTextOptions = {
  letterSpacing: 1,
  alignBounds: false,
  alignHeight: false,
  relativePaddingHeight: 0,
  relativePaddingWidth: 0,
  fontSize: 100,
  textLineHeight: 1
}

export const calculateFontSizeByCanvas = (
  canvas: HTMLCanvasElement,
  text: string,
  config,
  options?: Partial<CanvasTextOptions>
) => {
  const textRows = text.split('\n')

  const opts = { ...defaultCanvasTextOptions, ...options }

  const { rowWidthes } = calculateCanvasTextData(textRows, config, opts)

  const maxRowWidth = Math.max(...rowWidthes)

  const dpr = Math.min(2, window.devicePixelRatio)

  const fontSize = canvas.width / (maxRowWidth * dpr)

  return fontSize
}

const canvasTextPass = (
  gl: WebGL2RenderingContext,
  shaderData: ShaderData
): ChainPassPops => {
  const {
    glyphData,
    atlasMap,
    atlasCanvas,
    fontSize,
    passGLSL: { vertexShader, fragmentShader, uniforms, framebuffer, viewport }
  } = shaderData

  const atlasTexture = createTexture(gl, atlasCanvas)
  const atlasRes = [atlasCanvas.width, atlasCanvas.height]
  const count = glyphData.glyphPositions.length
  return {
    vertexShader: vertexShader || glyphVertexShader,
    fragmentShader: fragmentShader || glyphFragmentShader,
    textures: [atlasTexture],
    framebuffer,
    uniforms (gl, locs) {
      gl.uniform2fv(locs.uAtlasResolution, atlasRes)
      gl.uniform1f(locs.uFontLineHeight, glyphData.fontLineHeight)
      gl.uniform1f(locs.uLineHeight, glyphData.textLineHeight)
      gl.uniform1f(locs.uBaseLine, glyphData.base)
      gl.uniform4fv(locs.uPadding, glyphData.padding)
      gl.uniform1f(locs.uFontSize, fontSize)

      uniforms && uniforms(gl, locs)
    },
    vertexArrayObject (gl, vao) {
      const b1 = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, b1)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]),
        gl.STATIC_DRAW
      )

      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(0)

      // text pos
      {
        const b2 = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, b2)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(glyphData.glyphPositions.flat()),
          gl.STATIC_DRAW
        )
        const stride = glyphData.glyphPositions[0].length * 4

        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0)
        gl.enableVertexAttribArray(1)
        gl.vertexAttribDivisor(1, 1)

        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 2 * 4)
        gl.enableVertexAttribArray(2)
        gl.vertexAttribDivisor(2, 1)

        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 4 * 4)
        gl.enableVertexAttribArray(3)
        gl.vertexAttribDivisor(3, 1)

        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, stride, 6 * 4)
        gl.enableVertexAttribArray(4)
        gl.vertexAttribDivisor(4, 1)

        gl.vertexAttribPointer(5, 2, gl.FLOAT, false, stride, 8 * 4)
        gl.enableVertexAttribArray(5)
        gl.vertexAttribDivisor(5, 1)

        gl.vertexAttribPointer(6, 1, gl.FLOAT, false, stride, 10 * 4)
        gl.enableVertexAttribArray(6)
        gl.vertexAttribDivisor(6, 1)

        // atlas pos
        const ap = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, ap)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(atlasMap.flat()),
          gl.STATIC_DRAW
        )

        gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(7)
        gl.vertexAttribDivisor(7, 1)

        // space diffs
        const sp = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, sp)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(glyphData.spaceDiffs.flat()),
          gl.STATIC_DRAW
        )

        gl.vertexAttribPointer(8, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(8)
        gl.vertexAttribDivisor(8, 1)
      }
      return vao
    },
    drawCall (gl) {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
    }
  }
}

interface GlyphData {
  fontLineHeight: number
  textLineHeight: number
  glyphPositions: number[][]
  heightBounds: [number, number]
  spaceDiffs: number[][]
  rowWidthes: number[]
  base: number
  padding: number[]
}

interface ShaderData {
  glyphData: GlyphData
  atlasMap: number[][]
  fontSize: number
  passGLSL: PassGLSL
  atlasCanvas: HTMLCanvasElement
}

type PassGLSL = Pick<
ChainPassPops,
'vertexShader' | 'fragmentShader' | 'uniforms' | 'framebuffer' | 'viewport'
>

const defatulPassGLSL: PassGLSL = {
  vertexShader: glyphVertexShader,
  fragmentShader: glyphFragmentShader
}

export class MSDFText {
  textRows: string[]
  opts: CanvasTextOptions
  shaderData: ShaderData
  nWidth: number
  nHeight: number
  nBottom: number
  nTop: number

  constructor (
    textRows: string[],
    shaderData: ShaderData,
    opts: CanvasTextOptions
  ) {
    this.textRows = textRows
    this.opts = opts
    this.shaderData = shaderData

    // calculate normalised width & height
    const { rowWidthes, textLineHeight, fontLineHeight, heightBounds } = this.shaderData.glyphData

    this.nBottom = heightBounds[0]
    this.nTop = heightBounds[1]

    this.nWidth = Math.max(...rowWidthes)

    if (opts.alignHeight) {
      this.nHeight =
        (this.nTop - this.nBottom) *
        (opts.lineHeight || 1) *
        this.textRows.length
    } else {
      this.nHeight = this.textRows.length * fontLineHeight
    }
  }

  static init (text: string, config, options?: Partial<CanvasTextOptions>) {
    const textRows = text.split('\n')
    const opts = { ...defaultCanvasTextOptions, ...options }

    const atlasMap = calculateAtlasPositions(textRows, config)
    const glyphData = calculateCanvasTextData(textRows, config, opts)

    const shaderData = {
      atlasMap,
      glyphData,
      fontSize: opts.fontSize,
      passGLSL: defatulPassGLSL,
      atlasCanvas: config.pages[0]
    }
    return new MSDFText(textRows, shaderData, opts)
  }

  renderCanvasText (canvas: HTMLCanvasElement) {
    const { fontSize } = this.opts

    const canvasWidth = this.nWidth * fontSize
    const canvasHeight = this.shaderData.glyphData.textLineHeight * fontSize

    const gl = canvas.getContext('webgl2')!
    const dpr = Math.min(2, window.devicePixelRatio)
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr

    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`

    const pass = canvasTextPass(gl, this.shaderData)

    const r = chain(gl, [pass], [new CanvasUniformsPlugin(canvas)])

    r.renderFrame({ frame: 0, elapsedTime: 0 })
  }

  calculateFontSizeByWidth (width: number) {
    const dpr = Math.min(2, window.devicePixelRatio)

    return width / (this.nWidth * dpr)
  }

  calculateFontSizeByCanvas (canvas: HTMLCanvasElement) {
    const dpr = Math.min(2, window.devicePixelRatio)

    const wFontSize = canvas.width / (this.nWidth * dpr)
    const hFontSize = canvas.height / (this.nHeight * dpr)
    return Math.min(wFontSize, hFontSize)
  }

  static calculateDrawingBufferSizeByFontSize (
    mt: MSDFText,
    fontSize: number
  ): [number, number] {
    const dpr = Math.min(2, window.devicePixelRatio)
    const w = mt.nWidth * fontSize * dpr
    const h = mt.nHeight * fontSize * dpr

    return [w, h]
  }

  updateFontSize (fontSize: number) {
    this.shaderData.fontSize = fontSize
  }

  canvasTextPass (gl: WebGL2RenderingContext, passGLSL?: Partial<PassGLSL>) {
    this.shaderData.passGLSL = { ...defatulPassGLSL, ...passGLSL }
    return canvasTextPass(gl, this.shaderData)
  }
}
