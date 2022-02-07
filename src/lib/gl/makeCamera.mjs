import { Camera } from "ogl";

export default function makeCamera(gl, fov, width, height) {
    const camera = new Camera(gl, {
        fov: fov,
        aspect: width / height,
    });
    camera.position.set(0, 0, 1);
    return camera;
}