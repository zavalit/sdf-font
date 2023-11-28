import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {renderCanvasText, calculateFontSizeByCanvas} from '../src'


(async() => {

  let fu = fontUrl
  fu = travelNextUrl
  //fu = cairoBlackFontUrl

  const text = 
`1234srs
56
werpeW@Super`
  const input = {
    fontUrl: fu,
    options: {
      padding: 110,
     // chars: text,
      sdfExponent: 50,
      unitPerEmFactor: .15
    }
  }

  const config = await renderAtlas(input)

  

  const canvas = document.createElement('canvas')

  const letterSpacing = 1.
  renderCanvasText(canvas, text, config, {
    letterSpacing,    
    alignBounds: true,
    fontSize: 400
  })

  document.body.appendChild(canvas)



  const canvas2 = document.createElement('canvas')
  
  const f = calculateFontSizeByCanvas(canvas2, text, config, {
    letterSpacing,    
    
    
  })

  console.log('calculated font size', f)




  const atlasCanvas = config.pages[0] as HTMLCanvasElement
  const dpr = Math.min(2, window.devicePixelRatio)
  atlasCanvas.style.width = `${atlasCanvas.width  / dpr }px`
  atlasCanvas.style.height = `${atlasCanvas.height / dpr }px`

  document.body.appendChild(atlasCanvas)

})()