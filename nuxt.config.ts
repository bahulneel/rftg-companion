import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

const ghPagesLegacyRedirect = `<script id="legacy-path-redirect">(function(){var p=location.pathname,j=p.match(/(.*)\\/join\\/([A-Z]{4})\\/?$/i);if(j){var h=new URLSearchParams(location.search).get("host");if(h){location.replace(j[1]+"/?join="+j[2].toUpperCase()+"&host="+encodeURIComponent(h));return}}var r=p.match(/(.*)\\/host\\/([A-Z]{4})\\/?$/i);if(r)location.replace(r[1]+"/?room="+r[2].toUpperCase());})();</script>`

function injectLegacyRedirect(html: string): string {
  if (html.includes('legacy-path-redirect')) return html
  return html.replace('<head>', `<head>${ghPagesLegacyRedirect}`)
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  /** Client source maps for production (GitHub Pages) — readable stack traces in DevTools. */
  sourcemap: { client: true },
  modules: ['@pinia/nuxt'],
  components: [
    '~/components',
    {
      path: '~/components/screens',
      pathPrefix: false,
    },
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      /** Origin for invite QR links (e.g. https://user.github.io). Falls back to window.location. */
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
    },
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'RFTG Companion',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Digital companion for Race for the Galaxy — phase selection and VP tracking' },
        { name: 'theme-color', content: '#0a0e1a' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  hooks: {
    /** Redirect legacy /join/CODE and /host/CODE paths when GitHub Pages serves 404.html. */
    async 'nitro:build:public-assets'(nitro) {
      const path404 = join(nitro.options.output.publicDir, '404.html')
      try {
        const html404 = await readFile(path404, 'utf8')
        await writeFile(path404, injectLegacyRedirect(html404))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        const indexPath = join(nitro.options.output.publicDir, 'index.html')
        try {
          const indexHtml = await readFile(indexPath, 'utf8')
          await writeFile(path404, injectLegacyRedirect(indexHtml))
        } catch (indexError) {
          if ((indexError as NodeJS.ErrnoException).code !== 'ENOENT') throw indexError
        }
      }
    },
  },
})
