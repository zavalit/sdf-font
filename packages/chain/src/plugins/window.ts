import { ChainPlugin, ProgramsMapType, PluginCallProps } from "../index.types";
type W2 = WebGL2RenderingContext

export class WindowPlugin implements ChainPlugin {

  private gl: W2;
  private u1: Map<WebGLProgram, WebGLUniformLocation>
  private u2: Map<WebGLProgram, WebGLUniformLocation>
 // private u3: WebGLUniformLocation
 // private u4: WebGLUniformLocation

  MOUSE_COORDS = {
    x: 0,
    y: 0,
    z: 0,
  }
  


  constructor(gl: W2) {
    this.gl = gl
    this.u1 = new Map()
    this.u2 = new Map()
    

    window.addEventListener("mousemove", (e) => this.listenToMouseMove(e), false)
  }

  private listenToMouseMove = ( ev: MouseEvent)=> {
    const gl = this.gl
    const {top, bottom, left} =  (gl.canvas as HTMLCanvasElement).getBoundingClientRect()
    const height = bottom - top;
    const fromTop = ev.clientY - top;
    this.MOUSE_COORDS.x = (left - ev.clientX) * devicePixelRatio
    this.MOUSE_COORDS.y = (fromTop - height) * devicePixelRatio  
    
    //gl.uniform2fv(this.u3, [this.MOUSE_COORDS.x, this.MOUSE_COORDS.y]);
  }
  
  

  onInit(programs: ProgramsMapType){
    
    
    Object.values(programs).forEach(({program}) => {
      this.u1.set(program, this.gl.getUniformLocation(program, "uResolution")!)
      this.u2.set(program, this.gl.getUniformLocation(program, "uTime")!)
    })

    
    // this.u1 = gl.getUniformLocation(program, "uResolution")!;
    // gl.uniform2fv(this.u1, [gl.drawingBufferWidth, gl.drawingBufferHeight]);
    // this.u2 = gl.getUniformLocation(program, "uTime")!;
    // this.u3 = gl.getUniformLocation(program, "uMouse")!;
    // gl.uniform2fv(this.u3, [this.MOUSE_COORDS.x, this.MOUSE_COORDS.y]);
    // this.u4 = gl.getUniformLocation(program, "uDpr")!;
    // gl.uniform1f(this.u4, devicePixelRatio);
  }

  beforeDrawCall({time, program}: PluginCallProps) {

      const loc1 = this.u1.get(program)!       
      loc1 && this.gl.uniform2fv(loc1, [this.gl.drawingBufferWidth, this.gl.drawingBufferHeight]);
    
      const loc2 = this.u2.get(program)!      
      loc2 && this.gl.uniform1f(loc2, time);    
    
    
  
  }

  afterDrawCall(props: PluginCallProps){

  }

}