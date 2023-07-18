import {Typr, parseFont, FontDataType} from './Typr'
//import woff2otf from './woff2otf'
//import bidiFactory from 'bidi-js'
//const bidi  = bidiFactory()

class Api {

    fontBuffer: ArrayBuffer

    constructor(fontBuffer: ArrayBuffer){
        this.fontBuffer = fontBuffer
    }

    parse() {
      return parseFont(this.fontBuffer)[0]
    }

    
    
    

    static async asyncInit(src: string): Promise<Api> {
        const buffer = await fetch(src)
            .then(response => response.arrayBuffer())

        //const fontBuffer = src.match(/\.woff$/) && Api.woff2OTF(buffer) || buffer
        return new Api(buffer)
    }

    // static fontTag(buffer: ArrayBuffer) {
    //     const peek = new Uint8Array(buffer, 0, 4)
    //     return Typr.B.readASCII(peek, 0, 4)
    // }

    // static woff2OTF(buffer: ArrayBuffer): ArrayBuffer {
        
    //     const peek = new Uint8Array(buffer, 0, 4)
    //     const tag = Typr.B.readASCII(peek, 0, 4)
    //     if (tag === 'wOFF') {
    //         buffer = woff2otf(buffer)
    //     } else if (tag === 'wOF2') {
    //         throw new Error('woff2 fonts not supported')
    //     }

    //     return buffer
    // }

}


export default Api;

export {getSegements, cmdsToPath} from './approximate'


export const codeToGlyph = (fontData: FontDataType, charCode: number) => Typr.U.codeToGlyph(fontData, charCode)
export const glyphToPath =  (fontData: FontDataType, glyphId: number) => Typr.U.glyphToPath(fontData, glyphId)

export {
  FontDataType
} 