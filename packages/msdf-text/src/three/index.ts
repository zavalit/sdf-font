import { MSDFText } from '..';
import {
  InstancedBufferGeometry,
  BufferAttribute,
  InstancedBufferAttribute,
  Texture,
  Vector2,
  Vector4,
  GLSL3,
  RawShaderMaterial,
  InstancedMesh,
} from 'three';

import glyphVertexShader from '../shaders/glyph.vertex.glsl';
import glyphFragmentShader from '../shaders/glyph.fragment.glsl';

const getInstancedGeometry = ({
  atlasMap,
  glyphData: { spaceDiffs, glyphPositions },
}) => {
  // instanced geometry
  // provide vericies data
  const vertices = new Float32Array([
    0,
    1,
    0, // First vertex
    0,
    0,
    0, // Second vertex
    1,
    1,
    0, // Third vertex
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
  ]);

  // Define the triangle geometry
  const geometry = new InstancedBufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(vertices, 3));

  const aGlyphStartData = glyphPositions.map((g) => g.slice(0, 2)).flat();
  geometry.setAttribute(
    'aGlyphStart',
    new InstancedBufferAttribute(new Float32Array(aGlyphStartData), 2)
  );

  const aGlyphSizeData = glyphPositions.map((g) => g.slice(2, 4)).flat();
  geometry.setAttribute(
    'aGlyphSize',
    new InstancedBufferAttribute(new Float32Array(aGlyphSizeData), 2)
  );

  const aGlyphOffset = glyphPositions.map((g) => g.slice(4, 6)).flat();
  geometry.setAttribute(
    'aGlyphOffset',
    new InstancedBufferAttribute(new Float32Array(aGlyphOffset), 2)
  );

  const aWordRowData = glyphPositions.map((g) => g.slice(6, 8)).flat();
  geometry.setAttribute(
    'aWordRow',
    new InstancedBufferAttribute(new Float32Array(aWordRowData), 2)
  );

  const aWordGlyph = glyphPositions.map((g) => g.slice(8, 10)).flat();
  geometry.setAttribute(
    'aWordGlyph',
    new InstancedBufferAttribute(new Float32Array(aWordGlyph), 2)
  );

  const aRowWord = glyphPositions.map((g) => g.slice(10, 12)).flat();
  geometry.setAttribute(
    'aRowWord',
    new InstancedBufferAttribute(new Float32Array(aRowWord), 2)
  );

  const aGlyphChannelData = glyphPositions.map((g) => g.slice(12, 13)).flat();
  geometry.setAttribute(
    'aGlyphChannel',
    new InstancedBufferAttribute(new Float32Array(aGlyphChannelData), 1)
  );

  const aAtlasBoundsData = new Float32Array(atlasMap.flat());
  geometry.setAttribute(
    'aAtlasBounds',
    new InstancedBufferAttribute(new Float32Array(aAtlasBoundsData), 4)
  );

  geometry.setAttribute(
    'aSpaceDiffs',
    new InstancedBufferAttribute(new Float32Array(spaceDiffs.flat()), 2)
  );

  return geometry;
};

const getUniforms = (shaderData, frameRes) => {
  const texture = new Texture(shaderData.atlasCanvas);
  texture.needsUpdate = true; // This is important for the texture to be updated with the canvas content
  const atlasRes = [
    shaderData.atlasCanvas.width,
    shaderData.atlasCanvas.height,
  ];

  const { glyphData, fontSize } = shaderData;
  const uniforms = {
    uAtlasResolution: { value: new Vector2(atlasRes[0], atlasRes[1]) },
    uFontLineHeight: { value: glyphData.fontLineHeight },
    uLineHeight: { value: glyphData.textLineHeight },
    uOriginLineHeight: { value: glyphData.originLineHeight },
    uBaseLine: { value: glyphData.base },
    uWordsCount: { value: glyphData.wordsCount },
    uRowsCount: { value: glyphData.rowsCount },
    uPadding: { value: new Vector4(...glyphData.padding) },
    uFontSize: { value: fontSize },

    // texture
    uTexture0: { value: texture },

    // canvas res
    uResolutionInPx: {
      value: new Vector2(...frameRes),
    },
  };

  return uniforms;
};

export type TextShaderProps = {
  vertexShader: string;
  fragmentShader: string;
  uniforms?: object;
};

function removeVersionDirective(shaderCode) {
  let lines = shaderCode.split('\n'); // Split the shader code into lines
  if (lines[0].startsWith('#version 300 es')) {
    lines = lines.slice(1); // Remove the first line if it's the version directive
  }
  return lines.join('\n'); // Rejoin the lines back into a single string
}

const defaultTextShaderProps: TextShaderProps = {
  vertexShader: removeVersionDirective(glyphVertexShader),
  fragmentShader: removeVersionDirective(glyphFragmentShader),
};

export default (
  mt: MSDFText,
  frameRes: [number, number],
  props?: Partial<TextShaderProps>
) => {
  const glyphCount = mt.shaderData.glyphData.glyphPositions.length;

  const { vertexShader, fragmentShader, uniforms } = {
    ...defaultTextShaderProps,
    ...props,
  };
  // Define the shaders
  const geometry = getInstancedGeometry(mt.shaderData);
  const baseUniforms = getUniforms(mt.shaderData, frameRes);
  const material = new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { ...baseUniforms, ...uniforms },
    glslVersion: GLSL3,
    transparent: true,
  });

  // Create the mesh and add it to the scene
  const glyphQuads = new InstancedMesh(geometry, material, glyphCount);
  return glyphQuads;
};
