attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix, projectionMatrix;

varying vec2 vUv;
void main(){
    vUv = vec2(1.0 - uv.s, uv.t);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}