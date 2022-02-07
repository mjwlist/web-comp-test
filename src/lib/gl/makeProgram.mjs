import { Program } from 'ogl'

import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'

export default function makeProgram(gl, texture) {
  return new Program(gl, {
    cullFace: gl.FRONT,
    uniforms: {
      tex: {
        value: texture
      }
    },
    vertex: vertex,
    fragment: fragment
  })
}
