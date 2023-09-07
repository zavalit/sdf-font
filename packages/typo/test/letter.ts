import {TextureFormat, createGlyphTexture} from "@webglify/sdf-texture";
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'

import {  renderText } from "../src"
// import letterFragmentShader from './testshaders/letter.fragment.glsl'
// import letterVertexShader from './testshaders/letter.vertex.glsl'


const sampleText = "@bp+-Ä"
//const textBlocks = sampleData.map(({m}) => m);


const _256 = [...Array(256).keys()]

const charCodes = sampleText.split('').map(c => c.charCodeAt(0));

(async() => {

  const sdfItemSize = 64 * 2.
  const sdfParams = {
    sdfItemSize,
    sdfExponent: 10.
  }
  
  const fontParams = {
    fontSize: 140,
    letterSpacing: 1.
  }

  const atlasColumnCount = 8
  const canvas = document.createElement('canvas')
  const canvas2 = document.createElement('canvas')


  const {textures, fontMeta, sizesMap} = await createGlyphTexture({
    [TextureFormat.EDGE]: canvas,
    [TextureFormat.DISTANCE]: canvas2,
  }, fontUrl, sdfParams, _256, atlasColumnCount)





// map text to sdf
// a. create canvas for rendering text


const textCanvas = document.createElement('canvas')!


const textGL = textCanvas.getContext('webgl2')!
document.body.appendChild(textCanvas) 

  
const textMeta = {fontMeta,sizesMap, sdfParams, text: sampleText, textMeta: fontParams}


renderText(textGL, {texture:canvas, width: canvas.width, height: canvas.height}, textMeta, atlasColumnCount)

document.body.appendChild(canvas)


})()



