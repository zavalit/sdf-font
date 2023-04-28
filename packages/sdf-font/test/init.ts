import {createSDFTexture, renderText, Api} from '../src'
import fontUrl from 'url:./Roboto/Roboto-Regular.ttf'


const textureApi = Api.init(undefined, {premultipliedAlpha: false})
const textApiWhite = Api.init(undefined)
const textApiRed = Api.init(undefined)

const [width, height] = [300, 300]

const devicePixelRatio = Math.min(window.devicePixelRatio, 2)
textApiWhite.canvas.width = width * devicePixelRatio
textApiWhite.canvas.height = height * devicePixelRatio

textApiWhite.canvas.style.width = `${width}`
textApiWhite.canvas.style.height = `${height}`

const [widthR, heightR] = [350, 100]
textApiRed.canvas.setAttribute('id', 'red')
textApiRed.canvas.width = widthR * devicePixelRatio
textApiRed.canvas.height = heightR * devicePixelRatio


textApiRed.canvas.style.width = `${widthR}`
textApiRed.canvas.style.height = `${heightR}`


document.body.appendChild(textureApi.canvas)
document.body.appendChild(textApiWhite.canvas)
document.body.appendChild(textApiRed.canvas)


const text = 'bwä';

(async() => {

    // render sdf texture
    const sdfTexture = await createSDFTexture(textureApi.gl, {
        text, 
        //fontUrl: '/fonts/Roboto/Roboto-Regular.ttf', 
        fontUrl,
        sdfMargin: 1/256, 
        sdfExponent: 9., 

        sdfWidth: 256, 
        sdfHeight: 256, 
        sdfGlyphSize: 256, 
        sdfBufferSize: 256,
        
        fontSize: .5,
        letterSpacing: .9
    })

    




    // render text
    renderText(textApiWhite.gl, sdfTexture)
    renderText(textApiRed.gl, sdfTexture,)

    // var image = textureApi.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.

    // window.location.href=image; 
    

})()


