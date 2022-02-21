<svelte:options tag="vepple-embed" />

<script>
  import Panorama from './Panorama.svelte'
  import Pannellum from './Pannellum.svelte'
  export let post
  export let api

  async function getData() {
    const res = await fetch(`${api}/wp-json/rv/v1/settings`)
    const data = await res.json()

    if (res.ok) {
      return data.ctas[0]
    } else {
      throw new Error(data)
    }
  }

  async function getGql() {
    const res = await fetch(`${api}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
            query MyQuery($name: String!) {
              posts(where: {name: $name}) {
                  nodes {
                    slug
                    postContent {
                      panorama {
                        title(format: RAW)
                        mediaItemUrl
                        sourceUrl(size: MEDIUM_LARGE)
                      }
                      position {
                        horizontal
                        vertical
                      }
                    }
                  }
                }
            }
      `,
        variables: {
          name: post
        }
      })
    })

    const data = await res.json()
    console.log(data)

    if (res.ok) {
      return data.data.posts.nodes[0].postContent
    } else {
      throw new Error(data)
    }
  }

  const gql = getGql()

  const data = getData()
</script>

<!-->
  {#await gql then gql}
    <vepple-panorama {gql} />
  {/await}
  </!-->

<!-->
  {#await gql then gql}
    <vepple-pannellum {gql} />
  {/await}
  </!-->

{#await gql}
  <p>...waiting</p>
{:then gql}
  <div class="wrap" part="wrap">
    <iframe
      allowfullscreen
      style="border-style:none;"
      part="iframe"
      src={` https://mjwlist.github.io/web-comp-test/dist/ pannellum.htm#panorama=${gql.panorama.mediaItemUrl}&preview=${gql.panorama.sourceUrl}`}
    />
  </div>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

{#await data then data}
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
    box-sizing: border-box;
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
