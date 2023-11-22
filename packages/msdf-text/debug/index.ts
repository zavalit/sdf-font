import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {segmentize} from '../src/segmetizer'


(async() => {

  let fu = fontUrl
  fu = travelNextUrl

  const input = {
    fontUrl: fu,
    chars: 'qW,'
  }

  const config = await renderAtlas(input)

  console.log(config)
  const canvas = config.pages[0] as HTMLCanvasElement
  const dpr = Math.min(2, window.devicePixelRatio)
  canvas.style.width = `${canvas.width  / dpr }px`
  canvas.style.height = `${canvas.height / dpr }px`

  document.body.appendChild(canvas)

})()