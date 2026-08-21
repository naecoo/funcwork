import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

// The interactive demo runs the real library source,
// which needs the bundled worker script injected.
const workerScript = JSON.stringify(
  readFileSync(fileURLToPath(new URL('../../dist/worker.iife.js', import.meta.url)), 'utf-8'),
)

export default defineConfig({
  base: '/funcwork/',
  lang: 'en-US',
  title: 'FuncWork',
  description: 'Run pure functions in Web Worker easily',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/funcwork/logo.svg' }]],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'FuncWork',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/guide/api' },
      { text: 'Live Demo', link: '/demo/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'API Reference', link: '/guide/api' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/naecoo/funcwork' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present naecoo',
    },
    outline: { level: [2, 3] },
  },

  vite: {
    resolve: {
      alias: {
        funcwork: fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
    define: {
      __WORKER_SCRIPT__: workerScript,
    },
  },
})
