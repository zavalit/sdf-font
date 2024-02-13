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
      if (flippedCommand.y2 !== undefined) {
        flippedCommand.y2 = flippedCommand.y2 + spaceToBaseline;
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
      if (cmd.type === 'C') {
        return [cmd.y, cmd.y1, cmd.y2];
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
      if (flippedCommand.y2 !== undefined) {
        flippedCommand.y2 = maxY - flippedCommand.y2;
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
          case 'C': // Bézier curve from the current position
              return `${command.type} ${command.x1} ${command.y1} ${command.x2} ${command.y2} ${command.x} ${command.y}`;
          case 'Z': // ClosePath
              return 'Z';
          default:
              console.error(command)
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


type WSDFGlyph = {

  glyphBounds: [number, number, number, number]
  segments: number[]
  bbox: BBox
  advanceWidth: number,
  unicode: number,
  index: number
 
  svgPath?: string
  path?: Font.Path
  baselineCommands?: []
}



type AtlasGlyphOptions = {
  fontName?: string
  unitPerEmFactor: number
}

const defaultAtlasGlyphOptions = {
  unitPerEmFactor: 1
}


export class AtlasGlyph {
  
  font: Font
  fontName?: string
  fontSize: number
  unitPerEmFactor: number

  constructor (font: Font, opts: AtlasGlyphOptions) {
    this.font = font
    this.fontName = opts.fontName
    this.unitPerEmFactor = opts.unitPerEmFactor || defaultAtlasGlyphOptions.unitPerEmFactor
    this.fontSize = font.unitsPerEm * opts.unitPerEmFactor
  }

  static async init(fontUrl: string, options?: AtlasGlyphOptions) {
    const buffer = fetch(fontUrl).then(res => res.arrayBuffer());
  
    // if running in async context:
    const font = await opentype.parse(await buffer)
    const opts = {...defaultAtlasGlyphOptions, ...options}
    return new AtlasGlyph(font, opts);
  }
  
  obtainCharData(char: string, debug?: boolean ): WSDFGlyph {

      const uf = this.unitPerEmFactor
  
      const glyph = this.font.charToGlyph(char)
      
      const path = glyph.getPath(0, 0, this.fontSize)

      
      const {x1, y1, x2, y2} = glyph.getBoundingBox()
      const spaceToBaseline = y2 + y1

      const bCommands = riseToBaseLine(path.commands, spaceToBaseline)
      const fCommands = flipCommandsOnYAxis(bCommands)
      const svgPath = commandsToPathData(fCommands);
      const [minX, maxX, minY, maxY] = [x1, x2, y1, y2].map(u => u*uf)
      const bbox = {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
      
      
      
      const required: WSDFGlyph = {
        glyphBounds: [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY],
        segments: segmentize(fCommands),
        bbox,
        advanceWidth: glyph.advanceWidth * uf,
        unicode: glyph.unicode,
        index: glyph.index
      }
      
      return !debug 
      ? required 
      : {...required,
        path,
        baselineCommands: bCommands,
        svgPath             
      }

    }
}
       
  