import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {MSDFText, calculateFontSizeByCanvas} from '../src'
import chain, { WindowUniformsPlugin } from "@webglify/chain";


(async() => {

  let fu = fontUrl
  fu = travelNextUrl
  fu = cairoBlackFontUrl

  const text = 
`Poq@`
  
const input = {
    fontUrl: fu,
    options: {
      padding: 100,
      chars: text,
      sdfExponent: 30,
      unitPerEmFactor: 1.
    }
  }

  console.time('atlas')
  const atlasData = await renderAtlas(input)
  console.timeEnd('atlas')
  console.log('atlasData', atlasData)

  // atlas
  {

    const atlasCanvas = atlasData.pages[0] as HTMLCanvasElement
    const dpr = Math.min(2, window.devicePixelRatio)
    atlasCanvas.style.width = `${atlasCanvas.width  / dpr }px`
    atlasCanvas.style.height = `${atlasCanvas.height / dpr }px`
  
    //document.body.appendChild(atlasCanvas)
  }

  // canvas text
  const letterSpacing = 1.
   
  const canvasOpts = {
    letterSpacing,
    lineHeight: 1.1,    
    alignBounds: true,
    alignHeight: true,
    fontSize: 100,
  }
  
  const mt = MSDFText.init(text, atlasData, canvasOpts)
  {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
  
    console.time('text')

    mt.renderCanvasText(canvas)
    console.timeEnd('text')
      
    const f = mt.calculateFontSizeByCanvas(canvas)
  
    console.log('calculated font size', f)

  }

  // canvas text pass
  {

    const canvas = document.createElement('canvas')

    const size = [400, 300]
    canvas.style.width = `${size[0]}px`
    canvas.style.height = `${size[1]}px`

    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = size[0] * dpr
    canvas.height = size[1] * dpr


    document.body.appendChild(canvas)
  
    console.time('text pass')

    const canvasOpts = {
      letterSpacing,
      lineHeight: 1.1,    
      alignBounds: true,
      alignHeight: true,
      fontSize: 100,
    }
    

    const mt = MSDFText.init(text, atlasData, canvasOpts)
     
    const f = mt.calculateFontSizeByCanvas(canvas)
    console.log('fontsize', f, canvas.width)
    mt.updateFontSize(f)
   

    const gl = canvas.getContext('webgl2')!
    const pass = mt.canvasTextPass(gl)

    
    console.log('calculated font size', f)
   
    chain(gl, [pass], [new WindowUniformsPlugin(gl)]).renderFrame(0)

    console.timeEnd('text pass')

  }
  

  

})()