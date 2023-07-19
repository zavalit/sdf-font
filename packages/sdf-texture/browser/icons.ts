
import { getSegements } from "../index";
import {renderIconSpriteTexture, renderIconDistanceSpriteTexture} from '../sdfTexture'




const svg = ({sdfViewBox, path}) => {
    
  const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
  
  svg.setAttribute('viewBox', sdfViewBox.join(' '))
  svg.setAttribute('width', sdfViewBox[2])
  svg.setAttribute('height', sdfViewBox[3])
  const p = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
  p.setAttribute('d', path)
  p.setAttribute('fill', '#000000')
  svg.appendChild(p)
  document.body.appendChild(svg)
  
}


const svgIcon = document.getElementById('bufferIcon')


console.log('viewBox', svgIcon.getAttribute('viewBox'))




const sdfGlyphSize = 64 * 4;
const sdfParams = {
  sdfGlyphSize,
  sdfExponent: 20.
};



(async () => {
  let pathElements = svgIcon.getElementsByTagName("path");
  const [minX, minY, svgWidth, svgHeight] = svgIcon.getAttribute('viewBox').split(/\s+/).map(v => parseInt(v))
  const viewBox = [ 
    minX,
    minY, 
    minX + svgWidth,
    minY + svgHeight
  ]
  const occ = []
  for (let i = 0; i < pathElements.length; i++) {


    const d = pathElements[i].getAttribute("d"); // Logs the 'd' attribute of each path
    const segmentsCoord = getSegements(d)
    
    const t = {segmentsCoord, viewBox}

    
    occ.push(t)

  }
  
  
  

  
  
  
  //svg({path, sdfViewBox})

  
  
  const canvas = document.createElement('canvas')!
  const gl = canvas.getContext('webgl2')!
  const rgl = await renderIconSpriteTexture(gl, occ, sdfParams, 26)

  document.body.appendChild(rgl.canvas)



  const canvas2 = document.createElement('canvas')!
  const gl2 = canvas2.getContext('webgl2')!
  const rgl2 = await renderIconDistanceSpriteTexture(gl2, occ, sdfParams, 26)

  document.body.appendChild(rgl2.canvas)

})()

