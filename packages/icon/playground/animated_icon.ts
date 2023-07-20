import renderIcon from "../src";
import{createIconTexture, SDFParams}  from "@webglify/sdf-texture/sdfTexture";
import {Pane} from 'tweakpane'


const PARAMS = {
  uPROGRESS: .9
}

const svgIcon = document.getElementById('bufferIcon')! as unknown as SVGElement;

const sdfParams: SDFParams = {
  sdfItemSize: 64 * 2,
  sdfExponent: 10.
};

(async() => {
  const resultCanvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio;
  const size = 64 * 4;
  resultCanvas.width = size*dpr
  resultCanvas.height = size*dpr
  resultCanvas.style.width = `${size}px`
  resultCanvas.style.height = `${size}px`
  
  const canvas = document.createElement('canvas')!

  const canvas2 = document.createElement('canvas')!
  
  const textures = await createIconTexture({'EDGE': canvas, 'DISTANCE': canvas2}, svgIcon, sdfParams)
  
  document.body.appendChild(canvas)
  document.body.appendChild(canvas2)

  renderIcon(resultCanvas, textures, PARAMS)

  document.body.prepend(resultCanvas)

})()


const pane = new Pane() 
pane.addInput(PARAMS, 'uPROGRESS', {min: 0, max: 1, step: .01});
