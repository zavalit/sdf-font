import {Typr, parseFont, FontDataType} from './Typr'
//import woff2otf from './woff2otf'
import bidiFactory from 'bidi-js'
const bidi  = bidiFactory()

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

const cmdArgLengths = {
    M: 2,
    L: 2,
    Q: 4,
    C: 6,
    Z: 0
  }

  // {joinType: "skip+step,..."}
  const joiningTypeRawData = {"C":"18g,ca,368,1kz","D":"17k,6,2,2+4,5+c,2+6,2+1,10+1,9+f,j+11,2+1,a,2,2+1,15+2,3,j+2,6+3,2+8,2,2,2+1,w+a,4+e,3+3,2,3+2,3+5,23+w,2f+4,3,2+9,2,b,2+3,3,1k+9,6+1,3+1,2+2,2+d,30g,p+y,1,1+1g,f+x,2,sd2+1d,jf3+4,f+3,2+4,2+2,b+3,42,2,4+2,2+1,2,3,t+1,9f+w,2,el+2,2+g,d+2,2l,2+1,5,3+1,2+1,2,3,6,16wm+1v","R":"17m+3,2,2,6+3,m,15+2,2+2,h+h,13,3+8,2,2,3+1,2,p+1,x,5+4,5,a,2,2,3,u,c+2,g+1,5,2+1,4+1,5j,6+1,2,b,2+2,f,2+1,1s+2,2,3+1,7,1ez0,2,2+1,4+4,b,4,3,b,42,2+2,4,3,2+1,2,o+3,ae,ep,x,2o+2,3+1,3,5+1,6","L":"x9u,jff,a,fd,jv","T":"4t,gj+33,7o+4,1+1,7c+18,2,2+1,2+1,2,21+a,2,1b+k,h,2u+6,3+5,3+1,2+3,y,2,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,3,7,6+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+d,1,1+1,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,ek,3+1,r+4,1e+4,6+5,2p+c,1+3,1,1+2,1+b,2db+2,3y,2p+v,ff+3,30+1,n9x,1+2,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,5s,6y+2,ea,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+9,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2,2b+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,470+8,at4+4,1o+6,t5,1s+3,2a,f5l+1,2+3,43o+2,a+7,1+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,1,gzau,v+2n,3l+6n"}

  const JT_LEFT = 1, //indicates that a character joins with the subsequent character, but does not join with the preceding character.
    JT_RIGHT = 2, //indicates that a character joins with the preceding character, but does not join with the subsequent character.
    JT_DUAL = 4, //indicates that a character joins with the preceding character and joins with the subsequent character.
    JT_TRANSPARENT = 8, //indicates that the character does not join with adjacent characters and that the character must be skipped over when the shaping engine is evaluating the joining positions in a sequence of characters. When a JT_TRANSPARENT character is encountered in a sequence, the JOINING_TYPE of the preceding character passes through. Diacritical marks are frequently assigned this value.
    JT_JOIN_CAUSING = 16, //indicates that the character forces the use of joining forms with the preceding and subsequent characters. Kashidas and the Zero Width Joiner (U+200D) are both JOIN_CAUSING characters.
    JT_NON_JOINING = 32 //indicates that a character does not join with the preceding or with the subsequent character.,

  let joiningTypeMap
  function getCharJoiningType(ch) {
    if (!joiningTypeMap) {
      const m = {
        R: JT_RIGHT,
        L: JT_LEFT,
        D: JT_DUAL,
        C: JT_JOIN_CAUSING,
        U: JT_NON_JOINING,
        T: JT_TRANSPARENT
      }
      joiningTypeMap = new Map()
      for (let type in joiningTypeRawData) {
        let lastCode = 0
        joiningTypeRawData[type].split(',').forEach(range => {
          let [skip, step] = range.split('+')
          skip = parseInt(skip,36)
          step = step ? parseInt(step, 36) : 0
          joiningTypeMap.set(lastCode += skip, m[type])
          for (let i = step; i--;) {
            joiningTypeMap.set(++lastCode, m[type])
          }
        })
      }
    }
    return joiningTypeMap.get(ch) || JT_NON_JOINING
  }


