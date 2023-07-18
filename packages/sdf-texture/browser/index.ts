import createSDFTexture, {initFont, SDFParams, FontMetaType, calculateTextureSize} from "@webglify/sdf-texture/sdfTexture";
import {codeToGlyph, glyphToPath} from '@webglify/sdf-texture/index'
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'



const _256 = [...Array(256).keys()]

const sdfGlyphSize = 64 * 4
const sdfParams = {
  sdfGlyphSize,
  sdfExponent: 20.,
  
}

const fontParams = {
  fontSize: 1.2,
  letterSpacing: 1.
}

  

type TextureResultType = {
  texture: HTMLCanvasElement,
  fontMeta: FontMetaType,
  sizesMap: any
}




export const getTexture = async (canvas: HTMLCanvasElement | OffscreenCanvas, fontUrl: string, sdfParams: SDFParams, charCodes: number[]) : Promise<TextureResultType> => {

  
  const sdfTexture = await createSDFTexture(canvas, fontUrl, sdfParams, charCodes)
  return sdfTexture
}









const svg = ({sdfViewBox, path}) => {
    
  const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
  
  svg.setAttribute('viewBox', sdfViewBox.join(' '))
  const p = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
  p.setAttribute('d', path)
  p.setAttribute('fill', '#000000')
  svg.appendChild(p)
  document.body.appendChild(svg)
  
}

(async () => {
  

  const canvas = document.createElement('canvas')

  const charCodes ='@ABCDEF'.split('').map(c => c.charCodeAt(0))
  
  const {texture,fontMeta} = await getTexture(canvas, fontUrl, sdfParams, charCodes)

  document.body.appendChild(texture)
  
  // Array.from(charsMap.values()).forEach(c => {
  //   console.log('c', c)
  //   svg(c)
  // })
  
  console.log('fontMeta', fontMeta)


  
  
})()

