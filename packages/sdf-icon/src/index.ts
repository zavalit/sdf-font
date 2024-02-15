import chain, { VAOBufferMap, createFramebufferTexture } from "@webglify/chain";
import iconSegmentsVertex from "./shaders/icon/icon.segments.vertex.glsl";
import iconSegmentsFragment from "./shaders/icon/icon.segments.fragment.glsl";
import groupVertexShader from "./shaders/icon/icon.group.vertex.glsl";
import groupFragmentShader from "./shaders/icon/icon.group.fragment.glsl";
import { segmentize } from "./segmetizer";

type W2 = WebGL2RenderingContext;

const vertexArrayObject = (
  gl: W2,
  vao: WebGLVertexArrayObject,
  vaoMap: VAOBufferMap,
) => {
  const pb = gl.createBuffer()!;
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
  }

  const sb = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, sb);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 4 * 4, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribDivisor(1, 1);

  vaoMap.set(vao, {
    position: pb,
    segments: sb,
  });

  return vao;
};

type RenderOptions = {
  sdfExponent: number;
  padding: number;
  scale: number;
};

const defaultRenderOptions: RenderOptions = {
  sdfExponent: 10,
  padding: 50,
  scale: 10,
};

// Function to parse the d attribute of a path into an array of command objects
function parsePathCommands(d, scale) {
  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  return commands.map((command) => {
    const type = command.charAt(0);
    let args = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const cmd: any = { type };
    if (args.length) {
      args = args.map((a) => a * scale);
      switch (type.toUpperCase()) {
        case "M":
        case "L":
          [cmd.x, cmd.y] = args;
          break;
        case "C":
          [cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y] = args;
          break;
        case "H":
          cmd.x = args[0]; // Only x coordinate for horizontal line
          break;
        case "V":
          cmd.y = args[0]; // Only y coordinate for vertical line
          break;
        // Add cases for other command types as needed
      }
    }
    return cmd;
  });
}

function transformVHtoL(commands) {
  let lastX = 0,
    lastY = 0; // Track the last x and y coordinates
  const transformedCommands = commands.map((cmd) => {
    const { type, x, y } = cmd;
    switch (type) {
      case "M": // Move command sets the starting point
        lastX = x;
        lastY = y;
        return cmd; // 'M' commands remain unchanged
      case "L": // Line command updates the last known x and y coordinates
        lastX = x;
        lastY = y;
        return cmd; // 'L' commands remain unchanged
      case "H": // Horizontal line command
        lastX = x; // Update lastX to the new x value
        return { type: "L", x, y: lastY }; // Transform to 'L' with lastY
      case "V": // Vertical line command
        lastY = y; // Update lastY to the new y value
        return { type: "L", x: lastX, y }; // Transform to 'L' with lastX
      // Add handling for other command types as needed
      default:
        return cmd; // Return the command unchanged if it's not 'H' or 'V'
    }
  });
  return transformedCommands;
}

const pathToAttributes = (path, { scale, padding }: RenderOptions) => {
  const commands = parsePathCommands(path, scale);
  const tCommands = transformVHtoL(commands);

  // Assuming commands is an array of path commands
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  tCommands.forEach((cmd) => {
    switch (cmd.type) {
      case "M":
      case "L":
        minX = Math.min(minX, cmd.x);
        minY = Math.min(minY, cmd.y);
        maxX = Math.max(maxX, cmd.x);
        maxY = Math.max(maxY, cmd.y);
        break;
      case "C":
        minX = Math.min(minX, cmd.x, cmd.x1, cmd.x2);
        minY = Math.min(minY, cmd.y, cmd.y1, cmd.y2);
        maxX = Math.max(maxX, cmd.x, cmd.x1, cmd.x2);
        maxY = Math.max(maxY, cmd.y, cmd.y1, cmd.y2);
        break;
    }
  });

  const width = maxX - minX;
  const height = maxY - minY;

  const segments = segmentize(tCommands);

  const bounds = [minX, minY, maxX, maxY];
  const res = [width + padding, height + padding];

  return {
    data: { segments, bounds },
    res,
  };
};

export const renderSVGPathToCanvas = async (
  path: string,
  inputOptions?: Partial<RenderOptions>,
): Promise<HTMLCanvasElement> => {
  const options = { ...defaultRenderOptions, ...inputOptions };

  const { data, res } = pathToAttributes(path, options);

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false })!;

  const [width, height] = res;

  const canvasWidth = width;
  const canvasHeight = height;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // render a gpyph sprite
  const segmentsFBO = createFramebufferTexture(gl, [width, height]);

  const { programs } = chain(gl, [
    // single sdf target
    {
      passId: "segments",
      framebuffer: [segmentsFBO.framebuffer, null],
      vertexShader: iconSegmentsVertex,
      fragmentShader: iconSegmentsFragment,
      vertexArrayObject,
      uniforms(gl, loc) {
        gl.uniform1f(loc.uExponent, options.sdfExponent);
        gl.uniform1f(loc.uUnitsPerEm, Math.max(width, height));
      },
    },
    //put together
    {
      passId: "atlas",
      vertexShader: groupVertexShader,
      fragmentShader: groupFragmentShader,
      textures: [segmentsFBO.texture!],
    },
  ]);

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // segments
  programs["segments"].chainDrawCall(
    { frame: 0, elapsedTime: 0 },
    (gl, props) => {
      const { buffers, uniformLocations } = props;
      if (!buffers) {
        throw new Error(
          `segments draw call pass lacks of buffer or payload data`,
        );
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.segments);
      const seg = new Float32Array(data.segments);
      gl.bufferData(gl.ARRAY_BUFFER, seg, gl.DYNAMIC_DRAW);

      gl.uniform4fv(uniformLocations.uGlyphBounds, data.bounds);
      gl.uniform2fv(uniformLocations.uItemResolution, [width, height]);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX);

      // render
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, data.segments.length / 4);
    },
  );

  programs["atlas"].chainDrawCall({ frame: 0, elapsedTime: 0 }, (gl) => {
    gl.bindTexture(gl.TEXTURE_2D, segmentsFBO.texture);

    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });

  return canvas;
};