const ISOL = 1, INIT = 2, FINA = 3, MEDI = 4
const formsToFeatures = [null, 'isol', 'init', 'fina', 'medi']

function detectJoiningForms(str) {
  // This implements the algorithm described here:
  // https://github.com/n8willis/opentype-shaping-documents/blob/master/opentype-shaping-arabic-general.md
  const joiningForms = new Uint8Array(str.length)
  let prevJoiningType = JT_NON_JOINING
  let prevForm = ISOL
  let prevIndex = -1
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)
    let joiningType = getCharJoiningType(code) | 0
    let form = ISOL
    if (joiningType & JT_TRANSPARENT) {
      continue
    }
    if (prevJoiningType & (JT_LEFT | JT_DUAL | JT_JOIN_CAUSING)) {
      if (joiningType & (JT_RIGHT | JT_DUAL | JT_JOIN_CAUSING)) {
        form = FINA
        // isol->init, fina->medi
        if (prevForm === ISOL || prevForm === FINA) {
          joiningForms[prevIndex]++
        }
      }
      else if (joiningType & (JT_LEFT | JT_NON_JOINING)) {
        // medi->fina, init->isol
        if (prevForm === INIT || prevForm === MEDI) {
          joiningForms[prevIndex]--
        }
      }
    }
    else if (prevJoiningType & (JT_RIGHT | JT_NON_JOINING)) {
      // medi->fina, init->isol
      if (prevForm === INIT || prevForm === MEDI) {
        joiningForms[prevIndex]--
      }
    }
    prevForm = joiningForms[i] = form
    prevJoiningType = joiningType
    prevIndex = i
    if (code > 0xffff) i++
  }
  // console.log(str.split('').map(ch => ch.codePointAt(0).toString(16)))
  // console.log(str.split('').map(ch => getCharJoiningType(ch.codePointAt(0))))
  // console.log(Array.from(joiningForms).map(f => formsToFeatures[f] || 'none'))
  return joiningForms
}

export function stringToGlyphs (font, str) {
    const glyphIds = []
    for (let i = 0; i < str.length; i++) {
      const cc = str.codePointAt(i)
      if (cc > 0xffff) i++
      glyphIds.push(Typr.U.codeToGlyph(font, cc))
    }

    const gsub = font['GSUB']
    if (gsub) {
      const {lookupList, featureList} = gsub
      let joiningForms
      const supportedFeatures = /^(rlig|liga|mset|isol|init|fina|medi|half|pres|blws)$/
      const usedLookups = []
      featureList.forEach(feature => {
        if (supportedFeatures.test(feature.tag)) {
          for (let ti = 0; ti < feature.tab.length; ti++) {
            if (usedLookups[feature.tab[ti]]) continue
            usedLookups[feature.tab[ti]] = true
            const tab = lookupList[feature.tab[ti]]
            const isJoiningFeature = /^(isol|init|fina|medi)$/.test(feature.tag)
            if (isJoiningFeature && !joiningForms) { //lazy
              joiningForms = detectJoiningForms(str)
            }
            for (let ci = 0; ci < glyphIds.length; ci++) {
              if (!joiningForms || !isJoiningFeature || formsToFeatures[joiningForms[ci]] === feature.tag) {
                Typr.U._applySubs(glyphIds, ci, tab, lookupList)
              }
            }
          }
        }
      })
    }

    return glyphIds
  }

function firstNum(...args) {
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'number') {
        return args[i]
      }
    }
  }

