import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'

import {  renderText } from "../src"


const convertBitmapToCanvas = (image: ImageBitmap) => {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  var ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  return canvas
}

const worker = new Worker(
  new URL('sdfTextureWorker.ts', import.meta.url),
  {type: 'module'}
);

const sampleData = [{"m":"@ÄBCDEFG`"}, {"m":"createShader"}, {"m":"@A:;`´tsdph","a":{"0":35633},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n#define GLSLIFY 1\n\nlayout(location=0) in vec2 aPosition;\n\nvoid main () {\n\n  gl_Position = vec4(aPosition, 0., 1.);\n\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createShader","a":{"0":35632},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n\nprecision mediump float;\n#define GLSLIFY 1\n\nout vec4 fragColor;\n\nvoid main () {\n  fragColor = vec4(1., 0., 1., 1.);\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createProgram","a":{},"o":{}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"linkProgram","a":{"0":{}}},{"m":"getProgramParameter","a":{"0":{},"1":35714},"o":true},{"m":"createBuffer","a":{},"o":{}},{"m":"bindBuffer","a":{"0":34962,"1":{}}},{"m":"bufferData","a":{"0":34962,"1":{"0":0,"1":0,"2":1,"3":1},"2":35044}},{"m":"enableVertexAttribArray","a":{"0":0}},{"m":"vertexAttribPointer","a":{"0":0,"1":2,"2":5126,"3":false,"4":0,"5":0}},{"m":"useProgram","a":{"0":{}}},{"m":"drawArrays","a":{"0":1,"1":0,"2":2},"s":{"programId":1}}]
const textBlocks = sampleData.map(({m}) => m).splice(0., 1.);
const chars = textBlocks.reduce((acc, ch) => acc.concat(ch), "");
const _256CharCodes = [...Array(256).keys()]
const textBlocksCharCodes = chars.split('').map(c => c.charCodeAt(0))
const alphabet = _256CharCodes.map(k => String.fromCodePoint(k)).reduce((acc, ch) => acc.concat(ch), "")

console.log(chars);

(async() => {



  const sdfGlyphSize = 64 * 1.;
  const sdfParams = {
    sdfGlyphSize,
    sdfExponent: 10.
    
  }
  
  const fontParams = {
    fontSize: 2.,
    letterSpacing: 1.
  }
const canvas = document.createElement('canvas')

// Record the time before posting the message
const startTime = performance.now();

worker.postMessage({fontUrl, sdfParams, charCodes: _256CharCodes, dpr: 1.});

worker.onmessage = function(event) {

  const data= event.data
  console.log(data)
  const {fontMeta,sizesMap} = data

  // Record the time when the response is received
  const endTime = performance.now();

  // Calculate the elapsed time
  const elapsedTime = endTime - startTime;

  console.log('Time taken by worker: ' + elapsedTime + ' ms');
  const texture = convertBitmapToCanvas(data.imageBitmap)

  console.log('list sdfTexture', texture, fontMeta, sizesMap)
  document.body.appendChild(texture)





  // map text to sdf
  // a. create canvas for rendering text
  const dpr = Math.min(2, window.devicePixelRatio)
  const textWidth = 700
  const textHeight = 100
  const viewport = {x: 0, y: 0, width: textWidth * dpr, height: textHeight * dpr}

  const textCanvas = document.createElement('canvas')!


  const canvasHeight = textHeight 
  textCanvas.height = canvasHeight * dpr;
  textCanvas.width = viewport.width;

  textCanvas.style.height = `${canvasHeight}`;
  textCanvas.style.width =  `${textWidth}`;

  const textGL = textCanvas.getContext('webgl2')!
  document.body.appendChild(textCanvas) 

  textBlocks.splice(0.,1).forEach((text, i) => {
    
    const textMeta = {fontMeta,sizesMap, sdfParams, text, ...fontParams}

  // const meta = getTextMetaData(sdfTexture.fontData, {...params, text})
    viewport.y = 80 * i
    console.log('viewport', viewport, textMeta)
    renderText(textGL, {texture, width: texture.width, height: texture.height}, textMeta, viewport)
    
  })

}






})()



