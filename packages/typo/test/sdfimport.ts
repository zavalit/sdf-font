import sdfTextureUrl from 'url:./sdfTextureData/sdfTexture.png'
import meta from './sdfTextureData/metadata.json'
import {renderText} from '../src/text.ts'
import { loadTexture } from '@webglify/chain';

function loadImage(url: string, callback: (i:HTMLImageElement) => void) {
  const image = new Image();
  image.src = url;
  image.onload = () => callback(image);
  return image;
}




loadImage(sdfTextureUrl, (image) => {
  document.body.appendChild(image)
})



const sampleData = [{"m":"createShader","a":{"0":35633},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n#define GLSLIFY 1\n\nlayout(location=0) in vec2 aPosition;\n\nvoid main () {\n\n  gl_Position = vec4(aPosition, 0., 1.);\n\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createShader","a":{"0":35632},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n\nprecision mediump float;\n#define GLSLIFY 1\n\nout vec4 fragColor;\n\nvoid main () {\n  fragColor = vec4(1., 0., 1., 1.);\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createProgram","a":{},"o":{}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"linkProgram","a":{"0":{}}},{"m":"getProgramParameter","a":{"0":{},"1":35714},"o":true},{"m":"createBuffer","a":{},"o":{}},{"m":"bindBuffer","a":{"0":34962,"1":{}}},{"m":"bufferData","a":{"0":34962,"1":{"0":0,"1":0,"2":1,"3":1},"2":35044}},{"m":"enableVertexAttribArray","a":{"0":0}},{"m":"vertexAttribPointer","a":{"0":0,"1":2,"2":5126,"3":false,"4":0,"5":0}},{"m":"useProgram","a":{"0":{}}},{"m":"drawArrays","a":{"0":1,"1":0,"2":2},"s":{"programId":1}}]
const textBlocks = sampleData.map(({m}) => m);

const dpr = Math.min(2, window.devicePixelRatio)
const textWidth = 500
const textHeight = 150
const viewport = {x: 0, y: 0, width: textWidth * dpr, height: textHeight * dpr}

const textCanvas = document.createElement('canvas')!


const canvasHeight = 45 * textBlocks.length 
textCanvas.height = canvasHeight * dpr;
textCanvas.width = viewport.width;

textCanvas.style.height = `${canvasHeight}`;
textCanvas.style.width =  `${textWidth}`;

const textGL = textCanvas.getContext('webgl2')!;
document.body.appendChild(textCanvas); 


(async() => {

  const texture = await loadTexture(textGL, sdfTextureUrl)

  const viewport = {x:0, y:0,  width: 700, height: 200}
  const textMeta = {...meta, text: 'ü', fontSize: .3, letterSpacing: 1.}
  

  renderText(textGL,texture, textMeta, viewport)
  

})()