export function wrapFontObj(typrFont) {
    const glyphMap = Object.create(null)

    const os2 = typrFont['OS/2']
    const hhea = typrFont.hhea
    const unitsPerEm = typrFont.head.unitsPerEm
    const ascender = firstNum(os2 && os2.sTypoAscender, hhea && hhea.ascender, unitsPerEm)

    const fontObj = {
      unitsPerEm,
      ascender,
      descender: firstNum(os2 && os2.sTypoDescender, hhea && hhea.descender, 0),
      capHeight: firstNum(os2 && os2.sCapHeight, ascender),
      xHeight: firstNum(os2 && os2.sxHeight, ascender),
      lineGap: firstNum(os2 && os2.sTypoLineGap, hhea && hhea.lineGap),
      forEachGlyph(text, fontSize, letterSpacing, callback) {
        let glyphX = 0
        const fontScale = 1 / fontObj.unitsPerEm * fontSize

        const glyphIndices = stringToGlyphs(typrFont, text)
        let charIndex = 0
        let prevGlyphIndex = -1
        glyphIndices.forEach((glyphIndex, i) => {
          // Typr returns a glyph index per string codepoint, with -1s in place of those that
          // were omitted due to ligature substitution. So we can track original index in the
          // string via simple increment, and skip everything else when seeing a -1.
          if (glyphIndex !== -1) {
            let glyphObj = glyphMap[glyphIndex]
            if (!glyphObj) {
              const {cmds, crds} = Typr.U.glyphToPath(typrFont, glyphIndex)

              // Build path string
              let path = ''
              let crdsIdx = 0
              for (let i = 0, len = cmds.length; i < len; i++) {
                const numArgs = cmdArgLengths[cmds[i]]
                path += cmds[i]
                for (let j = 1; j <= numArgs; j++) {
                  path += (j > 1 ? ',' : '') + crds[crdsIdx++]
                }
              }

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

              glyphObj = glyphMap[glyphIndex] = {
                index: glyphIndex,
                advanceWidth: typrFont.hmtx.aWidth[glyphIndex],
                xMin,
                yMin,
                xMax,
                yMax,
                path,
                pathCommandCount: cmds.length,
                // forEachPathCommand(callback) {
                //   let argsIndex = 0
                //   const argsArray = []
                //   for (let i = 0, len = cmds.length; i < len; i++) {
                //     const numArgs = cmdArgLengths[cmds[i]]
                //     argsArray.length = 1 + numArgs
                //     argsArray[0] = cmds[i]
                //     for (let j = 1; j <= numArgs; j++) {
                //       argsArray[j] = crds[argsIndex++]
                //     }
                //     callback.apply(null, argsArray)
                //   }
                // }
              }
            }

            // Kerning
            if (prevGlyphIndex !== -1) {
              glyphX += Typr.U.getPairAdjustment(typrFont, prevGlyphIndex, glyphIndex) * fontScale
            }

            callback.call(null, glyphObj, glyphX, charIndex)

            if (glyphObj.advanceWidth) {
              glyphX += glyphObj.advanceWidth * fontScale
            }
            if (letterSpacing) {
              glyphX += letterSpacing * fontSize
            }

            prevGlyphIndex = glyphIndex
          }
          charIndex += (text.codePointAt(charIndex) > 0xffff ? 2 : 1)
        })
        return glyphX
      }
    }

    return fontObj
}

