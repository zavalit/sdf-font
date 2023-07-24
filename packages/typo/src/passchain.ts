
import {convertCanvasTexture} from '@webglify/chain'
import {createGlyphTexture, TextureFormat} from '@webglify/sdf-texture'
import {defaultSdfParams, defaultTextMeta, getTextMetaData, passItem} from './index'


type W2 = WebGL2RenderingContext
type TextPassProps = {
  text: string,
  fontUrl: string,
  viewport: {width: number, height: number}
  sdfParams?: typeof defaultSdfParams
  textMeta?: typeof defaultTextMeta
  fragmentShader?: string
}

export const obtainPassChain = async (gl: W2, {text, fontUrl, viewport, ...passParams}: TextPassProps) => {
  
  const canvas = document.createElement('canvas')

  
  const sdfParams = passParams.sdfParams || defaultSdfParams
  const textMeta = passParams.textMeta || defaultTextMeta

  const charCodes = text.split('').map((ch: string) => ch.charCodeAt(0))


  const {fontMeta, sizesMap} = await createGlyphTexture({
    [TextureFormat.EDGE]: canvas
  }, fontUrl, sdfParams, charCodes)

  const glyphMapTexture = convertCanvasTexture(gl, canvas)

  const {sdfItemSize, glyphBounds} = getTextMetaData({fontMeta, sdfParams, text, textMeta, sizesMap})
  return passItem({glyphMapTexture, glyphBounds, charCodes, viewport, sdfTexture: canvas, sdfItemSize, fontMeta, shaders: {fragmentShader: passParams.fragmentShader}}) 

}

