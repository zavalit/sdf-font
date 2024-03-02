
import { renderAtlas } from "@webglify/msdf-atlas";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import {MSDFText} from '../src'
import chain, { animationFactory, PerformancePlugin, CanvasUniformsPlugin } from "@webglify/chain";
import {Pane} from 'tweakpane'
import glyphVertexShader from './shaders2/glyph.vertex.glsl'
import glyphFragmentShader from './shaders2/glyph.fragment.glsl'
import * as THREE from 'three'
import createTextMesh from '../src/three'

console.log('THREE', THREE)

export const PARAMS = {
  PROGRESS: 0.,
  Performance: 0
};


const FontURLs = {
  'Roboto-Regular': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'
};

const fontUrl = FontURLs['Roboto-Regular'];

let fu = fontUrl;




(async () => {

    const text3 = 
`abcq A@
pdsrsd`
    const input3 = {
      fontUrl: fu,
      options: {
        padding: 150,        
        sdfExponent: 60,
        chars: text3,
        unitPerEmFactor: .5
      }
    }
  
    console.time('atlas')
    const atlasData = await renderAtlas(input3)
    console.timeEnd('atlas')
// {

//     const atlasCanvas = atlasData.pages[0] as HTMLCanvasElement
//     const dpr = Math.min(2, window.devicePixelRatio)
//     atlasCanvas.style.width = `${atlasCanvas.width  / dpr }px`
//     atlasCanvas.style.height = `${atlasCanvas.height / dpr }px`
  
//     document.body.appendChild(atlasCanvas)
//   }
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
      paddingHeight: 0.1,
      paddingWidth: .1,
      fontSize: 100,
    }
    

    const mt = MSDFText.init(text3, atlasData, canvasOpts)

    const f = mt.calculateFontSizeByCanvas(canvas)
    console.log('pass fontsize', f, canvas.width, canvas.height, mt)
    mt.updateFontSize(f)
   



    const gl = canvas.getContext('webgl2')!

    const renderer = new THREE.WebGLRenderer({canvas, context: gl});
    renderer.setSize(size[0], size[1]);
    renderer.setPixelRatio(dpr);

    // Create a scene
    const scene = new THREE.Scene();

    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, size[0] / size[1], 0.1, 1000);
    camera.position.z = 5;

    

    //const tm = createTextMesh(mt, canvas, {fragmentShader: glyphFragmentShader, vertexShader: glyphVertexShader})
    const uniforms = {
      uLineHeight: {value: 1. - PARAMS.PROGRESS}
    }
    const tm = createTextMesh(mt, canvas, {uniforms})
    
    scene.add(tm);

    
    // Render the scene

    function animate(t) {
      requestAnimationFrame(animate);

      uniforms.uLineHeight.value = 1. - PARAMS.PROGRESS
      renderer.render(scene, camera);
    }
    
    animate(0)
    

    
    // const pass = mt.canvasTextPass(gl, {
    //   uniforms(gl, locs) {
    //     const textLineHeight =  1. - PARAMS.PROGRESS;
    //     gl.uniform1f(locs.uLineHeight, textLineHeight)
        
    //   }
    // })

    const res = MSDFText.calculateDrawingBufferSizeByFontSize(mt, f)
    console.log('calculated font size', f, 'res', res)

   

    console.timeEnd('text pass')

  
  
})()


const pane = new Pane()
pane.addBinding(PARAMS, 'PROGRESS', {min: 0, max: 1, step: .01});
pane.addBinding(PARAMS, 'Performance', {
  readonly: true,

  view: 'graph',
  min: 0,
  max: 10,
}); 
  