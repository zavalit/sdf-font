import {TextureFormat, createGlyphTexture, createGlyphAtlas} from "@webglify/sdf-texture";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'

import {  renderTextCanvas } from "../src"
// import letterFragmentShader from './testshaders/letter.fragment.glsl'
// import letterVertexShader from './testshaders/letter.vertex.glsl'

const sampleText0 = "Ljub´@a"
const sampleText = "@p+-Ä"
const sampleText2 = "2 Ü"
const sampleText3 = "2001g"
const sampleText4 = "PÖWER/{}[]qpy"

//const textBlocks = sampleData.map(({m}) => m);


const _256 = [...Array(256).keys()]

const charCodes = sampleText4.split('').map(c => c.charCodeAt(0));

(async() => {



  const {atlas, fontMeta, atlasMeta} = await createGlyphAtlas(travelNextUrl, {sdfParams: {sdfItemSize: 64*2, sdfExponent: 10}, charCodes: _256})


const textCanvas = document.createElement('canvas')!


const textGL = textCanvas.getContext('webgl2', {premultipliedAlpha: true})!
document.body.appendChild(textCanvas) 


const fontSize = 120
const textParams = {
  fontSize,
  letterSpacing: 1.,
  rowHeight: 1.2 * fontSize,
  paddingBottom: .1*fontSize,
 
}
const fontData = {fontMeta, atlasMeta}
 

const textRows = [sampleText0, sampleText, sampleText2, sampleText3]
renderTextCanvas(textGL, ['g', 'Ä'], atlas, fontData, textParams)

document.body.appendChild(atlas)


})()



