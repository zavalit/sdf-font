import createSDFTextures, {SDFParams, FontMetaType} from "@webglify/sdf-texture/sdfTexture";
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
  textures: HTMLCanvasElement,
  fontMeta: FontMetaType,
  sizesMap: any
}




export const  getTextures = async (canvas: HTMLCanvasElement | OffscreenCanvas, fontUrl: string, sdfParams: SDFParams, charCodes: number[]) : Promise<TextureResultType> => {

  
  const textures = await createSDFTextures(canvas, fontUrl, sdfParams, charCodes, ['EDGE', 'DISTANCE'])
  return textures
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
  

  const edgeCanvas = document.createElement('canvas')
  const distanceCanvas = document.createElement('canvas')

  const charCodes = '`a'.split('').map(c => c.charCodeAt(0))
  
  const {textures,fontMeta} = await createSDFTextures({'EDGE': edgeCanvas, 'DISTANCE': distanceCanvas}, fontUrl, sdfParams, charCodes)

  const edge = textures['EDGE']
  document.body.appendChild(edge)
  
  const dist = textures['DISTANCE']
  document.body.appendChild(dist)
  
  // Array.from(charsMap.values()).forEach(c => {
  //   console.log('c', c)
  //   svg(c)
  // })
  
  console.log('fontMeta', fontMeta)


  
  
})()

