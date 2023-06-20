import {renderText, initTypr, getFontMetaData} from '../src'
import createSDFTexture from '../src/sdfTexture'
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'


export class Api {

    canvas: HTMLCanvasElement
    gl: WebGL2RenderingContext

    constructor(canvas: HTMLCanvasElement, options?: WebGLContextAttributes) {
        
        this.canvas = canvas
        
        const gl = this.canvas.getContext('webgl2', options)!
        
        if(gl === null) {
            throw new Error('webgl2 is not supported')
        }
        
        this.gl = gl;
        
    }
    
    static init(canvas?: HTMLCanvasElement, options?: WebGLContextAttributes) {
        
        if (!canvas) {
            canvas = document.createElement('canvas')
        }
        
        return new Api(canvas, options)

    }
}

const textureApi = Api.init(undefined, {premultipliedAlpha: false})
const textApiWhite = Api.init(undefined)
const textApiRed = Api.init(undefined)

const [width, height] = [300, 300]

const devicePixelRatio = Math.min(window.devicePixelRatio, 2)
textApiWhite.canvas.width = width * devicePixelRatio
textApiWhite.canvas.height = height * devicePixelRatio

textApiWhite.canvas.style.width = `${width}`
textApiWhite.canvas.style.height = `${height}`

const [widthR, heightR] = [450, 100]
textApiRed.canvas.setAttribute('id', 'red')
textApiRed.canvas.width = widthR * devicePixelRatio
textApiRed.canvas.height = heightR * devicePixelRatio


textApiRed.canvas.style.width = `${widthR}`
textApiRed.canvas.style.height = `${heightR}`

document.body.appendChild(textureApi.canvas)
document.body.prepend(textApiWhite.canvas)
document.body.prepend(textApiRed.canvas)


let text = 'qqwddsdlksldk sdlksdl ';
//text = 'Apyl'

const alphabet = [...Array(256).keys()].map(k => String.fromCodePoint(k))


const sdfSize = 64;

(async() => {

    
    const params = {
        text: alphabet.join(''),
        //fontUrl: '/fonts/Roboto/Roboto-Regular.ttf', 
        fontUrl,
        sdfMargin: 1/sdfSize, 
        sdfExponent: 9., 

        sdfWidth: sdfSize, 
        sdfHeight: sdfSize, 
        sdfGlyphSize: sdfSize, 
        sdfBufferSize: sdfSize,
        
        fontSize: 1.,
        letterSpacing: .95
    }
    const typr = await initTypr(fontUrl)

    //render sdf texture
    const sdfTexture = await createSDFTexture(textureApi.gl, typr, params)

    




    // render text
    const meta = getFontMetaData(typr, {...params, text})

    renderText(textApiWhite.gl, sdfTexture, meta)
    renderText(textApiRed.gl, sdfTexture, meta)

    // var image = textureApi.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.

    // window.location.href=image; 
    

})()


