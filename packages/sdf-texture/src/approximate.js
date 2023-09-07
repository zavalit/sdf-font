/**
 * Find the point on a quadratic bezier curve at t where t is in the range [0, 1]
 */
function pointOnQuadraticBezier (x0, y0, x1, y1, x2, y2, t, pointOut) {
    const t2 = 1 - t
    pointOut.x = t2 * t2 * x0 + 2 * t2 * t * x1 + t * t * x2
    pointOut.y = t2 * t2 * y0 + 2 * t2 * t * y1 + t * t * y2
  }
  
  /**
   * Find the point on a cubic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnCubicBezier (x0, y0, x1, y1, x2, y2, x3, y3, t, pointOut) {
    const t2 = 1 - t
    pointOut.x = t2 * t2 * t2 * x0 + 3 * t2 * t2 * t * x1 + 3 * t2 * t * t * x2 + t * t * t * x3
    pointOut.y = t2 * t2 * t2 * y0 + 3 * t2 * t2 * t * y1 + 3 * t2 * t * t * y2 + t * t * t * y3
  }
  


export function forEachPathCommand(pathString, commandCallback) {
    const segmentRE = /([MLQCZ])([^MLQCZ]*)/g
    let match, firstX, firstY, prevX, prevY
    while ((match = segmentRE.exec(pathString))) {
      const args = match[2].split(/[,\s]+/)
      switch (match[1]) {
        case 'M':
          prevX = firstX = +args[0]
          prevY = firstY = +args[1]
          break
        case 'L':
          if (+args[0] !== prevX || +args[1] !== prevY) { // yup, some fonts have zero-length line commands
            commandCallback('L', prevX, prevY, (prevX = +args[0]), (prevY = +args[1]))
          }
          break
        case 'Q': {
          commandCallback('Q', prevX, prevY, (prevX = +args[2]), (prevY = +args[3]), +args[0], +args[1])
          break
        }
        case 'C': {
          commandCallback('C', prevX, prevY, (prevX = +args[4]), (prevY = +args[5]), +args[0], +args[1], +args[2], +args[3])
          break
        }
        case 'Z':
          if (prevX !== firstX || prevY !== firstY) {
            commandCallback('L', prevX, prevY, firstX, firstY)
          }
          break
      }
    }
  }

const cmdArgLengths = {
    M: 2,
    L: 2,
    Q: 4,
    C: 6,
    Z: 0
}

export function cmdsToPath (cmds, crds) {

  
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

  return path;

}

export function pathToLineSegments (pathString, segmentCallback, curvePoints = 16) {
    const tempPoint = { x: 0, y: 0 }
    forEachPathCommand(pathString, (command, startX, startY, endX, endY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y) => {
      switch (command) {
        case 'L':
          segmentCallback(startX, startY, endX, endY)
          break
        case 'Q': {
          let prevCurveX = startX
          let prevCurveY = startY
          for (let i = 1; i < curvePoints; i++) {
            pointOnQuadraticBezier(
              startX, startY,
              ctrl1X, ctrl1Y,
              endX, endY,
              i / (curvePoints - 1),
              tempPoint
            )
            segmentCallback(prevCurveX, prevCurveY, tempPoint.x, tempPoint.y)
            prevCurveX = tempPoint.x
            prevCurveY = tempPoint.y
          }
          break
        }
        case 'C': {
          let prevCurveX = startX
          let prevCurveY = startY
          for (let i = 1; i < curvePoints; i++) {
            pointOnCubicBezier(
              startX, startY,
              ctrl1X, ctrl1Y,
              ctrl2X, ctrl2Y,
              endX, endY,
              i / (curvePoints - 1),
              tempPoint
            )
            segmentCallback(prevCurveX, prevCurveY, tempPoint.x, tempPoint.y)
            prevCurveX = tempPoint.x
            prevCurveY = tempPoint.y
          }
          break
        }
      }
    })
  }
  

export function getSegements (path) {
    let lineSegmentCoords = []
    pathToLineSegments(path, (x1, y1, x2, y2) => {
      lineSegmentCoords.push(x1, y1, x2, y2)
    })
   
   return new Float32Array(lineSegmentCoords)

}




// type Segment = {
//     x1:  number
//     y1:  number
//     x2:  number
//     y2:  number
//     distance:  number,
//     offset: number
// }
export const approximateWithDistance = (path) => {

    const segments = []

    let distance = 0
    let offset = 0
    pathToLineSegments(path, (x1, y1, x2, y2) => {
        offset += distance
        distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

        segments.push({x1, y1, x2, y2, distance, offset })
    })

    return {
        segments,
        distance: distance + offset
    } 


}