import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {MSDFText, calculateFontSizeByCanvas} from '../src'
import chain, { ChainPlugin, PluginCallProps, CanvasUniformsPlugin } from "@webglify/chain";


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
  console.log('atlasData', atlasData)

  // atlas
  {

    const atlasCanvas = atlasData.pages[0] as HTMLCanvasElement
    const dpr = Math.min(2, window.devicePixelRatio)
    atlasCanvas.style.width = `${atlasCanvas.width  / dpr }px`
    atlasCanvas.style.height = `${atlasCanvas.height / dpr }px`
  
    document.body.appendChild(atlasCanvas)
  }

  // canvas text
  const letterSpacing = 1.
   
  const canvasOpts = {
    letterSpacing: 1.1,
    //lineHeight: 1.3,    
    alignBounds: true,
    //alignHeight: true,
    fontSize: 200,
  }
  
  const mt = MSDFText.init(text, atlasData, canvasOpts)
  {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('id', 'canvas')
    document.body.appendChild(canvas)
  
    console.time('text')

    mt.renderCanvasText(canvas)
    console.timeEnd('text')
      
    const f = mt.calculateFontSizeByCanvas(canvas)
    const res = MSDFText.calculateDrawingBufferSizeByFontSize(mt, f)
    console.log('text calculated font size', f, 'res', res)
   
  
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
      letterSpacing: 1,
      lineHeight: 1.2,    
      alignBounds: true,
      alignHeight: true,
      fontSize: 443,
    }
    

    const mt = MSDFText.init(text, atlasData, canvasOpts)
     
    const f = mt.calculateFontSizeByCanvas(canvas)
    console.log('pass fontsize', f, canvas.width, canvas.height)
    mt.updateFontSize(f)
   

    const gl = canvas.getContext('webgl2')!

   

    class CP implements ChainPlugin {

      gl
      constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
      }

      beforeDrawCall(_: PluginCallProps){
          // Set clear color to black, fully opaque
          gl.clearColor(1.0, 0.0, 0.0, 1.0);
          // Clear the color buffer with specified clear color
          gl.clear(gl.COLOR_BUFFER_BIT);
      }

      afterDrawCall (_: PluginCallProps) {

      }

    }
    
    
    const pass = mt.canvasTextPass(gl)

    const res = MSDFText.calculateDrawingBufferSizeByFontSize(mt, f)
    console.log('calculated font size', f, 'res', res)
   
    chain(gl, [pass], [new CanvasUniformsPlugin(gl.canvas), new CP(gl)]).renderFrame(0)

    console.timeEnd('text pass')

  }
  

  

})()