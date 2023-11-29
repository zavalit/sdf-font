import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {MSDFText, calculateFontSizeByCanvas} from '../src'


(async() => {

  let fu = fontUrl
  //fu = travelNextUrl
  fu = cairoBlackFontUrl

  const text = 
`TYPOg`
  
const input = {
    fontUrl: fu,
    options: {
      padding: 100,
     // chars: text,
      sdfExponent: 30,
      unitPerEmFactor: .2
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
    fontSize: 100
  }
  
  const mt = MSDFText.init(text, atlasData, canvasOpts)
  {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
  
    console.time('text')

    mt.renderCanvasText(canvas)
    console.timeEnd('text')
  
    const canvas2 = document.createElement('canvas')
    
    const f = mt.calculateFontSizeByCanvas(canvas)
  
    console.log('calculated font size', f)

  }

  // canvas text pass
  {

  }
  

  

})()