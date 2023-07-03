import createSDFTexture, { initFont} from "./sdfTexture"
import {getTextMetaData, renderText, ViewportType} from "./text"
import { FontDataType} from '@webglify/svg-font'


export interface SDFParams {sdfGlyphSize: number, sdfMargin: number,  sdfExponent: number}
export interface ParamsProps extends SDFParams {
  text: string,
  fontSize: number, 
  letterSpacing: number
}


type TextureResultType = {
  texture: HTMLCanvasElement,
  fontData: FontDataType
}


export const getTexture = async (fontUrl: string, chars: string, sdfParams: SDFParams) : Promise<TextureResultType> => {
  const canvas = document.createElement('canvas')!
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;

  const fontData = await initFont(fontUrl)
  const sdfTexture = await createSDFTexture(gl, fontData, sdfParams, chars)
  return {...sdfTexture, fontData}
}

type W2 = WebGL2RenderingContext

export const getText = (textGL: W2, sdfTexture: TextureResultType, params: ParamsProps, viewport: ViewportType) => {
  const meta = getTextMetaData(sdfTexture.fontData, params)
  renderText(textGL, sdfTexture, meta, viewport)
}