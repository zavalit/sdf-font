import createSDFTexture, {initFont, SDFParams, FontMetaType} from "../sdfTexture";
import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import JSZip from 'jszip';
import {codeToGlyph, glyphToPath} from '../index'







type TextureResultType = {
  texture: HTMLCanvasElement,
  fontMeta: FontMetaType,
  sizesMap: any
}

const dpr = Math.min(2., window.devicePixelRatio)

export const getTexture = async (fontUrl: string, sdfParams: SDFParams) : Promise<TextureResultType> => {
  const canvas = document.createElement('canvas')!
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false})!;

  const fontData = await initFont(fontUrl)

  const {chars, ...rest} = preparePayload(fontData)

  const os2 = fontData['OS/2']
    
  const fontMeta = {
    unitsPerEm: fontData.head.unitsPerEm,
    ascender: os2.sTypoAscender,
    descender: os2.sTypoDescender,
    capHeight: os2.sCapHeight,
    xHeight: os2.sxHeight,
    lineGap: os2.sTypoLineGap,
  };    

  
  const sdfTexture = await createSDFTexture(gl, fontData, sdfParams, chars)
  return {...sdfTexture, fontMeta, ...rest}
}






const input = document.getElementById('font-url')
input.setAttribute('value', fontUrl)
console.log('input', input)


const preparePayload = (fontMeta) => {
  
  return ([...Array(256).keys()]).reduce((acc, charCode) => {
    const char = String.fromCodePoint(charCode)
    const chars = acc.chars.concat(char)
            
    const glyphId = codeToGlyph(fontMeta, charCode)
    const {crds} = glyphToPath(fontMeta, glyphId)
    const advanceWidth = fontMeta.hmtx.aWidth[glyphId]


    // Find extents - Glyf gives this in metadata but not CFF, and Typr doesn't
    // normalize the two, so it's simplest just to iterate ourselves.
    let xMin, yMin, xMax, yMax
    if (crds.length) {
      xMin = yMin = Infinity
      xMax = yMax = -Infinity
      for (let i = 0, len = crds.length; i < len; i += 2) {
        let x = crds[i]
        let y = crds[i + 1]
        if (x < xMin) xMin = x
        if (y < yMin) yMin = y
        if (x > xMax) xMax = x
        if (y > yMax) yMax = y
      }
    } else {
      xMin = xMax = yMin = yMax = 0
    }
    const sizesMap = {...acc.sizesMap, [charCode]: [ xMin, yMin, xMax, yMax, advanceWidth]}
    return {chars, sizesMap}
  }, {chars: "", sizesMap: {}});
}








// Convert canvas to a Blob object
function canvasToBlob(canvas: HTMLCanvasElement): Blob {
  const dataURL = canvas.toDataURL('image/png');
  const base64String = atob(dataURL.split(',')[1]);
  const arrayBuffer = new ArrayBuffer(base64String.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < base64String.length; i++) {
    uint8Array[i] = base64String.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: 'image/png' });
}




document.getElementById('sdf-texture').addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = e.target as HTMLFormElement;
  const fontUrl = form.elements['font-url'].value;

  const sdfGlyphSize = form.elements['sdf-glyph-size'].value;
  const sdfParams = {
    sdfGlyphSize,
    sdfMargin: 10/sdfGlyphSize,
    sdfExponent: 9
  }

  const textureData = await getTexture(fontUrl, sdfParams)
  if(!textureData){
    throw new Error(`couldn\'t load font ${fontUrl} `)
  }

  console.log('textureData', textureData)
  
  
  const {texture, ...meta} = textureData
  console.log('texture', texture, meta)

  const canvas = document.createElement('canvas')
  canvas.width = texture.width
  canvas.height = texture.height
  var ctx = canvas.getContext('2d');
  ctx.drawImage(texture, 0, 0);

  form.appendChild(canvas)

  document.getElementById('download').addEventListener('click', () => {
   

    // Convert canvas to PNG image
    const imageBlob = canvasToBlob(canvas);


    // Prepare JSON metadata
    const metadata = { sdfParams, ...meta };
    const metadataJson = JSON.stringify(metadata, null, 2);

    // Create a ZIP archive
    const zip = new JSZip();
    zip.file('sdfTexture.png', imageBlob, { binary: true });
    zip.file('metadata.json', metadataJson);

    // Generate the ZIP file asynchronously
    zip.generateAsync({ type: 'blob' })
    .then((zipBlob) => {
      // Create a download link for the ZIP file
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = 'sdfTextureData.zip';
      downloadLink.click();

      // Clean up
      URL.revokeObjectURL(downloadLink.href);
    });
    
  });
  
})





function loadImage(url: string, callback: (i:HTMLImageElement) => void) {
  const image = new Image();
  image.src = url;
  image.onload = () => callback(image);
  return image;
}

