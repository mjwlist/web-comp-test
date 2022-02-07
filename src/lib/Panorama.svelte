<script>
  import { Renderer, Sphere, Orbit, Mesh } from 'ogl'
  import { loadTextureAsync, makeCamera, makeProgram } from './gl'
  import { onMount } from 'svelte'

  let className = ''
  export let alt = 'Panoramic View'
  export { className as class }
  export let fov = 30
  export let src

  let wrapper
  let canvas
  let raf

  onMount(() => {
    const loader = loadTextureAsync(src)
    const { clientWidth, clientHeight } = wrapper
    const renderer = new Renderer({
      canvas: canvas,
      width: clientWidth,
      height: clientHeight
    })

    const gl = renderer.gl
    gl.clearColor(1, 1, 1, 1)

    const sphere = new Sphere(gl, {
      radius: 1,
      widthSegments: 64
    })
    console.log(sphere)

    const camera = makeCamera(gl, fov, clientWidth, clientHeight)
    const controls = new Orbit(camera, {
      enablePan: false,
      enableZoom: true,
      //zoomStyle: 0,
      element: canvas,
      maxDistance: 1,
      minDistance: 0
    })

    const resizeObserver = new ResizeObserver((entries) =>
      entries.every(({ target: { clientWidth, clientHeight } }) => {
        renderer.setSize(clientWidth, clientHeight)
        camera.perspective({ aspect: clientWidth / clientHeight })
      })
    )
    resizeObserver.observe(wrapper)

    loader.then((loaded) => {
      const texture = loaded(gl)
      const program = makeProgram(gl, texture)
      const scene = new Mesh(gl, {
        geometry: sphere,
        program: program
      })

      function update() {
        controls.update()
        renderer.render({ scene: scene, camera: camera })
        raf = requestAnimationFrame(update)
      }

      raf = requestAnimationFrame(update)
    })

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.unobserve(wrapper)
      resizeObserver.disconnect()
    }
  })
</script>

<div aria-label={alt} class={className} bind:this={wrapper}>
  <canvas bind:this={canvas} />
</div>

<style>
  div {
    width: 100%;
    height: 100%;
  }
</style>
