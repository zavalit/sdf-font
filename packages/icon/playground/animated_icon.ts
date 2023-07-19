import renderIcon from "../src";
import{createIconTexture, SDFParams}  from "@webglify/sdf-texture/sdfTexture";


const svgIcon = document.getElementById('bufferIcon')! as unknown as SVGElement;

const sdfParams: SDFParams = {
  sdfItemSize: 64,
  sdfExponent: 10.
};

(async() => {
  const resultCanvas = document.createElement('canvas')
  
  const canvas = document.createElement('canvas')!

  const canvas2 = document.createElement('canvas')!
  
  const textures = await createIconTexture({'EDGE': canvas, 'DISTANCE': canvas2}, svgIcon, sdfParams)
  
  document.body.appendChild(canvas)
  document.body.appendChild(canvas2)

  renderIcon(resultCanvas, textures)

})()
