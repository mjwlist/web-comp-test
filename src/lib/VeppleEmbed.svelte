<svelte:options tag="vepple-embed" />

<script>
  async function getData() {
    const res = await fetch(
      ` https://staging-api.production.rvhosted.com/wp-json/rv/v1/settings `
    )
    const data = await res.json()

    if (res.ok) {
      return data.ctas[0]
    } else {
      throw new Error(data)
    }
  }

  let data = getData()
</script>

{#await data}
  <p>...waiting</p>
{:then data}
  <div class="wrap" part="wrap">
    <iframe
      height="100%"
      width="100%"
      allowfullscreen
      style="border-style:none;"
      part="iframe"
      src="https://cdn.pannellum.org/2.5/pannellum.htm#panorama=https://staging-api.production.rvhosted.com/wp-content/uploads/2021/10/2110021-cffee-rev-1-a-1.jpeg&amp;preview=https://staging-api.production.rvhosted.com/wp-content/uploads/2021/10/2110021-cffee-rev-1-a-1-768x384.jpeg&config=https://mjwlist.github.io/web-comp-test/dist/config.json"
    />
  </div>
  <div part="content">
    <a part="link" href={data.ctaUrl}>{data.ctaText}</a>
  </div>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

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

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
