import opentype from 'opentype.js'

import fontUrl from 'url:./fonts/Roboto/Roboto-Regular.ttf'
import interFontUrl from 'url:./fonts/Inter/static/Inter-Regular.ttf'
import cairoFontUrl from 'url:./fonts/Cairo/static/Cairo-Regular.ttf'
import cairoBlackFontUrl from 'url:./fonts/Cairo/static/Cairo-Black.ttf'
import baseneueFontUrl from 'url:./fonts/BaseNeue-Trial/web/WOFF/BaseNeueTrial-Regular.ttf'
import travelNextUrl from 'url:./fonts/TT-Travels-Next/TT Travels Next Regular.ttf'
import bluescreensTrialUrl from 'url:./fonts/ttbluescreens_trial/TT Bluescreens Trial Regular.ttf'
import {segmentize} from '../src/segmetizer'
import {AtlasGlyph, calculateSvgSize, commandsToPathData} from '../src/glyph'
import {renderAtlas} from '../src'

let fu = fontUrl;
fu = travelNextUrl
 //fu = baseneueFontUrl
 //fu = cairoBlackFontUrl

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

	const ag = await AtlasGlyph.init(fu)
	const glyph = ag.obtainCharData('ä', true)
	
	
	// render SVG
	// {
		
	
	// 	const desiredWidth = 200; // Set this to your desired width
	
	
	// 	const bb = glyph.bbox
	// 	const res = calculateSvgSize(bb, desiredWidth)
	// 	// Create SVG element
	// 	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	// 	svg.setAttribute("width", res.svgWidth);
	// 	svg.setAttribute("height", res.svgHeight as any);
	// 	svg.setAttribute("viewBox", `${bb.minX} ${bb.minY} ${bb.width} ${bb.height}`);
	
	// 	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

	// 	console.log('glyph.baselineCommands', glyph.baselineCommands)
	// 	const segPath = segmentsToSvgPaths(segmentize(glyph.baselineCommands))
	
	// 	const d = commandsToPathData(glyph.baselineCommands);
	// 	// Set the path data
	// 	//path.setAttribute("d", d);
	// 	path.setAttribute("d", segPath)
	// 	path.setAttribute("stroke", "black");
	// 	path.setAttribute("fill", "white");
	
	// 	// Append the path to the SVG
	// 	svg.appendChild(path);
	
	
	// 	// Append the SVG to the body or any other container element
	// 	document.body.appendChild(svg);  
	// }

	
	// render SDF

	{

		// initiate canvas
		

		const altasInput = {
			fontUrl: fu,
			chars: 'qW,'
		}
		const config = await renderAtlas(altasInput)
		console.log('config', config)
		
		const canvas = config.pages[0] as HTMLCanvasElement
		const dpr = Math.min(2, window.devicePixelRatio)
		canvas.style.width = `${canvas.width  / dpr }px`
  	canvas.style.height = `${canvas.height / dpr }px`
  
		document.body.appendChild(config.pages[0])
		
	}





})()
