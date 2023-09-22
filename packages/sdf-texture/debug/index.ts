import {createGlyphTexture, parseGlyph, initFont} from "../src/sdfTexture";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import { codeToGlyph } from "../src";


const _256 = [...Array(256).keys()]

const sdfItemSize = 64
const sdfParams = {
  sdfItemSize,
  sdfExponent: 20.,
  
}
 







const svg = ({viewBox, path}) => {
    
  const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
  
  svg.setAttribute('viewBox', viewBox.join(' '))
  const p = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
  p.setAttribute('d', path)
  p.setAttribute('fill', '#000000')
  svg.appendChild(p)
  document.body.appendChild(svg)
  
}

(async () => {
  
  
  const edgeCanvas = document.createElement('canvas')

  const charCodes = '`'.split('').map(c => c.charCodeAt(0))
  
  const {textures, ...rest} = await createGlyphTexture({'EDGE': edgeCanvas}, travelNextUrl, sdfParams, _256, 8)

  const edge = textures['EDGE']
  document.body.appendChild(edge)
  
  
  
  console.log('fontdata', rest)
  
  // GLYPH SVG
  const fontData = await initFont(fontUrl)

  const glyphId = codeToGlyph(fontData, charCodes[0])

             
  const {viewBox, path} = parseGlyph(fontData, glyphId)
  console.log({viewBox, path})
  
  svg({viewBox, path})
  
})()






