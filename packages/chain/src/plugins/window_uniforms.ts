import { ChainPlugin, ProgramsMapType, PluginCallProps } from "../chain";
type W2 = WebGL2RenderingContext

export class WindowUniformsPlugin implements ChainPlugin {

  private gl: W2;
  private u1: Map<WebGLProgram, WebGLUniformLocation>
  private u2: Map<WebGLProgram, WebGLUniformLocation>
  //private u3: WebGLUniformLocation
  private u4: Map<WebGLProgram, WebGLUniformLocation>
  private canvas: HTMLCanvasElement

  MOUSE_COORDS = {
    x: 0,
    y: 0,
    z: 0,
  }
  


  constructor(gl: W2) {
    this.gl = gl
    this.u1 = new Map()
    this.u2 = new Map()
    this.u4 = new Map()

    this.canvas = this.gl.canvas as HTMLCanvasElement
    
    window.addEventListener("mousemove", (e) => this.listenToMouseMove(e), false)
  }

  private listenToMouseMove = ( ev: MouseEvent)=> {
    const gl = this.gl
    const {top, bottom, left} =  (gl.canvas as HTMLCanvasElement).getBoundingClientRect()
    const height = bottom - top;
    const fromTop = ev.clientY - top;
    // this.MOUSE_COORDS.x = (left - ev.clientX) * devicePixelRatio
    // this.MOUSE_COORDS.y = (fromTop - height) * devicePixelRatio  
    
    //gl.uniform2fv(this.u3, [this.MOUSE_COORDS.x, this.MOUSE_COORDS.y]);
  }
  
  

  onInit(programs: ProgramsMapType){
    
    
    Object.values(programs).forEach(({program}) => {
      this.u1.set(program, this.gl.getUniformLocation(program, "uResolution")!)
      this.u2.set(program, this.gl.getUniformLocation(program, "uTime")!)
      this.u4.set(program, this.gl.getUniformLocation(program, "uResolutionInPx")!)
    })
    // this.u3 = gl.getUniformLocation(program, "uMouse")!;
    // gl.uniform2fv(this.u3, [this.MOUSE_COORDS.x, this.MOUSE_COORDS.y]);
    
  }

  beforeDrawCall({time, program}: PluginCallProps) {

      const loc1 = this.u1.get(program)!       
      loc1 && this.gl.uniform2fv(loc1, [this.gl.drawingBufferWidth, this.gl.drawingBufferHeight]);
    
      const loc2 = this.u2.get(program)!      
      loc2 && this.gl.uniform1f(loc2, time);    

      const loc4 = this.u4.get(program)!      
      loc4 && this.gl.uniform2fv(loc4, [this.canvas.clientWidth, this.canvas.clientHeight]);    
    
  }

  afterDrawCall(_: PluginCallProps){

  }

}