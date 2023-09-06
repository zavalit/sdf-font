// Type Definitions
type W2 = WebGL2RenderingContext;

// Imports
import {
    ChainPassPops, ChainDrawProps, ChainPlugin, DrawData,
    VAOBufferMap, BufferMap, UnirformLocationsMap, DrawCallProps
} from "./index.types";

// Exported Types
export type {
    ChainPassPops, ChainDrawProps, ChainPlugin, DrawData,
    VAOBufferMap, BufferMap
};
export * from './plugins'

export default (
  gl: WebGL2RenderingContext,
  callsProps: ChainPassPops[],
  plugins: ChainPlugin[] = []
): ChainDrawProps => {

  const vaoMap: VAOBufferMap = new Map()
    
  const calls = callsProps.map(({ vertexShader, fragmentShader, devicePixelRatio=2, ...props }, index:number) => {


    const passId = props.passId || `${index}`
     
    const [width, height] = props.resolution || [gl.drawingBufferWidth, gl.drawingBufferHeight]
    
    const program = createProgramm(gl, {vertexShader, fragmentShader})
  

    // provide attributes and uniforms
    const vao = props.vertexArrayObject 
    ? props.vertexArrayObject(gl, vaoMap) 
    : addDefaultVertexArrayObject (gl)    
   
   
    gl.useProgram(program);
  
  
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    
    const uniformLocations: UnirformLocationsMap = Array.from({ length: numUniforms }).reduce((acc:UnirformLocationsMap, _, i) => {
        const uniformInfo = gl.getActiveUniform(program, i);
        const location = uniformInfo && gl.getUniformLocation(program, uniformInfo.name);
        if (uniformInfo && location) {
            acc[uniformInfo.name] = location;
        }
        return acc;
    }, {});

    
    
    // Textures
    const textures: any[] = []
    props.textures && props.textures.forEach((texture: (WebGLTexture | {(): WebGLTexture}), i: number) => {
      const name =  `uTexture${i}`
      const textureLocation = gl.getUniformLocation(program, name);
          
      textures.push({
        activate(){
          const tex = typeof texture === 'function' ? texture() : texture
          gl.uniform1i(textureLocation, i);  
          gl.activeTexture(gl.TEXTURE0 + i);  
          gl.bindTexture(gl.TEXTURE_2D, tex);
        },
        deactivate(){
          gl.activeTexture(gl.TEXTURE0 + i);  
          gl.bindTexture(gl.TEXTURE_2D, null);
        }
      })
      
    })

    const startFramebuffer = () => {
      const {framebuffer} = props
      if(!framebuffer) return

      if(framebuffer.length > 0 && (framebuffer[0]) instanceof WebGLFramebuffer) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer[0])
      }
    }

    const endFramebuffer = () => {
      const {framebuffer} = props
      if(!framebuffer) return

      if(framebuffer.length == 2 && framebuffer[1] === null) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      }
    }


    const beforeDrawCall = () => {
      
      startFramebuffer()
      
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.viewport(0, 0, width, height);
      
      textures.forEach(t => t.activate())      
      
      props.uniforms &&  props.uniforms(gl, uniformLocations)
    
      

      
    }

    const afterDrawCall = () => {

      gl.bindVertexArray(null)
      textures.forEach(t => t.deactivate())
      endFramebuffer()
    }

    
  
    const chainDrawCall = (time: number, drawCallCb?: (gl: W2, props: DrawCallProps) => void) => {


      beforeDrawCall()

      plugins.forEach(plugin => plugin.beforeDrawCall({passId, time, program}))

      const drawProps = {buffers: vaoMap.get(vao), uniformLocations};
      
      props.drawCall 
      ? props.drawCall(gl, drawProps)
      : drawCallCb
        ? drawCallCb(gl, drawProps)
        : drawDefaultCall(gl)

      
      // Call the function to start checking for the query result asynchronously
      plugins.forEach(plugin => plugin.afterDrawCall({passId, time, program}))
      

      afterDrawCall()

      
      
    };

   
    
    return {
      chainDrawCall,
      program: {passId, program}
    };
  });

  const chainDraw: ChainDrawProps = {
    programs: calls.reduce((acc, {chainDrawCall, program: {passId, program}}) => {
        return {...acc, [passId]: {
          chainDrawCall, program
        }}
    }, {}),
    renderFrame: function (time: number){

      
      calls.forEach((c) => {

        // Perform the draw call 
        c.chainDrawCall(time);         

      })      

    }
      
  }

  // init plugins
  plugins.forEach(p => p.onInit && p.onInit(chainDraw.programs))

  return chainDraw
}




function loadImage(url: string, callback: (i:HTMLImageElement) => void) {
  const image = new Image();
  image.src = url;
  image.onload = () => callback(image);
  return image;
}


export function createTexture(gl: W2, image: TexImageSource, parameterCb?: (gl: W2) => void): WebGLTexture {
  
  const texture = gl.createTexture();
  if(texture === null) {
    throw new Error('can not create texture')
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);


  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // overwrite with optional custom parameter
  parameterCb && parameterCb(gl)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  
  

  
  gl.bindTexture(gl.TEXTURE_2D, null)

  return  texture;

}

export const createFramebufferTexture = (gl:W2, { width, height} : {width: number, height: number}) => {
    // Create a framebuffer
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    // Create a texture to render to
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);


    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    
    // Attach the texture to the framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    // Check if the framebuffer is complete
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer is not complete');
    }
  
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null)
    return {
      framebuffer,
      texture
    }
}


export const createProgramm = (gl: W2, {vertexShader, fragmentShader}: {vertexShader: string, fragmentShader: string}): WebGLProgram => {
   // initiaize program and attach shaders
   const prog = gl.createProgram()!;

   const attachShader = (shaderType: number, shaderSource: string) => {
     const shader = gl.createShader(shaderType)!;
     gl.shaderSource(shader, shaderSource);
     gl.compileShader(shader);
     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`${shaderType}: ${gl.getShaderInfoLog(shader)}`);       
     }
     gl.attachShader(prog, shader);
   };
 
   attachShader(gl.VERTEX_SHADER, vertexShader);
   attachShader(gl.FRAGMENT_SHADER, fragmentShader);
   gl.linkProgram(prog);
   if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog)?.toString());
   }
   return prog
}


export const loadTexture = (gl: W2, url: string): Promise<WebGLTexture> => new Promise((res, _) => loadImage(url, image => res(createTexture(gl, image))));


export const loadSVGTexture = (gl: W2, svgString: string) => {
  const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
  return loadTexture(gl, svgDataUrl);
}

export const convertCanvasTexture = (gl: W2, canvas: HTMLCanvasElement,  parameterCb?: (gl: W2) => void) => {
  // TODO
  // check safari and eventauly fix with context.getImageData(0, 0, context.canvas.width, context.canvas.height);

  return createTexture(gl, canvas, parameterCb);
}





const addDefaultVertexArrayObject = (gl: W2): WebGLVertexArrayObject => {

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    // Create the buffer and load the tree vertices
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, 1,
      -1, -1,
      1, 1,
      1, -1
    ]), gl.STATIC_DRAW);

    // Set up the vertex attribute pointers
    const location = 0
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

    return vao;

}

const drawDefaultCall = (gl: W2) => {

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
}
