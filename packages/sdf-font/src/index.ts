import createSDFTexture, { initFont} from "./sdfTexture"


export interface SDFParams {sdfGlyphSize: number, sdfMargin: number,  sdfExponent: number}
export interface ParamsProps extends SDFParams {
  text: string,
  fontSize: number, 
  letterSpacing: number
}





export const getTexture = async (fontUrl: string, chars: string, sdfParams: SDFParams) => {
  const canvas = document.createElement('canvas')!
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;

  const fontData = await initFont(fontUrl)
  const sdfTexture = await createSDFTexture(gl, fontData, sdfParams, chars)
  return {...sdfTexture, fontData}
}
