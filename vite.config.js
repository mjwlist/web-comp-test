import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import postcssnested from 'postcss-nested'
import sveltePreprocess from 'svelte-preprocess'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: './src/main.js',
      name: 'VeppleEmbed'
    }
  },
  plugins: [
    svelte({
      compilerOptions: { customElement: true },
      preprocess: sveltePreprocess()
    })
  ],
  css: {
    postcss: {
      plugins: [postcssnested()]
    }
  }
})
