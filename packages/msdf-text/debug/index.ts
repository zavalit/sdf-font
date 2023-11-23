import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {renderCanvasText} from '../src'


(async() => {

  let fu = fontUrl
  fu = travelNextUrl
  //fu = cairoBlackFontUrl

  const text = "12345"
  const input = {
    fontUrl: fu,
    chars: text,
    options: {
      padding: 100,
      sdfExponent: 50,
    }
  }

  const config = await renderAtlas(input)

  console.log('config', config)

  const canvas = document.createElement('canvas')

  renderCanvasText(canvas, text, config)

  document.body.appendChild(canvas)




  const atlasCanvas = config.pages[0] as HTMLCanvasElement
  const dpr = Math.min(2, window.devicePixelRatio)
  atlasCanvas.style.width = `${atlasCanvas.width  / dpr }px`
  atlasCanvas.style.height = `${atlasCanvas.height / dpr }px`

  document.body.appendChild(atlasCanvas)

})()