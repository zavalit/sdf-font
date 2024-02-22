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

  const rowWidthes: number[] = []

  const ff = 1 / config.info.size

  const padding = config.info.padding.map((p) => p * ff)

  const wordGlyphPositions: any[] = []
  const heightBounds: Array<[number, number]> = []
  const spaceDiffs: any = []

  const pad = padding[0]

  // find glyph min and max
  textRows.forEach((text, i) => {
    text.split('').forEach((char, j) => {
      // glyph pos in text
      const unicode = char.charCodeAt(0)
      const g = chars.get(unicode)
      if (typeof g.yoffset !== 'undefined') {
        heightBounds.push([
          g.yoffset * ff,
          g.height * ff + g.yoffset * ff - pad
        ])
      }
    })
  })

  // position base line, depending on the line height or/and height align
  const gb = Math.min(...heightBounds.map((g) => g[0]))
  const gt = Math.max(...heightBounds.map((g) => g[1]))

  const coreLineHeight = config.common.lineHeight * ff
  const paddingHeight = 1 + opts.paddingHeight
  const paddingSide = coreLineHeight * opts.paddingWidth * 0.5
  const lineHeight = coreLineHeight * paddingHeight

  let wordGlyphId = 0
  let wordId = -1

  textRows.forEach((text, i) => {
    const y = (textRows.length - i - 1) * lineHeight
    wordId++

    let rowWordsX = paddingSide
    const rowWords = text.split(' ').filter((w) => w.length > 0)
    rowWords.forEach((word, w) => {
      if (typeof (rowWords[w - 1]) !== 'undefined') {
        const g = chars.get(32)

        rowWordsX += g.xadvance * ff
        wordId++
      }

      word.split('').forEach((char, c) => {
        const unicode = char.charCodeAt(0)

        const g = chars.get(unicode)

        const x = rowWordsX + g.xoffset * ff
        const width = g.width * ff - pad

        const isFirstLetter = c === 0
        const isLastLetter = word.length - 1 === c

        const letterSpace = isLastLetter
          ? g.xadvance * ff
          : g.xadvance * letterSpacing * ff

        rowWordsX += letterSpace

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

          // aWordRow
          wordId,
          i,

          // aWordGlyph
          c,
          word.length,
          
          // aRowWord
          w,
          rowWords.length,

          // aChannel
          g.chnl
        ]

        wordGlyphPositions[wordGlyphId] = glyphPos

        // close space

        // change x and z

        let dx = 0
        // first x take a padding
        if (isFirstLetter) {
          dx = -paddingSide
        }
        // last z sticks to line end
        let dz = 0
        // last z take a padding
        if (isLastLetter) {
          dz = paddingSide
        }

        if (alignBounds) {
          // dx
          // first stick to start
          if (isFirstLetter) {
            dx = Math.min(g.xoffset * ff * -1 - paddingSide, 0)
          } else {
            const [prevX, , prevWidth] = wordGlyphPositions[wordGlyphId - 1]
            const prevZ = prevX + prevWidth
            dx = (prevZ - x) * 0.5
          }

          // dz
          // last stick to end
          if (isLastLetter) {
            dz = rowWordsX - (x + width) + paddingSide
          } else {
            const currentZ = x + width

            const nextChar = chars.get(word.charCodeAt(c + 1))
            const nextX = rowWordsX + nextChar.xoffset * ff

            dz = (nextX - currentZ) * 0.5
          }
        }

        spaceDiffs.push([dx, dz])

        wordGlyphId++
      })
    })

    rowWidthes.push(rowWordsX + paddingSide)
  })

  const fontLineHeight = opts.alignHeight
    ? (gt - gb) * paddingHeight
    : lineHeight

  const basePadding = (paddingHeight - 1) * 0.5
  const base = opts.alignHeight
    ? gt + (gt - gb) * basePadding
    : config.common.base * ff * (1 + basePadding)

  return {
    rowWidthes,
    glyphPositions: wordGlyphPositions.filter((p) => p),
    wordsCount: wordId + 1,
    rowsCount: textRows.length,
    heightBounds: [gb, gt],
    spaceDiffs,
    textLineHeight: opts.textLineHeight,
    fontLineHeight,
    originLineHeight: lineHeight,
    base,
    padding
  }
}

interface CanvasTextOptions {
  letterSpacing: number
  alignBounds: boolean
  alignHeight: boolean
  paddingHeight: number
  paddingWidth: number
  fontSize: number
  textLineHeight: number
}

const defaultCanvasTextOptions: CanvasTextOptions = {
  letterSpacing: 1,
  alignBounds: false,
  alignHeight: false,
  paddingHeight: 0,
  paddingWidth: 0,
  fontSize: 100,
  textLineHeight: 1
}