export function handleLoadedFont (fontObj, {
    text='',
    fontSize=1,
    letterSpacing=0,
    lineHeight='normal',
    maxWidth=Infinity,
    direction,
    textAlign='left',
    textIndent=0,
    whiteSpace='normal',
    overflowWrap='normal',
    anchorX = 0,
    anchorY = 0,
    includeCaretPositions=false,
    chunkedBoundsSize=8192,
    colorRanges=null
  }, metricsOnly) {

    const now = Date.now;

    // Array-backed structure for a single line's glyphs data
 function TextLine() {
    this.data = []
  }
  const textLineProps = ['glyphObj', 'x', 'width', 'charIndex']
  TextLine.prototype = {
    width: 0,
    isSoftWrapped: false,
    get count() {
      return Math.ceil(this.data.length / textLineProps.length)
    },
    glyphAt(i) {
      let fly = TextLine.flyweight
      fly.data = this.data
      fly.index = i
      return fly
    },
    splitAt(i) {
      let newLine = new TextLine()
      newLine.data = this.data.splice(i * textLineProps.length)
      return newLine
    }
  }
  TextLine.flyweight = textLineProps.reduce((obj, prop, i, all) => {
    Object.defineProperty(obj, prop, {
      get() {
        return this.data[this.index * textLineProps.length + i]
      },
      set(val) {
        this.data[this.index * textLineProps.length + i] = val
      }
    })
    return obj
  }, {data: null, index: 0})
  const INF = Infinity

  // Set of Unicode Default_Ignorable_Code_Point characters, these will not produce visible glyphs
  // eslint-disable-next-line no-misleading-character-class
  const DEFAULT_IGNORABLE_CHARS = /[\u00AD\u034F\u061C\u115F-\u1160\u17B4-\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8]/

  // This regex (instead of /\s/) allows us to select all whitespace EXCEPT for non-breaking white spaces
  const lineBreakingWhiteSpace = `[^\\S\\u00A0]`

  // Incomplete set of characters that allow line breaking after them
  // In the future we may consider a full Unicode line breaking algorithm impl: https://www.unicode.org/reports/tr14
  const BREAK_AFTER_CHARS = new RegExp(`${lineBreakingWhiteSpace}|[\\-\\u007C\\u00AD\\u2010\\u2012-\\u2014\\u2027\\u2056\\u2E17\\u2E40]`)


    const mainStart = now()
    const timings = {fontLoad: 0, typesetting: 0}
  
      const hasMaxWidth = isFinite(maxWidth)
      let glyphIds = null
      let glyphPositions = null
      let glyphData = null
      let glyphColors = null
      let caretPositions = null
      let visibleBounds = null
      let chunkedBounds = null
      let maxLineWidth = 0
      let renderableGlyphCount = 0
      let canWrap = whiteSpace !== 'nowrap'
      const {ascender, descender, unitsPerEm, lineGap, capHeight, xHeight} = fontObj
      timings.fontLoad = now() - mainStart
      const typesetStart = now()
  
      // Find conversion between native font units and fontSize units; this will already be done
      // for the gx/gy values below but everything else we'll need to convert
      const fontSizeMult = fontSize / unitsPerEm
  
      // Determine appropriate value for 'normal' line height based on the font's actual metrics
      // TODO this does not guarantee individual glyphs won't exceed the line height, e.g. Roboto; should we use yMin/Max instead?
      if (lineHeight === 'normal') {
        lineHeight = (ascender - descender + lineGap) / unitsPerEm
      }
  
      // Determine line height and leading adjustments
      lineHeight = lineHeight * fontSize
      const halfLeading = (lineHeight - (ascender - descender) * fontSizeMult) / 2
      const topBaseline = -(ascender * fontSizeMult + halfLeading)
      const caretHeight = Math.min(lineHeight, (ascender - descender) * fontSizeMult)
      const caretBottomOffset = (ascender + descender) / 2 * fontSizeMult - caretHeight / 2
  
      // Distribute glyphs into lines based on wrapping
      let lineXOffset = textIndent
      let currentLine = new TextLine()
      const lines = [currentLine]
      fontObj.forEachGlyph(text, fontSize, letterSpacing, (glyphObj, glyphX, charIndex) => {
        const char = text.charAt(charIndex)
        const glyphWidth = glyphObj.advanceWidth * fontSizeMult
        const curLineCount = currentLine.count
        let nextLine
  
        // Calc isWhitespace and isEmpty once per glyphObj
        if (!('isEmpty' in glyphObj)) {
          glyphObj.isWhitespace = !!char && new RegExp(lineBreakingWhiteSpace).test(char)
          glyphObj.canBreakAfter = !!char && BREAK_AFTER_CHARS.test(char)
          glyphObj.isEmpty = glyphObj.xMin === glyphObj.xMax || glyphObj.yMin === glyphObj.yMax || DEFAULT_IGNORABLE_CHARS.test(char)
        }
        if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
          renderableGlyphCount++
        }
  
        // If a non-whitespace character overflows the max width, we need to soft-wrap
        if (canWrap && hasMaxWidth && !glyphObj.isWhitespace && glyphX + glyphWidth + lineXOffset > maxWidth && curLineCount) {
          // If it's the first char after a whitespace, start a new line
          if (currentLine.glyphAt(curLineCount - 1).glyphObj.canBreakAfter) {
            nextLine = new TextLine()
            lineXOffset = -glyphX
          } else {
            // Back up looking for a whitespace character to wrap at
            for (let i = curLineCount; i--;) {
              // If we got the start of the line there's no soft break point; make hard break if overflowWrap='break-word'
              if (i === 0 && overflowWrap === 'break-word') {
                nextLine = new TextLine()
                lineXOffset = -glyphX
                break
              }
              // Found a soft break point; move all chars since it to a new line
              else if (currentLine.glyphAt(i).glyphObj.canBreakAfter) {
                nextLine = currentLine.splitAt(i + 1)
                const adjustX = nextLine.glyphAt(0).x
                lineXOffset -= adjustX
                for (let j = nextLine.count; j--;) {
                  nextLine.glyphAt(j).x -= adjustX
                }
                break
              }
            }
          }
          if (nextLine) {
            currentLine.isSoftWrapped = true
            currentLine = nextLine
            lines.push(currentLine)
            maxLineWidth = maxWidth //after soft wrapping use maxWidth as calculated width
          }
        }
  
        let fly = currentLine.glyphAt(currentLine.count)
        fly.glyphObj = glyphObj
        fly.x = glyphX + lineXOffset
        fly.width = glyphWidth
        fly.charIndex = charIndex
  
        // Handle hard line breaks
        if (char === '\n') {
          currentLine = new TextLine()
          lines.push(currentLine)
          lineXOffset = -(glyphX + glyphWidth + (letterSpacing * fontSize)) + textIndent
        }
      })
  
      // Calculate width of each line (excluding trailing whitespace) and maximum block width
      lines.forEach(line => {
        for (let i = line.count; i--;) {
          let {glyphObj, x, width} = line.glyphAt(i)
          if (!glyphObj.isWhitespace) {
            line.width = x + width
            if (line.width > maxLineWidth) {
              maxLineWidth = line.width
            }
            return
          }
        }
      })
  
      // Find overall position adjustments for anchoring
      let anchorXOffset = 0
      let anchorYOffset = 0
      if (anchorX) {
        if (typeof anchorX === 'number') {
          anchorXOffset = -anchorX
        }
        else if (typeof anchorX === 'string') {
          anchorXOffset = -maxLineWidth * (
            anchorX === 'left' ? 0 :
            anchorX === 'center' ? 0.5 :
            anchorX === 'right' ? 1 :
            parsePercent(anchorX)
          )
        }
      }
      if (anchorY) {
        if (typeof anchorY === 'number') {
          anchorYOffset = -anchorY
        }
        else if (typeof anchorY === 'string') {
          let height = lines.length * lineHeight
          anchorYOffset = anchorY === 'top' ? 0 :
            anchorY === 'top-baseline' ? -topBaseline :
            anchorY === 'top-cap' ? -topBaseline - capHeight * fontSizeMult :
            anchorY === 'top-ex' ? -topBaseline - xHeight * fontSizeMult :
            anchorY === 'middle' ? height / 2 :
            anchorY === 'bottom' ? height :
            anchorY === 'bottom-baseline' ? height - halfLeading + descender * fontSizeMult :
            parsePercent(anchorY) * height
        }
      }
  
      if (!metricsOnly) {
        // Resolve bidi levels
        const bidiLevelsResult = bidi.getEmbeddingLevels(text, direction)
  
        // Process each line, applying alignment offsets, adding each glyph to the atlas, and
        // collecting all renderable glyphs into a single collection.
        glyphIds = new Uint16Array(renderableGlyphCount)
        glyphPositions = new Float32Array(renderableGlyphCount * 2)
        glyphData = {}
        visibleBounds = [INF, INF, -INF, -INF]
        chunkedBounds = []
        let lineYOffset = topBaseline
        if (includeCaretPositions) {
          caretPositions = new Float32Array(text.length * 3)
        }
        if (colorRanges) {
          glyphColors = new Uint8Array(renderableGlyphCount * 3)
        }
        let renderableGlyphIndex = 0
        let prevCharIndex = -1
        let colorCharIndex = -1
        let chunk
        let currentColor
        lines.forEach((line, lineIndex) => {
          let {count:lineGlyphCount, width:lineWidth} = line
  
          // Ignore empty lines
          if (lineGlyphCount > 0) {
            // Count trailing whitespaces, we want to ignore these for certain things
            let trailingWhitespaceCount = 0
            for (let i = lineGlyphCount; i-- && line.glyphAt(i).glyphObj.isWhitespace;) {
              trailingWhitespaceCount++
            }
  
            // Apply horizontal alignment adjustments
            let lineXOffset = 0
            let justifyAdjust = 0
            if (textAlign === 'center') {
              lineXOffset = (maxLineWidth - lineWidth) / 2
            } else if (textAlign === 'right') {
              lineXOffset = maxLineWidth - lineWidth
            } else if (textAlign === 'justify' && line.isSoftWrapped) {
              // count non-trailing whitespace characters, and we'll adjust the offsets per character in the next loop
              let whitespaceCount = 0
              for (let i = lineGlyphCount - trailingWhitespaceCount; i--;) {
                if (line.glyphAt(i).glyphObj.isWhitespace) {
                  whitespaceCount++
                }
              }
              justifyAdjust = (maxLineWidth - lineWidth) / whitespaceCount
            }
            if (justifyAdjust || lineXOffset) {
              let justifyOffset = 0
              for (let i = 0; i < lineGlyphCount; i++) {
                let glyphInfo = line.glyphAt(i)
                const glyphObj = glyphInfo.glyphObj
                glyphInfo.x += lineXOffset + justifyOffset
                // Expand non-trailing whitespaces for justify alignment
                if (justifyAdjust !== 0 && glyphObj.isWhitespace && i < lineGlyphCount - trailingWhitespaceCount) {
                  justifyOffset += justifyAdjust
                  glyphInfo.width += justifyAdjust
                }
              }
            }
  
            // Perform bidi range flipping
            const flips = bidi.getReorderSegments(
              text, bidiLevelsResult, line.glyphAt(0).charIndex, line.glyphAt(line.count - 1).charIndex
            )
            for (let fi = 0; fi < flips.length; fi++) {
              const [start, end] = flips[fi]
              // Map start/end string indices to indices in the line
              let left = Infinity, right = -Infinity
              for (let i = 0; i < lineGlyphCount; i++) {
                if (line.glyphAt(i).charIndex >= start) { // gte to handle removed characters
                  let startInLine = i, endInLine = i
                  for (; endInLine < lineGlyphCount; endInLine++) {
                    let info = line.glyphAt(endInLine)
                    if (info.charIndex > end) {
                      break
                    }
                    if (endInLine < lineGlyphCount - trailingWhitespaceCount) { //don't include trailing ws in flip width
                      left = Math.min(left, info.x)
                      right = Math.max(right, info.x + info.width)
                    }
                  }
                  for (let j = startInLine; j < endInLine; j++) {
                    const glyphInfo = line.glyphAt(j)
                    glyphInfo.x = right - (glyphInfo.x + glyphInfo.width - left)
                  }
                  break
                }
              }
            }
  
            // Assemble final data arrays
            let glyphObj
            const setGlyphObj = g => glyphObj = g
            for (let i = 0; i < lineGlyphCount; i++) {
              let glyphInfo = line.glyphAt(i)
              glyphObj = glyphInfo.glyphObj
              const glyphId = glyphObj.index
  
              // Replace mirrored characters in rtl
              const rtl = bidiLevelsResult.levels[glyphInfo.charIndex] & 1 //odd level means rtl
              if (rtl) {
                const mirrored = bidi.getMirroredCharacter(text[glyphInfo.charIndex])
                if (mirrored) {
                  fontObj.forEachGlyph(mirrored, 0, 0, setGlyphObj)
                }
              }
  
              // Add caret positions
              if (includeCaretPositions) {
                const {charIndex} = glyphInfo
                const caretLeft = glyphInfo.x + anchorXOffset
                const caretRight = glyphInfo.x + glyphInfo.width + anchorXOffset
                caretPositions[charIndex * 3] = rtl ? caretRight : caretLeft //start edge x
                caretPositions[charIndex * 3 + 1] = rtl ? caretLeft : caretRight //end edge x
                caretPositions[charIndex * 3 + 2] = lineYOffset + caretBottomOffset + anchorYOffset //common bottom y
  
                // If we skipped any chars from the previous glyph (due to ligature subs), fill in caret
                // positions for those missing char indices; currently this uses a best-guess by dividing
                // the ligature's width evenly. In the future we may try to use the font's LigatureCaretList
                // table to get better interior caret positions.
                const ligCount = charIndex - prevCharIndex
                if (ligCount > 1) {
                  fillLigatureCaretPositions(caretPositions, prevCharIndex, ligCount)
                }
                prevCharIndex = charIndex
              }
  
              // Track current color range
              if (colorRanges) {
                const {charIndex} = glyphInfo
                while(charIndex > colorCharIndex) {
                  colorCharIndex++
                  if (colorRanges.hasOwnProperty(colorCharIndex)) {
                    currentColor = colorRanges[colorCharIndex]
                  }
                }
              }
  
              // Get atlas data for renderable glyphs
              if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
                const idx = renderableGlyphIndex++
  
                // Add this glyph's path data
                if (!glyphData[glyphId]) {
                  glyphData[glyphId] = {
                    path: glyphObj.path,
                    pathBounds: [glyphObj.xMin, glyphObj.yMin, glyphObj.xMax, glyphObj.yMax]
                  }
                }
  
                // Determine final glyph position and add to glyphPositions array
                const glyphX = glyphInfo.x + anchorXOffset
                const glyphY = lineYOffset + anchorYOffset
                glyphPositions[idx * 2] = glyphX
                glyphPositions[idx * 2 + 1] = glyphY
  
                // Track total visible bounds
                const visX0 = glyphX + glyphObj.xMin * fontSizeMult
                const visY0 = glyphY + glyphObj.yMin * fontSizeMult
                const visX1 = glyphX + glyphObj.xMax * fontSizeMult
                const visY1 = glyphY + glyphObj.yMax * fontSizeMult
                if (visX0 < visibleBounds[0]) visibleBounds[0] = visX0
                if (visY0 < visibleBounds[1]) visibleBounds[1] = visY0
                if (visX1 > visibleBounds[2]) visibleBounds[2] = visX1
                if (visY1 > visibleBounds[3]) visibleBounds[3] = visY1
  
                // Track bounding rects for each chunk of N glyphs
                if (idx % chunkedBoundsSize === 0) {
                  chunk = {start: idx, end: idx, rect: [INF, INF, -INF, -INF]}
                  chunkedBounds.push(chunk)
                }
                chunk.end++
                const chunkRect = chunk.rect
                if (visX0 < chunkRect[0]) chunkRect[0] = visX0
                if (visY0 < chunkRect[1]) chunkRect[1] = visY0
                if (visX1 > chunkRect[2]) chunkRect[2] = visX1
                if (visY1 > chunkRect[3]) chunkRect[3] = visY1
  
                // Add to glyph ids array
                glyphIds[idx] = glyphId
  
                // Add colors
                if (colorRanges) {
                  const start = idx * 3
                  glyphColors[start] = currentColor >> 16 & 255
                  glyphColors[start + 1] = currentColor >> 8 & 255
                  glyphColors[start + 2] = currentColor & 255
                }
              }
            }
          }
  
          // Increment y offset for next line
          lineYOffset -= lineHeight
        })
  
        // Fill in remaining caret positions in case the final character was a ligature
        if (caretPositions) {
          const ligCount = text.length - prevCharIndex;
          if (ligCount > 1) {
            fillLigatureCaretPositions(caretPositions, prevCharIndex, ligCount)
          }
        }
      }
  
      // Timing stats
      timings.typesetting = now() - typesetStart
  
      return {
        glyphIds, //font indices for each glyph
        glyphPositions, //x,y of each glyph's origin in layout
        glyphData, //dict holding data about each glyph appearing in the text
        caretPositions, //startX,endX,bottomY caret positions for each char
        caretHeight, //height of cursor from bottom to top
        glyphColors, //color for each glyph, if color ranges supplied
        chunkedBounds, //total rects per (n=chunkedBoundsSize) consecutive glyphs
        fontSize, //calculated em height
        unitsPerEm, //font units per em
        ascender: ascender * fontSizeMult, //font ascender
        descender: descender * fontSizeMult, //font descender
        capHeight: capHeight * fontSizeMult, //font cap-height
        xHeight: xHeight * fontSizeMult, //font x-height
        lineHeight, //computed line height
        topBaseline, //y coordinate of the top line's baseline
        blockBounds: [ //bounds for the whole block of text, including vertical padding for lineHeight
          anchorXOffset,
          anchorYOffset - lines.length * lineHeight,
          anchorXOffset + maxLineWidth,
          anchorYOffset
        ],
        visibleBounds, //total bounds of visible text paths, may be larger or smaller than blockBounds
        timings
      }
    
}



