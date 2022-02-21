<svelte:options tag="vepple-pannellum" />

<script>
  import { onMount } from 'svelte'
  import './pannellum/js/pannellum.js'
  import './pannellum/js/libpannellum.js'
  import './pannellum/css/pannellum.css'
  /* import 'pannellum' */
  /* import 'pannellum/build/pannellum.css' */
  export let gql = {}
  let pano
  onMount(() => {
    console.log('mounted')
    const viewer = pannellum.viewer(pano, {
      type: 'equirectangular',
      panorama: gql.panorama.mediaItemUrl,
      preview: gql.panorama.sourceUrl
    })
  })
</script>

<div bind:this={pano} />
<p>Hello</p>

<style></style>
