
type Point = {
  x: number
  y: number
  type?: string
}


function pointOnQuadraticBezier(x0, y0, cx, cy, x1, y1, t) : Point {
  const t2 = 1 - t;
  const x = t2 * t2 * x0 + 2 * t2 * t * cx + t * t * x1;
  const y = t2 * t2 * y0 + 2 * t2 * t * cy + t * t * y1;
  return { x, y };
}


class PointRange  {

  range: Point[] = []
  last: Point
  add(p: Point){
    this.range.push(p)
    this.last = p
  }

  
  toSegments(){
    const segemnts = []
    this.range.forEach((p, i) => {
      if(i==0) return
      const prev = this.range[i-1]
      const curr = p
     
      segemnts.push([prev.x, prev.y, curr.x, curr.y])
    })

    return segemnts

  }
}

export const segmentize = (cmds) => {


  const points = []
  
  const commands = cmds;//.slice(6)
  
  commands.forEach(cmd => {
    const {type, x, y, x1, y1} = cmd

    if(type == 'M') {
      points.push(new PointRange())
    }

    const range = points[points.length - 1]

    if(type == 'M' || type == 'L') {
      range.add({x, y})
      return
    }
    
    
    if(type == 'Q') {
    
      const startPoint = range.last // Starting point of the curve
      const controlPoint = { x: x1, y: y1 }; // Control point of the curve
      const endPoint = { x, y }; // End point of the curve

      
      const curveSegments = 10
      const step = 1/curveSegments;
      for(let t = step; t <= 1; t += step) {        
        const midPoint = pointOnQuadraticBezier(startPoint.x, startPoint.y, controlPoint.x, controlPoint.y, endPoint.x, endPoint.y, t);
        range.add(midPoint)
      }            
      
    }

    
  })

  const segemnts = []
  points.forEach((r, i) => {
    segemnts.push(r.toSegments().flat())
  })


  return segemnts.flat()


} 