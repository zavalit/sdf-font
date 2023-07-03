import { getTexture }  from "../src"
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'

import { getTextMetaData, renderText } from "../src/text"


const sampleData = [{"m":"createShader","a":{"0":35633},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n#define GLSLIFY 1\n\nlayout(location=0) in vec2 aPosition;\n\nvoid main () {\n\n  gl_Position = vec4(aPosition, 0., 1.);\n\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createShader","a":{"0":35632},"o":{}},{"m":"shaderSource","a":{"0":{},"1":"#version 300 es\n\nprecision mediump float;\n#define GLSLIFY 1\n\nout vec4 fragColor;\n\nvoid main () {\n  fragColor = vec4(1., 0., 1., 1.);\n}"}},{"m":"compileShader","a":{"0":{}}},{"m":"getShaderParameter","a":{"0":{},"1":35713},"o":true},{"m":"createProgram","a":{},"o":{}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"attachShader","a":{"0":{},"1":{}}},{"m":"linkProgram","a":{"0":{}}},{"m":"getProgramParameter","a":{"0":{},"1":35714},"o":true},{"m":"createBuffer","a":{},"o":{}},{"m":"bindBuffer","a":{"0":34962,"1":{}}},{"m":"bufferData","a":{"0":34962,"1":{"0":0,"1":0,"2":1,"3":1},"2":35044}},{"m":"enableVertexAttribArray","a":{"0":0}},{"m":"vertexAttribPointer","a":{"0":0,"1":2,"2":5126,"3":false,"4":0,"5":0}},{"m":"useProgram","a":{"0":{}}},{"m":"drawArrays","a":{"0":1,"1":0,"2":2},"s":{"programId":1}}]
const textBlocks = sampleData.map(({m}) => m);
const chars = textBlocks.reduce((acc, ch) => acc.concat(ch), "");
const alphabet = [...Array(256).keys()].map(k => String.fromCodePoint(k))

console.log(chars);

(async() => {


const sdfGlyphSize = 64
const sdfParams = {
  sdfGlyphSize,
  sdfMargin: 1/sdfGlyphSize,
  sdfExponent: 9
}

const fontParams = {
  fontSize: .5,
  letterSpacing: 1.
}
const params = {...sdfParams, ...fontParams}



const sdfTexture = await getTexture(fontUrl, chars, sdfParams)
document.body.appendChild(sdfTexture.texture)





// map text to sdf
// a. create canvas for rendering text
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

const textGL = textCanvas.getContext('webgl2')!
document.body.appendChild(textCanvas) 

textBlocks.slice(0, 1).forEach((text, i) => {
  
  const meta = getTextMetaData(sdfTexture.fontData, {...params, text})
  viewport.y = 80 * i
  renderText(textGL, sdfTexture, meta, viewport)
  
})



// try to encode json into texture

// Your JSON object
var data = {"unitsPerEm":2048,"ascender":1536,"descender":-512,"capHeight":1456,"xHeight":1082,"lineGap":102};

// Convert the JSON object to an array of numbers
var numbers = Object.values(data);

// Create an array to hold the color data
var colors = new Uint8Array(numbers.length * 4);


// Convert each number to a color and store it in the colors array
for (var i = 0; i < numbers.length; i++) {
  var number = numbers[i];
  colors[i * 4 + 0] = (number >> 24) & 0xFF; // Red
  colors[i * 4 + 1] = (number >> 16) & 0xFF; // Green
  colors[i * 4 + 2] = (number >> 8) & 0xFF; // Blue
  colors[i * 4 + 3] = number & 0xFF; // Alpha
}

console.log('numbers', numbers, colors)

})()



