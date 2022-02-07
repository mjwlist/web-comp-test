#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

uniform sampler2D tex;
varying vec2 vUv;

void main(){
    gl_FragColor = texture2D(tex, vUv);
}