import opentype from 'opentype.js'

import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {segmentize} from '../src/segmetizer'
import {AtlasGlyph, commandsToPathData} from '../src/glyph'
import {renderAtlas, defaultChars} from '../src'

let fu = fontUrl;
fu = travelNextUrl
 //fu = baseneueFontUrl
 fu = cairoBlackFontUrl


export const calculateSvgSize = (boundingBox, desiredWidth) => {
  const aspectRatio = boundingBox.width / boundingBox.height;
  const svgWidth = desiredWidth;
  const svgHeight = desiredWidth / aspectRatio;

  return { svgWidth, svgHeight };
}

function segmentsToSvgPaths(segments) {
	let svgPaths = [];
	for (let i = 0; i < segments.length; i += 4) {
			let x1 = segments[i];
			let y1 = segments[i + 1];
			let x2 = segments[i + 2];
			let y2 = segments[i + 3];
			let pathData = `M${x1},${y1} L${x2},${y2}`;
			svgPaths.push(pathData);
	}
	return svgPaths;
}

(async() => {
// //render SVG
// 	{

// 		const ag = await AtlasGlyph.init(fu, {unitPerEmFactor: 1.})
// 		const glyph = ag.obtainCharData(`q`, true)
// 		console.log('svg glyph', glyph)
					
	
// 		const bb = glyph.bbox
// 		const res = calculateSvgSize(bb, glyph.bbox.width)
// 		// Create SVG element
// 		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
// 		svg.setAttribute("width", res.svgWidth);
// 		svg.setAttribute("height", res.svgHeight as any);
// 		svg.setAttribute("viewBox", `${bb.minX} ${bb.minY} ${bb.width} ${bb.height}`);
	
// 		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

// 		console.log('glyph.baselineCommands', glyph.baselineCommands)
// 		const segPath = segmentsToSvgPaths(segmentize(glyph.baselineCommands))
	
// 		const d = commandsToPathData(glyph.baselineCommands);
// 		// Set the path data
// 		path.setAttribute("d", d);
// 		//path.setAttribute("d", segPath)
// 		path.setAttribute("stroke", "black");
// 		path.setAttribute("fill", "white");
	
// 		// Append the path to the SVG
// 		svg.appendChild(path);
	
	
// 		// Append the SVG to the body or any other container element
// 		document.body.appendChild(svg);  
// 	}

	
	// //render SDF

	{

		// initiate canvas
		

		const altasInput = {
			fontUrl: fu,
			options: {
				padding: 100,
				unitPerEmFactor: 1.			
			}
		}
		const config = await renderAtlas(altasInput)
		console.log('config', config)
		
		const canvas = config.pages[0] as HTMLCanvasElement
		const dpr = Math.min(2, window.devicePixelRatio)
		canvas.style.width = `${canvas.width  / dpr }px`
  	canvas.style.height = `${canvas.height / dpr }px`
  
		document.body.appendChild(config.pages[0])
		
	}


	console.log('defaultChars', defaultChars)

	// const r = [...Array(256- 161).keys()];
	// const ch = r.map(r => String.fromCharCode(r + 161))
	// console.log('ch', ch.join(''))




})()
