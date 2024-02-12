import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {MSDFText, calculateFontSizeByCanvas} from '../src'
import chain, { animationFactory, PerformancePlugin, CanvasUniformsPlugin } from "@webglify/chain";
import {Pane} from 'tweakpane'

export const PARAMS = {
  PROGRESS: 0,
  Performance: 0
};


const FontURLs = {
  'Roboto-Regular': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'
};

const fontUrl = FontURLs['Roboto-Regular'];

(async() => {

  let fu = fontUrl
  //  fu = travelNextUrl
  //  fu = cairoBlackFontUrl

  const text = 
`Headline`
  
const input = {
    fontUrl: fu,
    options: {
      padding: 100,
      chars: text,
      sdfExponent: 30,
      unitPerEmFactor: .2
    }
  }

  console.time('atlas')
  const atlasData = await renderAtlas(input)
  console.timeEnd('atlas')

  // atlas
  // {

  //   const atlasCanvas = atlasData.pages[0] as HTMLCanvasElement
  //   const dpr = Math.min(2, window.devicePixelRatio)
  //   atlasCanvas.style.width = `${atlasCanvas.width  / dpr }px`
  //   atlasCanvas.style.height = `${atlasCanvas.height / dpr }px`
  
  //   document.body.appendChild(atlasCanvas)
  // }

  // canvas text
   
  const canvasOpts = {
    letterSpacing: 1.,
    //lineHeight: 1.3,    
    alignBounds: true,
    //alignHeight: true,
    fontSize: 200,
  }
  
  // // 1. canvas word
  // {

  //   const mt = MSDFText.init(text, atlasData, canvasOpts)

  //   const canvas = document.createElement('canvas')
  //   canvas.setAttribute('id', 'canvas')
  //   document.body.appendChild(canvas)
  
  //   console.time('text')

  //   mt.renderCanvasText(canvas)
  //   console.timeEnd('text')
      
  //   const f = mt.calculateFontSizeByCanvas(canvas)
  //   const res = MSDFText.calculateDrawingBufferSizeByFontSize(mt, f)
  //   console.log('text calculated font size', f, 'res', res)
   
  
  //   console.log('calculated font size', f)

  // }

  // // 2. canvas text pass word
  // {

  //   const canvas = document.createElement('canvas')

  //   const size = [400, 100]
  //   canvas.style.width = `${size[0]}px`
  //   canvas.style.height = `${size[1]}px`

  //   const dpr = Math.min(window.devicePixelRatio, 2)
  //   canvas.width = size[0] * dpr
  //   canvas.height = size[1] * dpr


  //   document.body.appendChild(canvas)
  
  //   console.time('text pass')

  //   const canvasOpts = {
  //     letterSpacing: 1,
  //     lineHeight: 1.2,    
  //     alignBounds: true,
  //     alignHeight: true,
  //     fontSize: 443,
  //   }
    

  //   const mt = MSDFText.init(text, atlasData, canvasOpts)
     
  //   const f = mt.calculateFontSizeByCanvas(canvas)
  //   console.log('pass fontsize', f, canvas.width, canvas.height)
  //   mt.updateFontSize(f)
   

  //   const gl = canvas.getContext('webgl2')!

   

    
  //   const pass = mt.canvasTextPass(gl)

  //   const res = MSDFText.calculateDrawingBufferSizeByFontSize(mt, f)
  //   console.log('calculated font size', f, 'res', res)

  //   const perf = new PerformancePlugin(gl)
   
  //   const {renderFrame} = chain(gl, [pass], 
  //     [
  //       new CanvasUniformsPlugin(gl.canvas as HTMLCanvasElement),
  //       perf
  //     ])

  //   const animate = animationFactory(renderFrame)

  //   window.requestAnimationFrame((time) => animate(time, () => {
  //       PARAMS.Performance = perf.stats[0].avg
  //   }))

  //   console.timeEnd('text pass')

  // }

  // 3. canvas text pass
  {

    const text3 = 
`g
tp`
    const input3 = {
      fontUrl: fu,
      options: {
        padding: 200,        
        sdfExponent: 60,
        chars: text3,
        unitPerEmFactor: 1.
      }
    }
  
    console.time('atlas')
    const atlasData = await renderAtlas(input3)
    console.timeEnd('atlas')
    console.log('atlas data', atlasData)

    const canvas = document.createElement('canvas')

    const size = [300, 600]
    canvas.style.width = `${size[0]}px`
    canvas.style.height = `${size[1]}px`

    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = size[0] * dpr
    canvas.height = size[1] * dpr


    document.body.appendChild(canvas)
  
    console.time('text pass')

    const canvasOpts = {
      letterSpacing: 1,
      textLineHeight: 1.,    
      alignBounds: true,
      alignHeight: true,
      relativePaddingHeight: 0.1,
      relativePaddingWidth: .1,
      fontSize: 100,
    }
    

    const mt = MSDFText.init(text3, atlasData, canvasOpts)
     
    const f = mt.calculateFontSizeByCanvas(canvas)
    console.log('pass fontsize', f, canvas.width, canvas.height, mt)
    mt.updateFontSize(f)
   

    const gl = canvas.getContext('webgl2')!

   

    
    const pass = mt.canvasTextPass(gl, {
      uniforms(gl, locs) {
        const textLineHeight =  1. - PARAMS.PROGRESS;
        gl.uniform1f(locs.uLineHeight, textLineHeight)
        
      }
    })

    const res = MSDFText.calculateDrawingBufferSizeByFontSize(mt, f)
    console.log('calculated font size', f, 'res', res)

    const perf = new PerformancePlugin(gl)
   
    const {renderFrame} = chain(gl, [pass], 
      [
        new CanvasUniformsPlugin(gl.canvas as HTMLCanvasElement),
        perf
      ])

    const animate = animationFactory(renderFrame)

    window.requestAnimationFrame((time) => animate(time, () => {
        PARAMS.Performance = perf.stats[0].avg
        
    }))

    console.timeEnd('text pass')

  }
  

  

})()


const pane = new Pane()
pane.addBinding(PARAMS, 'PROGRESS', {min: 0, max: 1, step: .01});
pane.addBinding(PARAMS, 'Performance', {
  readonly: true,

  view: 'graph',
  min: 0,
  max: 10,
}); 
  