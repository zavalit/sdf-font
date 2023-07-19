

import {createIconTexture} from '../sdfTexture'




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


const svgIcon = document.getElementById('bufferIcon') as unknown as SVGElement


console.log('viewBox', svgIcon.getAttribute('viewBox'))




const sdfItemSize = 64 * 4;
const sdfParams = {
  sdfItemSize,
  sdfExponent: 10.
};



(async () => {
  
  
  //svg({path, sdfViewBox})

  
  const canvas = document.createElement('canvas')!


  const canvas2 = document.createElement('canvas')!
  
  createIconTexture({'EDGE': canvas, 'DISTANCE': canvas2}, svgIcon, sdfParams)
  
  document.body.appendChild(canvas)
  document.body.appendChild(canvas2)

})()

