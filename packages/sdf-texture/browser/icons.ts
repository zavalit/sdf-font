
import { getSegements } from "../index";
import {renderIconSpriteTexture} from '../sdfTexture'




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
    let distance = 0;
    const segmentsDist = []
    for(let j=0; j < segmentsCoord.length; j+=4) {
      const[x0, y0, x1, y1] = segmentsCoord.slice(j, j+4)
      const dist = Math.hypot(x1-x0, y1-y0)

      segmentsDist.push(distance)      
      distance += dist;
    }
    const t = {segmentsCoord, segmentsDist, viewBox, distance}

    
    occ.push(t)

  }
  
  
  

  
  
  
  //svg({path, sdfViewBox})

  
  
  const canvas = document.createElement('canvas')!
  const gl = canvas.getContext('webgl2')!
  const rgl = await renderIconSpriteTexture(gl, occ, sdfParams, 26)

  document.body.appendChild(rgl.canvas)

})()

