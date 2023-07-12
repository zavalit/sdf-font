
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'
import chain, { loadTexture} from '@webglify/chain'
import {renderText} from '../src/text'
import sdfTextureUrl from 'url:./sdfTextureData/sdfTexture.png'
import meta from './sdfTextureData/metadata.json'
import testFontUrl from 'url:./font.png'
import vertexShader from '../src/shaders/vertex.glsl'
import fragmentShader from '../src/shaders/fragment.glsl'
 

function createTexture(gl: WebGL2RenderingContext, image: TexImageSource): WebGLTexture {
  

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  var ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

  return  texture;

}



 const worker = new Worker(
  new URL('sdfTextureWorker.ts', import.meta.url),
  {type: 'module'}
);


const sdfGlyphSize = 64
const sdfParams = {
  sdfGlyphSize,
  sdfMargin: 10/sdfGlyphSize,
  sdfExponent: 3
}

const dpr  = Math.min(2, window.devicePixelRatio)



// Record the time before posting the message
const startTime = performance.now();

worker.postMessage({fontUrl, sdfParams, dpr: 1.});

worker.onmessage = function(event) {
  console.log('worker on message', event)
  const data= event.data
  const {fontMeta,sizesMap} = data

 // Record the time when the response is received
 const endTime = performance.now();

 // Calculate the elapsed time
 const elapsedTime = endTime - startTime;

 console.log('Time taken by worker: ' + elapsedTime + ' ms');
  const sampleData = [{"m":"createShader","a":{"0":35633},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n#define GLSLIFY 1\n\nlayout(location=0) in vec2 aPosition;\n\nvoid main () {\n\n  gl_Position = vec4(aPosition, 0., 1.);\n\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createShader","a":{"0":35632},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n\nprecision mediump float;\n#define GLSLIFY 1\n\nout vec4 fragColor;\n\nvoid main () {\n  fragColor = vec4(1., 0., 1., 1.);\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createProgram","a":{},"o":{}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"linkProgram","a":{"0":{}}},{"m":"getProgramParameter","a":{"0":{},"1":35714},"o":true},{"m":"createBuffer","a":{},"o":{}},{"m":"bindBuffer","a":{"0":34962,"1":{}}},{"m":"bufferData","a":{"0":34962,"1":{"0":0,"1":0,"2":1,"3":1},"2":35044}},{"m":"enableVertexAttribArray","a":{"0":0}},{"m":"vertexAttribPointer","a":{"0":0,"1":2,"2":5126,"3":false,"4":0,"5":0}},{"m":"useProgram","a":{"0":{}}},{"m":"drawArrays","a":{"0":1,"1":0,"2":2},"s":{"programId":1}}]
const textBlocks = sampleData.map(({m}) => m);

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

function loadImage(url: string, callback: (i:HTMLImageElement) => void) {
  const image = new Image();
  image.src = url;
  image.onload = () => callback(image);
  return image;
}


(async() => {

  loadImage(sdfTextureUrl, (image) => {

    const sdfTexture = {
      texture: createTexture(textGL, data.imageBitmap),
      width: image.width,
      height: image.height
    }
      
    const sdfTexture2 = {
      texture: createTexture(textGL, image),
      width: image.width,
      height: image.height
    }
  
    const viewport = {x:0, y:0,  width: 500, height: 200}
    const textMeta = {fontMeta,sizesMap, sdfParams, text: 'test ü', fontSize: .5, letterSpacing: 1.}
    const textMeta2 = {fontMeta: meta.fontMeta, sizesMap: meta.sizesMap, sdfParams, text: 'test', fontSize: .5, letterSpacing: 1.}
  
    // console.log('t', textMeta)
    renderText(textGL,sdfTexture, textMeta, viewport)
    //renderText(textGL, sdfTexture2, textMeta2, viewport)
  
    
  
  
  

    const canvas = document.createElement('canvas')
    canvas.width = sdfTexture.width
    canvas.height = sdfTexture.height
    var ctx = canvas.getContext('2d')!;
    ctx.drawImage(data.imageBitmap, 0, 0);
    document.body.appendChild(canvas)
  
  
   
      //document.body.appendChild(image)
   
    
  })

  



})()





/// SIMPLE TEXTUE TEST

const test = () => {



  const canvas = document.createElement("canvas");


canvas.width = 512;
canvas.height= 512;
const gl = canvas.getContext("webgl2")!;
document.body.appendChild(canvas);


function loadImage(url: string, callback: (i:HTMLImageElement) => void) {
  const image = new Image();
  image.src = url;
  image.onload = () => callback(image);
  return image;
}



(async () => {
  
  loadImage(testFontUrl, (image) => {
    const texture = createTexture(gl, image);
    console.log('texture', texture)
    const { renderFrame, performance } = chain(gl, [
      {
        vertexShader,
        fragmentShader,
        canvasWidth: 512,
        canvasHeight: 512,
        textures: [texture],
      }
    ]);
  
    renderFrame(0)

  })
  

})()


}