import chain, {convertCanvasTexture} from '@webglify/chain'
import {TexturesType, TextureFormat} from '@webglify/sdf-texture/sdfTexture'
import iconVertexShader from './shaders/icon.vertex.glsl'
import iconFragmentShader from './shaders/icon.fragment.glsl'





const renderIcon = (canvas, textures: TexturesType) => {


  const gl = canvas.getContext('webgl2')

  const edgeTexture = convertCanvasTexture(gl, textures.textures[TextureFormat.EDGE])
  const distanceTexture = convertCanvasTexture(gl, textures.textures[TextureFormat.DISTANCE])

  const {renderFrame} = chain(gl, [
    {
      vertexShader: iconVertexShader,
      fragmentShader: iconFragmentShader,
      textures: [edgeTexture, distanceTexture]
    }
  ])

  renderFrame(0)

}


export default renderIcon