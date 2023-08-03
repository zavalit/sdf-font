import chain from '@webglify/chain'
import textFragment from './testshaders/cp.fragment.glsl'
import afterVertex from './testshaders/cp.after.vertex.glsl'
import afterFragment from './testshaders/cp.after.fragment.glsl'
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'

import {obtainPassChain} from '../src/passchain'


const width = 700
const height = 30

const dpr = Math.min(2, window.devicePixelRatio)

const canvas = document.createElement('canvas')!;
canvas.width = width * dpr;
canvas.height = height * dpr

canvas.style.width = `${width}px`
canvas.style.height = `${height}px`


const gl = canvas.getContext('webgl2');

document.body.appendChild(canvas);


(async () => {
  const {pass} = await obtainPassChain(gl, {
    fragmentShader: textFragment,
    text: 'Source',
    fontUrl,
    viewport: {width, height: height},
    sdfParams: {sdfItemSize: 64, sdfExponent: 5},
    toFramebuffer: false
  })

  const {renderFrame} = chain(gl, [pass])

  const animate = (t) => {
    requestAnimationFrame(animate)
    renderFrame(t)
  }
  
  animate(0)

  
})()

