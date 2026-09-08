import { chromium } from 'playwright'
const BASE = 'http://localhost:6008/iframe.html?viewMode=story&id='
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const count = () => page.locator('[role="dialog"]').count()

for (const id of ['overlays-popover--from-a-trigger', 'overlays-popover--a-toolbar']) {
  await page.goto(BASE + id, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const trig = page.locator('#storybook-root button').first()
  console.log(`\n== ${id} (trigger "${(await trig.textContent()).trim()}") ==`)
  console.log('  start          :', await count())
  await trig.click(); await page.waitForTimeout(500)
  console.log('  after click 1  :', await count())
  await trig.click(); await page.waitForTimeout(500)
  console.log('  after click 2  :', await count())
  await trig.click(); await page.waitForTimeout(500)
  console.log('  after click 3  :', await count())
}
await browser.close()