export function addGlyphInfo (glyphSpec, {sdfGlyphSize, sdfMargin}) {
    const {glyphIds, glyphPositions, fontSize, unitsPerEm, timings} = glyphSpec

    const glyphBounds = new Float32Array(glyphIds.length * 4)
    const fontSizeMult = fontSize / unitsPerEm
    let boundsIdx = 0
    let positionsIdx = 0
    glyphSpec.glyphInfo = {}
    // If this is a glyphId not seen before, add it to the atlas
    glyphIds.forEach((glyphId, i) => {
    
        const {path, pathBounds} = glyphSpec.glyphData[glyphId]
        // Margin around path edges in SDF, based on a percentage of the glyph's max dimension.
        // Note we add an extra 0.5 px over the configured value because the outer 0.5 doesn't contain
        // useful interpolated values and will be ignored anyway.
        
        const fontUnitsMargin = Math.max(pathBounds[2] - pathBounds[0], pathBounds[3] - pathBounds[1])
          / sdfGlyphSize * (sdfMargin * sdfGlyphSize + 0.5)

        
        const sdfViewBox = [
          pathBounds[0] - fontUnitsMargin,
          pathBounds[1] - fontUnitsMargin,
          pathBounds[2] + fontUnitsMargin,
          pathBounds[3] + fontUnitsMargin,
        ]
        glyphSpec.glyphInfo[glyphId] = { path, sdfViewBox }
            // Calculate bounds for renderable quads
        // TODO can we get this back off the main thread?
        const posX = glyphPositions[positionsIdx++]
        const posY = glyphPositions[positionsIdx++]
        glyphBounds[boundsIdx++] = posX + sdfViewBox[0] * fontSizeMult
        glyphBounds[boundsIdx++] = posY + sdfViewBox[1] * fontSizeMult
        glyphBounds[boundsIdx++] = posX + sdfViewBox[2] * fontSizeMult
        glyphBounds[boundsIdx++] = posY + sdfViewBox[3] * fontSizeMult

        
      })

      glyphSpec.glyphBounds = glyphBounds

      

      // Convert glyphId to SDF index for the shader
    
}
  
export default Api;

export {getSegements} from './approximate'

export const codeToGlyph = (fontData: FontDataType, charCode: number) => Typr.U.codeToGlyph(fontData, charCode)
export const glyphToPath =  (fontData: FontDataType, glyphId: number) => Typr.U.glyphToPath(fontData, glyphId)

export {
  FontDataType
} 