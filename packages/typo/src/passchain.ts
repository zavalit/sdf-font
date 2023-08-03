
import {convertCanvasTexture, createFramebuffer, ChainPassPops} from '@webglify/chain'
import {createGlyphTexture, TextureFormat} from '@webglify/sdf-texture'
import {defaultSdfParams, defaultTextMeta, getTextMetaData, passItem} from './index'


type W2 = WebGL2RenderingContext
type TextPassProps = {
  text: string,
  fontUrl: string,
  toFrambebuffer: boolean
  viewport: {width: number, height: number}
  sdfParams?: typeof defaultSdfParams
  textMeta?: typeof defaultTextMeta
  fragmentShader?: string
}

type PassChainRepo = {
  pass: ChainPassPops,
  texture: WebGLTexture | null
}


export const obtainPassChain = async (gl: W2, {text, fontUrl, viewport, toFramebuffer=true, ...passParams}: TextPassProps): Promise<PassChainRepo> => {
  
  const canvas = document.createElement('canvas')
  const {width, height} = viewport
  // const dpr = Math.min(window.devicePixelRatio, 2);
  // canvas.width = width * dpr
  // canvas.height = height * dpr
  // canvas.style.width = `${width}px`
  // canvas.style.height = `${height}px`

  const {framebuffer, texture} = toFramebuffer
  ? createFramebuffer(gl, {width: viewport.width, height: viewport.height})
  : { framebuffer: null, texture: null}

  
  console.log('toFramebuffer', toFramebuffer)
  const sdfParams = passParams.sdfParams || defaultSdfParams
  const textMeta = passParams.textMeta || defaultTextMeta

  const charCodes = text.split('').map((ch: string) => ch.charCodeAt(0))


  const {fontMeta, sizesMap} = await createGlyphTexture({
    [TextureFormat.EDGE]: canvas
  }, fontUrl, sdfParams, charCodes)

  const glyphMapTexture = convertCanvasTexture(gl, canvas)

  const {sdfItemSize, glyphBounds} = getTextMetaData({fontMeta, sdfParams, text, textMeta, sizesMap})
  return {
    pass: passItem({glyphMapTexture,framebuffer, glyphBounds, charCodes, viewport, sdfTexture: canvas, sdfItemSize, fontMeta, shaders: {fragmentShader: passParams.fragmentShader}}),
    texture 
  }
}

