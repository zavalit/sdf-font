
import {segmentize} from '../src/segmetizer'
import {renderSVGPathToCanvas} from '../src'




const pathD = document.querySelector('#icon path')!.getAttribute('d')!;
//const pathD = document.querySelector('#icon_gallery path')!.getAttribute('d')!;
//const pathD = document.querySelector('#icon_house path')!.getAttribute('d')!;
//const pathD = document.querySelector('#icon_pencil path')!.getAttribute('d')!;

        // Parse the d attribute into an array of command objects

// // Assuming commands is an array of path commands
// let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

// tCommands.forEach(cmd => {
//   switch (cmd.type) {
//     case 'M':
//     case 'L':
//       minX = Math.min(minX, cmd.x);
//       minY = Math.min(minY, cmd.y);
//       maxX = Math.max(maxX, cmd.x);
//       maxY = Math.max(maxY, cmd.y);
//       break;
//     case 'C':
//       minX = Math.min(minX, cmd.x, cmd.x1, cmd.x2);
//       minY = Math.min(minY, cmd.y, cmd.y1, cmd.y2);
//       maxX = Math.max(maxX, cmd.x, cmd.x1, cmd.x2);
//       maxY = Math.max(maxY, cmd.y, cmd.y1, cmd.y2);
//       break;
//   }
// });

// const width = maxX - minX
// const height = maxY - minY


// const viewBox = `${minX - 5} ${minY - 5} ${width +  10} ${height + 10}`;


const scale = 10;
// // Create the SVG element
// const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
// svg.setAttribute("width", width * scale );
// svg.setAttribute("height", height * scale);
// svg.setAttribute("viewBox", viewBox);
// svg.setAttribute("fill", "none");
// svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

// // Create the path element
// const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
// path.setAttribute("d", pathData);
// path.setAttribute("fill", "black");

// console.log('pathData', pathData)

// // Append the path to the SVG
// svg.appendChild(path);

// // Append the SVG to the body or another element in the document
// document.body.appendChild(svg);



(async() => {
 
  
  const canvas = await renderSVGPathToCanvas(pathD, {scale: 10, padding: 30, sdfExponent: 10})
  document.body.appendChild(canvas)
})()