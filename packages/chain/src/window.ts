import {ChainPassPops, MOUSE_COORDS} from '.'


type W2 = WebGL2RenderingContext

const specifyCanvasSize = (gl: W2, props: ChainPassPops) => {
  if (!props.canvasWidth || !props.canvasHeight) return
  const width = props.canvasWidth;
  const height = props.canvasHeight;
  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.width = width.toString();
  canvas.style.height = height.toString();
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
};




  
const listenToMouseMove = (gl: W2, ev: MouseEvent)=> {
  
  const {top, bottom, left} =  (gl.canvas as HTMLCanvasElement).getBoundingClientRect()
  const height = bottom - top;
  const fromTop = ev.clientY - top;
  MOUSE_COORDS.x = (left - ev.clientX) * devicePixelRatio
  MOUSE_COORDS.y = (fromTop - height) * devicePixelRatio
  
}



// listeners

export default (gl: W2) => ({
  resize: (props: ChainPassPops) => {window.addEventListener("resize", () => specifyCanvasSize(gl, props), false);},
  mousemove: () => window.addEventListener("mousemove", (e) => listenToMouseMove(gl, e), false)
  
})
