<svelte:options tag="vepple-panorama" />

<script>
  import { onMount } from 'svelte'
  import Marzipano from 'marzipano'
  export let gql = {}

  let pano

  onMount(() => {
    const viewerOpts = {
      controls: {
        mouseViewMode: 'drag'
      }
    }
    const viewer = new Marzipano.Viewer(pano, viewerOpts)
    const source = Marzipano.ImageUrlSource.fromString(
      gql.panorama.mediaItemUrl
    )
    viewer.controls().enableMethodGroup('arrowKeys')
    // Create geometry.
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }])
    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(
      1024,
      (100 * Math.PI) / 180
    )
    const view = new Marzipano.RectilinearView({ yaw: Math.PI }, limiter)

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    })

    // Display scene.
    scene.switchTo()
  })
</script>

<div class="wrap">
  <div class="pano" bind:this={pano} />
</div>

<style>
  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  .wrap {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
  }

  .pano {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
