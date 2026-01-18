import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const IN_SVG = path.join(ROOT, "dist", "hedera-map.svg");
const OUT_PNG = path.join(ROOT, "dist", "hedera-map.png");

async function main() {
  const svg = fs.readFileSync(IN_SVG, "utf8");
  const html = `<!doctype html>
  <html>
    <head><meta charset="utf-8"/></head>
    <body style="margin:0;background:#000000;">
      ${svg}
    </body>
  </html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(html, { waitUntil: "load" });

  // Screenshot the SVG area
  await page.screenshot({ path: OUT_PNG, fullPage: true });
  await browser.close();

  console.log(`Wrote ${OUT_PNG}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
