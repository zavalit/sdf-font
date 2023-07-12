import createSDFTexture, {initFont, SDFParams, FontMetaType, calculateTextureSize} from "@webglify/sdf-texture/sdfTexture";
import {codeToGlyph, glyphToPath} from '@webglify/sdf-texture/index'




self.onmessage = async function(event) {

  const data = event.data;

  const {fontUrl, sdfParams, dpr} = data;

  console.log('fontUrl, sdfParams',fontUrl, sdfParams)

  const {texture, ...rest} = await getTexture(fontUrl, sdfParams, dpr)

  const imageBitmap = await createImageBitmap(texture);

  // Transfer the ImageBitmap back to the main thread
  self.postMessage({imageBitmap, ...rest}, [imageBitmap]);
  
};


type TextureResultType = {
  texture: HTMLCanvasElement,
  fontMeta: FontMetaType,
  sizesMap: any
}

export const getTexture = async (fontUrl: string, sdfParams: SDFParams, dpr: number) : Promise<TextureResultType> => {

  const fontData = await initFont(fontUrl)
  const {chars, ...rest} = preparePayload(fontData)

  const columnCount = 8
  //const textureSize = calculateTextureSize(columnCount, sdfParams.sdfGlyphSize, chars.length, dpr)
  const canvas = new OffscreenCanvas(0, 0)
  
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;

  const os2 = fontData['OS/2']
    
  const fontMeta = {
    unitsPerEm: fontData.head.unitsPerEm,
    ascender: os2.sTypoAscender,
    descender: os2.sTypoDescender,
    capHeight: os2.sCapHeight,
    xHeight: os2.sxHeight,
    lineGap: os2.sTypoLineGap,
  };    
  
  const sdfTexture = await createSDFTexture(gl, fontData, sdfParams, chars)
  return {...sdfTexture, fontMeta, ...rest}
}








const preparePayload = (fontMeta) => {
  const _256 = [...Array(256).keys()]
  return (_256).reduce((acc, charCode) => {
    const char = String.fromCodePoint(charCode)
    const chars = acc.chars.concat(char)
            
    const glyphId = codeToGlyph(fontMeta, charCode)
    const {crds} = glyphToPath(fontMeta, glyphId)
    const advanceWidth = fontMeta.hmtx.aWidth[glyphId]


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
    const sizesMap = {...acc.sizesMap, [charCode]: [ xMin, yMin, xMax, yMax, advanceWidth]}
    return {chars, sizesMap}
  }, {chars: "", sizesMap: {}});
}