export const calculateFontSizeByCanvas = (
  canvas: HTMLCanvasElement,
  text: string,
  config,
  options?: Partial<CanvasTextOptions>
): number => {
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
    passGLSL: { vertexShader, fragmentShader, uniforms, frameUniforms, framebuffer }
  } = shaderData

  const atlasTexture = createTexture(gl, atlasCanvas)
  const atlasRes = [atlasCanvas.width, atlasCanvas.height]
  const count = glyphData.glyphPositions.length
  return {
    vertexShader: vertexShader ?? glyphVertexShader,
    fragmentShader: fragmentShader ?? glyphFragmentShader,
    textures: [atlasTexture],
    framebuffer,
    frameUniforms (gl, locs, frameProps) {
      gl.uniform2fv(locs.uAtlasResolution, atlasRes)
      gl.uniform1f(locs.uFontLineHeight, glyphData.fontLineHeight)
      gl.uniform1f(locs.uLineHeight, glyphData.textLineHeight)
      gl.uniform1f(locs.uOriginLineHeight, glyphData.originLineHeight)
      gl.uniform1f(locs.uBaseLine, glyphData.base)
      gl.uniform1f(locs.uWordsCount, glyphData.wordsCount)
      gl.uniform1f(locs.uRowsCount, glyphData.rowsCount)
      gl.uniform4fv(locs.uPadding, glyphData.padding)
      gl.uniform1f(locs.uFontSize, fontSize)

      if (typeof (uniforms) !== 'undefined') {
        uniforms(gl, locs)
      }
      if (typeof (frameUniforms) !== 'undefined') {
        frameUniforms(gl, locs, frameProps)
      }
      
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

        gl.vertexAttribPointer(6, 2, gl.FLOAT, false, stride, 10 * 4)
        gl.enableVertexAttribArray(6)
        gl.vertexAttribDivisor(6, 1)

        gl.vertexAttribPointer(7, 1, gl.FLOAT, false, stride, 12 * 4)
        gl.enableVertexAttribArray(7)
        gl.vertexAttribDivisor(7, 1)

        // atlas pos
        const ap = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, ap)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(atlasMap.flat()),
          gl.STATIC_DRAW
        )

        gl.vertexAttribPointer(8, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(8)
        gl.vertexAttribDivisor(8, 1)

        // space diffs
        const sp = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, sp)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(glyphData.spaceDiffs.flat()),
          gl.STATIC_DRAW
        )

        gl.vertexAttribPointer(9, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(9)
        gl.vertexAttribDivisor(9, 1)
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
  originLineHeight: number
  glyphPositions: number[][]
  heightBounds: [number, number]
  spaceDiffs: number[][]
  rowWidthes: number[]
  base: number
  padding: number[]
  wordsCount: number
  rowsCount: number
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
'vertexShader' | 'fragmentShader' | 'uniforms' | 'frameUniforms' | 'framebuffer' | 'viewport'
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

  constructor (
    textRows: string[],
    shaderData: ShaderData,
    opts: CanvasTextOptions
  ) {
    this.textRows = textRows
    this.opts = opts
    this.shaderData = shaderData

    // calculate normalised width & height
    const { rowWidthes, originLineHeight } = this.shaderData.glyphData

    this.nWidth = Math.max(...rowWidthes)

    this.nHeight = this.textRows.length * originLineHeight
  }

  static init (text: string, config, options?: Partial<CanvasTextOptions>): MSDFText {
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

  renderCanvasText (canvas: HTMLCanvasElement): void {
    const { fontSize } = this.opts

    const canvasWidth = this.nWidth * fontSize
    const canvasHeight = this.shaderData.glyphData.originLineHeight * fontSize

    const gl = canvas.getContext('webgl2')
    if (gl === null) {
      throw new Error('can not obtain a webgl2 context')
    }
    const dpr = Math.min(2, window.devicePixelRatio)
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr

    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`

    const pass = canvasTextPass(gl, this.shaderData)

    const r = chain(gl, [pass], [new CanvasUniformsPlugin(canvas)])

    r.renderFrame({ frame: 0, elapsedTime: 0 })
  }

  calculateFontSizeByWidth (width: number): number {
    const dpr = Math.min(2, window.devicePixelRatio)

    return width / (this.nWidth * dpr)
  }

  calculateFontSizeByCanvas (canvas: HTMLCanvasElement): number {
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

  updateFontSize (fontSize: number): void {
    this.shaderData.fontSize = fontSize
  }

  canvasTextPass (gl: WebGL2RenderingContext, passGLSL?: Partial<PassGLSL>): PassGLSL {
    this.shaderData.passGLSL = { ...defatulPassGLSL, ...passGLSL }
    return canvasTextPass(gl, this.shaderData)
  }
}
