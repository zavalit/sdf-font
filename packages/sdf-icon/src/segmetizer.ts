type Point = {
  x: number;
  y: number;
  type?: string;
};

function pointOnQuadraticBezier(x0, y0, cx, cy, x1, y1, t): Point {
  const t2 = 1 - t;
  const x = t2 * t2 * x0 + 2 * t2 * t * cx + t * t * x1;
  const y = t2 * t2 * y0 + 2 * t2 * t * cy + t * t * y1;
  return { x, y };
}

function pointOnCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, t) {
  // Calculate a point on a cubic Bezier curve at a given t value (0 <= t <= 1)
  const cx = 3 * (x1 - x0);
  const bx = 3 * (x2 - x1) - cx;
  const ax = x3 - x0 - cx - bx;

  const cy = 3 * (y1 - y0);
  const by = 3 * (y2 - y1) - cy;
  const ay = y3 - y0 - cy - by;

  const tSquared = t * t;
  const tCubed = tSquared * t;

  const x = ax * tCubed + bx * tSquared + cx * t + x0;
  const y = ay * tCubed + by * tSquared + cy * t + y0;

  return { x, y };
}

class PointRange {
  range: Point[] = [];
  last: Point;
  add(p: Point) {
    this.range.push(p);
    this.last = p;
  }

  closePath(startPoint) {
    // Check if the last point is different from the start point
    if (
      this.last &&
      (this.last.x !== startPoint.x || this.last.y !== startPoint.y)
    ) {
      this.add(startPoint); // Add the start point to close the path
    }
  }
  toSegments() {
    const segemnts = [];
    this.range.forEach((p, i) => {
      if (i == 0) return;
      const prev = this.range[i - 1];
      const curr = p;

      segemnts.push([prev.x, prev.y, curr.x, curr.y]);
    });

    return segemnts;
  }
}

export const segmentize = (cmds) => {
  const points = [];

  const commands = cmds; //.slice(6)
  let startPoint = null;

  commands.forEach((cmd, index) => {
    const { type, x, y, x1, y1, x2, y2 } = cmd;

    if (type == "M") {
      if (points.length > 0 && startPoint) {
        // Ensure the previous path is closed if needed
        const range = points[points.length - 1];
        range.closePath(startPoint);
      }
      startPoint = { x, y };
      points.push(new PointRange());
    }
    const range = points[points.length - 1];

    if (type == "M" || type == "L") {
      range.add({ x, y });
      return;
    }

    if (type == "Q") {
      const startPoint = range.last; // Starting point of the curve
      const controlPoint = { x: x1, y: y1 }; // Control point of the curve
      const endPoint = { x, y }; // End point of the curve

      const curveSegments = 10;
      const step = 1 / curveSegments;
      for (let t = step; t <= 1; t += step) {
        const midPoint = pointOnQuadraticBezier(
          startPoint.x,
          startPoint.y,
          controlPoint.x,
          controlPoint.y,
          endPoint.x,
          endPoint.y,
          t,
        );
        range.add(midPoint);
      }
      return;
    }

    if (type === "C") {
      const startPoint = range.last; // Starting point of the curve
      const controlPoint1 = { x: x1, y: y1 }; // First control point
      const controlPoint2 = { x: x2, y: y2 }; // Second control point
      const endPoint = { x, y }; // End point of the curve

      const curveSegments = 10;
      const step = 1 / curveSegments;
      for (let t = step; t <= 1; t += step) {
        const midPoint = pointOnCubicBezier(
          startPoint.x,
          startPoint.y,
          controlPoint1.x,
          controlPoint1.y,
          controlPoint2.x,
          controlPoint2.y,
          endPoint.x,
          endPoint.y,
          t,
        );
        range.add(midPoint);
      }
      return;
    }
    // Automatically close path if 'Z' command is found or it's the last command and path should close
    if (type === "Z" || (index === cmds.length - 1 && startPoint)) {
      range.closePath(startPoint);
    }
  });

  const segemnts = [];
  points.forEach((r, i) => {
    segemnts.push(r.toSegments().flat());
  });

  return segemnts.flat();
};
