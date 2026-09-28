/**
 * Every docs page draws (Katerina, 28 September).
 *
 * The gate draws every story (R19), but never the docs pages, and a page is
 * MDX: a stray `{label}` in a sentence is run as code, and the page shows
 * Storybook's error screen instead. ErrorBoundary's page did that on main from
 * 19 September to 28 September, and nothing noticed. This opens each docs page
 * in Chromium and fails when one shows the error screen or draws nothing.
 *
 *   node scripts/docs-pages-draw.mjs                 the built storybook-static/
 *   node scripts/docs-pages-draw.mjs http://…:6008   a running Storybook
 *
 * A page's own examples may log errors on purpose (ErrorBoundary's catches a
 * crash to show itself), so console errors are not failures; the error screen is.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }

async function serve(dir) {
  if (!existsSync(join(dir, 'index.json'))) throw new Error(`${dir}/index.json is missing: run \`npm run build-storybook\` first`)
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '')
    let file = join(dir, path)
    if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) file = join(dir, 'index.html')
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }
}

const given = process.argv[2]
const site = given ? { base: given.replace(/\/+$/, ''), close: () => {} } : await serve(join(process.cwd(), 'storybook-static'))
const index = await (await fetch(`${site.base}/index.json`)).json()
const pages = Object.values(index.entries).filter((e) => e.type === 'docs')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
const failed = []
for (const entry of pages) {
  const uncaught = []
  const onError = (e) => uncaught.push(String(e).split('\n')[0])
  page.on('pageerror', onError)
  await page.goto(`${site.base}/iframe.html?id=${entry.id}&viewMode=docs`, { waitUntil: 'load' })
  const outcome = await page
    .waitForFunction(
      () => {
        if (document.body.classList.contains('sb-show-errordisplay')) return 'error screen'
        const docs = document.querySelector('#storybook-docs')
        return docs && docs.innerText.trim().length > 40 ? 'drawn' : false
      },
      null,
      { timeout: 20_000 },
    )
    .then((h) => h.jsonValue())
    .catch(() => 'nothing drawn in 20s')
  page.off('pageerror', onError)
  if (outcome !== 'drawn') {
    const message = await page.evaluate(() => document.querySelector('#error-message, .sb-errordisplay')?.textContent?.trim().split('\n')[0] ?? '')
    failed.push(`${entry.title}: ${outcome}${message ? ` (${message.slice(0, 160)})` : ''}${uncaught.length ? ` [${uncaught[0].slice(0, 160)}]` : ''}`)
  }
}
await browser.close()
site.close()

console.log(`${pages.length} docs pages opened, ${pages.length - failed.length} drew.`)
if (failed.length) {
  for (const f of failed) console.error(`✗ ${f}`)
  process.exit(1)
}
