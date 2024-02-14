
import {segmentize} from '../src/segmetizer'
import {renderIcon} from '../src/iconindex'

// Function to parse the d attribute of a path into an array of command objects
function parsePathCommands(d, scale = 10) {
  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  return commands.map(command => {
      const type = command.charAt(0);
      let args = command.slice(1).trim().split(/[\s,]+/).map(Number);
      const cmd = { type };
      console.log('args', args)
      if (args.length) {
          args = args.map(a => a * scale)
          switch (type.toUpperCase()) {
              case 'M':
              case 'L':
                  [cmd.x, cmd.y] = args;
                  break;
              case 'C':
                  [cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y] = args;
                  break;
              case 'H':
                    cmd.x = args[0]; // Only x coordinate for horizontal line
                    break;
              case 'V':
                    cmd.y = args[0]; // Only y coordinate for vertical line
                  break;
              // Add cases for other command types as needed
          }
      }
      return cmd;
  });
}

function transformVHtoL(commands) {
  let lastX = 0, lastY = 0; // Track the last x and y coordinates
  const transformedCommands = commands.map(cmd => {
    const { type, x, y } = cmd;
    switch (type) {
      case 'M': // Move command sets the starting point
        lastX = x;
        lastY = y;
        return cmd; // 'M' commands remain unchanged
      case 'L': // Line command updates the last known x and y coordinates
        lastX = x;
        lastY = y;
        return cmd; // 'L' commands remain unchanged
      case 'H': // Horizontal line command
        lastX = x; // Update lastX to the new x value
        return { type: 'L', x, y: lastY }; // Transform to 'L' with lastY
      case 'V': // Vertical line command
        lastY = y; // Update lastY to the new y value
        return { type: 'L', x: lastX, y }; // Transform to 'L' with lastX
      // Add handling for other command types as needed
      default:
        return cmd; // Return the command unchanged if it's not 'H' or 'V'
    }
  });
  return transformedCommands;
}





const pathD = document.querySelector('#icon path')!.getAttribute('d');

        // Parse the d attribute into an array of command objects
const commands = parsePathCommands(pathD);
const tCommands = transformVHtoL(commands);
console.log('commands', commands, JSON.stringify(tCommands))



// Convert commands to path data string
const pathData = tCommands.map(cmd => {
  switch (cmd.type) {
    case 'M':
    case 'L':
      return `${cmd.type} ${cmd.x} ${cmd.y}`;
    case 'C':
      return `${cmd.type} ${cmd.x1} ${cmd.y1}, ${cmd.x2} ${cmd.y2}, ${cmd.x} ${cmd.y}`;
    case 'Z':
      return cmd.type; // No coordinates needed for 'Z'
    default:
      return '';
  }
}).join(' ');


// Assuming commands is an array of path commands
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

tCommands.forEach(cmd => {
  switch (cmd.type) {
    case 'M':
    case 'L':
      minX = Math.min(minX, cmd.x);
      minY = Math.min(minY, cmd.y);
      maxX = Math.max(maxX, cmd.x);
      maxY = Math.max(maxY, cmd.y);
      break;
    case 'C':
      minX = Math.min(minX, cmd.x, cmd.x1, cmd.x2);
      minY = Math.min(minY, cmd.y, cmd.y1, cmd.y2);
      maxX = Math.max(maxX, cmd.x, cmd.x1, cmd.x2);
      maxY = Math.max(maxY, cmd.y, cmd.y1, cmd.y2);
      break;
  }
});

const width = maxX - minX
const height = maxY - minY


const viewBox = `${minX - 5} ${minY - 5} ${width +  10} ${height + 10}`;


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
  const segments = segmentize(tCommands);

  const bounds = [minX, minY, maxX, maxY]
  const res = [width + 20, height + 20]  
  
  const canvas = await renderIcon({segments, bounds}, {}, res)
  document.body.appendChild(canvas)
})()