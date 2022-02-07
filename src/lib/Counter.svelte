<svelte:options tag="my-counter" />

<script>
  import 'pannellum'
  import 'pannellum/build/pannellum.css'
  import { onMount } from 'svelte'
  import './viewer.mjs'
  /* import Panorama from 'svelte-panorama-component' */
  /* import Panorama from './Panorama.svelte' */

  let viewer = null

  onMount(() => {
    /*   viewer = pannellum.viewer('panorama', { */
    /*     type: 'equirectangular', */
    /*     panorama: 'https://pannellum.org/images/alma.jpg' */
    /*   }) */
    /*   console.log(pannellum) */
  })

  let count = 0
  const increment = () => {
    count += 1
  }
</script>

<svelte-panorama
  src="https://staging-api.production.rvhosted.com/wp-content/uploads/2021/03/students-in-boots-library-1920x1018.jpg"
  alt="Pretty Sky"
/>

<style>
  /* :root { */
  /*   --color: ; */
  /* } */

  .wrapper {
    height: 300px;
  }

  button {
    /* --color: green; */
    font-family: inherit;
    font-size: inherit;
    padding: 1em 2em;
    color: #ff3e00;
    background-color: var(--color, red);
    border-radius: 2em;
    border: 2px solid rgba(255, 62, 0, 0);
    outline: none;
    width: 200px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  button:focus {
    border: 2px solid #ff3e00;
  }

  button:active {
    background-color: rgba(255, 62, 0, 0.2);
  }
  #panorama {
    width: 600px;
    height: 400px;
  }
</style>
