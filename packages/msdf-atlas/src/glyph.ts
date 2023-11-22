import opentype, {Font} from 'opentype.js'
import { segmentize } from './segmetizer';

function riseToBaseLine(commands, spaceToBaseline) {
      
  // Flip Y-coordinates
  return commands.map(cmd => {
      let flippedCommand = { ...cmd };
      if (flippedCommand.y !== undefined) {
          flippedCommand.y = flippedCommand.y + spaceToBaseline;
      }
      if (flippedCommand.y1 !== undefined) {
          flippedCommand.y1 = flippedCommand.y1 + spaceToBaseline;
      }
      return flippedCommand;
  });
}

function flipCommandsOnYAxis(commands) {
  // Find the maximum Y-coordinate
  let maxY = Math.max(...commands.flatMap(cmd => {
      if (cmd.type === 'Q') {
          return [cmd.y, cmd.y1];
      }
      if(cmd.type === 'M' || cmd.type === 'L'){
        return [cmd.y];
      }
      return []
  }));


  // Flip Y-coordinates
  return commands.map(cmd => {
      let flippedCommand = { ...cmd };
      if (flippedCommand.y !== undefined) {
          flippedCommand.y = maxY - flippedCommand.y;
      }
      if (flippedCommand.y1 !== undefined) {
          flippedCommand.y1 = maxY - flippedCommand.y1;
      }

      return flippedCommand;
  });
}


export const commandsToPathData = (commands) => {
  
  return commands.map(command => {
      switch (command.type) {
          case 'M': // MoveTo
          case 'L': // LineTo
              return `${command.type} ${command.x} ${command.y}`;
          case 'Q': // Quadratic Bezier Curve
              return `${command.type} ${command.x1} ${command.y1} ${command.x} ${command.y}`;
          case 'Z': // ClosePath
              return 'Z';
          default:
              throw new Error(`unhandeled command type ${command}`)
              return ''; // Handle other commands or invalid types
      }
  }).join(' ');
}


type BBox = {
  minX: number
  minY: number
  maxY: number
  maxX: number
  width: number
  height: number
}
const calculateBoundingBox = (commands): BBox => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  commands.forEach(command => {
      if (command.x !== undefined) {
          minX = Math.min(minX, command.x);
          maxX = Math.max(maxX, command.x);
      }
      if (command.y !== undefined) {
          minY = Math.min(minY, command.y);
          maxY = Math.max(maxY, command.y);
      }

      // Include control points for quadratic bezier curves
      if (command.type === 'Q') {
          if (command.x1 !== undefined) {
              minX = Math.min(minX, command.x1);
              maxX = Math.max(maxX, command.x1);
          }
          if (command.y1 !== undefined) {
              minY = Math.min(minY, command.y1);
              maxY = Math.max(maxY, command.y1);
          }
      }
  });

  return { minX, minY, maxY, maxX, width: maxX - minX, height: maxY - minY };
}

export const calculateSvgSize = (boundingBox, desiredWidth) => {
  const aspectRatio = boundingBox.width / boundingBox.height;
  const svgWidth = desiredWidth;
  const svgHeight = desiredWidth / aspectRatio;

  return { svgWidth, svgHeight };
}

type WSDFGlyph = {

  glyphBounds: [number, number, number, number]
  segments: number[]
  glyph: Font.Glyph  
  bbox: BBox
  svgPath?: string
  path?: Font.Path
  baselineCommands?: []
}

export class AtlasGlyph {
  
  font: Font
  fontName?: string

  constructor (font: Font, fontName?: string) {
    this.font = font
    this.fontName = fontName
  }

  static async init(fontUrl: string) {
    const buffer = fetch(fontUrl).then(res => res.arrayBuffer());
  
    // if running in async context:
    const font = await opentype.parse(await buffer)
    return new AtlasGlyph(font);
  }
  
  obtainCharData(char: string, debug?: boolean ): WSDFGlyph {
  
      const glyph = this.font.charToGlyph(char)
      const path = glyph.getPath(0, 0, this.font.unitsPerEm)

      const spaceToBaseline = glyph.yMax + glyph.yMin

      const bCommands = riseToBaseLine(path.commands, spaceToBaseline)
      const fCommands =  flipCommandsOnYAxis(bCommands)
      
      const svgPath = commandsToPathData(bCommands);
      const bbox = calculateBoundingBox(bCommands);

      const required: WSDFGlyph = {
        glyph,
        glyphBounds: [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY],
        segments: segmentize(fCommands),
        bbox,
      }
      
      return !debug 
      ? required 
      : {...required,
        glyph,
        path,
        baselineCommands: bCommands,
        svgPath             
      }

    }
}
       
  