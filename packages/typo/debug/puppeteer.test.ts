import puppeteer from "puppeteer";

import {createSDFTexture, renderText, Api} from '../'

const portIndex = process.argv.findIndex((arg, i) => arg === '-p');
const port = process.argv[portIndex + 1];



(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
  
    await page.goto(`http://localhost:${port}/`);
  
    // Set screen size
    await page.setViewport({width: 1080, height: 1024});

  
    const textureApi = Api.init(undefined, {premultipliedAlpha: false})
    const textApi = Api.init(undefined, {premultipliedAlpha: false})

  
    const chars = 'ü'

    // render sdf texture
    const sdfTexture = createSDFTexture(textureApi.gl, chars, '/fonts/Roboto/Roboto-Regular.ttf')

    // render text
    renderText(textApi.gl, chars, sdfTexture)    
    
    //await browser.close();

})();