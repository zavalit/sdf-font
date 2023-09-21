import {TextureFormat, createGlyphTexture, createGlyphAtlas} from "@webglify/sdf-texture";
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'

import {  renderTextCanvas } from "../src"
// import letterFragmentShader from './testshaders/letter.fragment.glsl'
// import letterVertexShader from './testshaders/letter.vertex.glsl'

const sampleText0 = "Ljub@s"
const sampleText = "@p+-Ä"
const sampleText2 = "2 Ü"
const sampleText3 = "2001g"

//const textBlocks = sampleData.map(({m}) => m);


const _256 = [...Array(256).keys()]

const charCodes = sampleText.split('').map(c => c.charCodeAt(0));

(async() => {



  const {atlas, fontMeta, atlasMeta} = await createGlyphAtlas(fontUrl, {sdfParams: {sdfItemSize: 64*2, sdfExponent: 10}})


const textCanvas = document.createElement('canvas')!


const textGL = textCanvas.getContext('webgl2', {premultipliedAlpha: true})!
document.body.appendChild(textCanvas) 


const fontSize = 120
const textParams = {
  fontSize,
  letterSpacing: 1.,
  rowHeight: 1.15 * fontSize
}
const fontData = {fontMeta, atlasMeta}
 

const textRows = [sampleText0, sampleText, sampleText2, sampleText3]
renderTextCanvas(textGL, [sampleText0], atlas, fontData, textParams)

//document.body.appendChild(atlas)


})()



