import {createGlyphTexture, TextureFormat, FontMetaType} from "@webglify/sdf-texture/sdfTexture";




self.onmessage = async function(event) {

  const data = event.data;

  const {fontUrl, sdfParams} = data;

  
  const canvas = new OffscreenCanvas(0, 0)

  const charCodes = data.charCodes || _256
  const {textures, ...rest} = await createGlyphTexture({[TextureFormat.EDGE]:canvas}, fontUrl, sdfParams, charCodes);
  

  const imageBitmap = await createImageBitmap(canvas);

  // Transfer the ImageBitmap back to the main thread
  self.postMessage({imageBitmap, ...rest}, [imageBitmap]);
  
};


type TextureResultType = {
  texture: HTMLCanvasElement,
  fontMeta: FontMetaType,
  sizesMap: any
}

const _256 = [...Array(256).keys()]





