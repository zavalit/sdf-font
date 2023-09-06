type W2 = WebGL2RenderingContext
type UniformSignature = (gl:W2, program: WebGLProgram) => () => void

export type DrawData = {[key:string]: number[]}
export type UnirformLocationsMap =   {[key: string]: WebGLUniformLocation}

type FramebufferChainProp = [WebGLFramebuffer | null, null?]

export type BufferMap = {[key: string]: WebGLBuffer}
export type VAOBufferMap = Map<WebGLVertexArrayObject, BufferMap>;

export type DrawCallProps = {buffers?: BufferMap, uniformLocations: UnirformLocationsMap}

export type DrawCallSignature = (gl:W2, props: DrawCallProps) => void

export type ChainPassPops = {
  vertexShader: string;
  fragmentShader: string;
  resolution?: [number, number];
  passId?: string,
  
  devicePixelRatio?: number;
  textures?: WebGLTexture[]
  framebuffer?: FramebufferChainProp
  vertexArrayObject?: (gl:W2, vaoMap:VAOBufferMap) => WebGLVertexArrayObject
  uniforms?: UniformSignature
  
  drawCall?: DrawCallSignature
};

export type ProgramsMapType = {
  [name: string]: {
    program: WebGLProgram,
    chainDrawCall: (time: number, drawCall?: DrawCallSignature) => void
  }
}



export type PluginCallProps = {
  program: WebGLProgram
  passId: string,
  time: number
}
export interface ChainPlugin {
  onInit?: (props: ProgramsMapType) => void;
  beforeDrawCall: (props: PluginCallProps) => void;
  afterDrawCall: (props: PluginCallProps) => void;
}



export type ChainDrawProps = {
 
  renderFrame: (time: number) => void
  programs: ProgramsMapType
}

