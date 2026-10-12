// Wordmark logos (Hedera Council, Strategic Partners, Community Partners): white artwork on the dark map.
// Shared by render.js (desktop SVG) and build-html.js (mobile layout and popups).
import fs from "node:fs";
import path from "node:path";

// Logos that keep their own colors (already made for dark backgrounds)
export const NO_INVERT = new Set(["Repsol", "FedEx"]);

// Convert black SVG content to white by replacing fill values directly.
// This avoids relying on CSS filter: invert(1) which doesn't work in Safari on SVG <image> elements.
export function makeLogoWhite(svgContent) {
  svgContent = svgContent.replace(/fill="black"/g, 'fill="white"');
  svgContent = svgContent.replace(/fill="#000000"/g, 'fill="#ffffff"');
  svgContent = svgContent.replace(/fill="#000"/g, 'fill="#fff"');
  svgContent = svgContent.replace(/fill\s*:\s*black/g, 'fill:white');
  svgContent = svgContent.replace(/fill\s*:\s*#000000/g, 'fill:#ffffff');
  svgContent = svgContent.replace(/fill\s*:\s*#000([;\s}])/g, 'fill:#fff$1');
  // Set fill="white" on the root <svg> so paths without an explicit fill inherit white
  // (the SVG default fill is black, so paths without a fill attribute would otherwise be invisible)
  if (svgContent.match(/<svg[^>]*\sfill="none"/)) {
    svgContent = svgContent.replace(/(<svg[^>]*)\sfill="none"/, '$1 fill="white"');
  } else if (!svgContent.match(/<svg[^>]*\sfill="/)) {
    svgContent = svgContent.replace(/<svg/, '<svg fill="white"');
  }
  return svgContent;
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// Pixel size of a PNG (IHDR) or the viewBox / width+height of an SVG; null when unknown.
export function logoSize(file) {
  if (!file || !fs.existsSync(file)) return null;
  const ext = path.extname(file).toLowerCase();
  const buf = fs.readFileSync(file);
  if (ext === ".svg") {
    const s = buf.toString("utf8");
    const vb = s.match(/<svg\b[^>]*\bviewBox="([^"]+)"/);
    if (vb) { const p = vb[1].trim().split(/[\s,]+/).map(Number); if (p[2] > 0 && p[3] > 0) return { w: p[2], h: p[3] }; }
    const w = s.match(/<svg\b[^>]*\swidth="([\d.]+)/), h = s.match(/<svg\b[^>]*\sheight="([\d.]+)/);
    return w && h ? { w: +w[1], h: +h[1] } : null;
  }
  if (ext === ".png" && buf.length > 24 && buf.toString("ascii", 12, 16) === "IHDR") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  return null;
}

export const logoRatio = (file) => { const s = logoSize(file); return s ? s.w / s.h : null; };

// Data URI of a wordmark, white on the dark map:
//  - SVG: fills repainted white (unless the file is already the white version or the logo keeps its colors)
//  - raster named *black* / *dark*: wrapped in an SVG whose filter paints every visible pixel white
//    (a filter inside the image works in Safari, unlike a CSS filter on the <image> element)
//  - other rasters (the white versions hederacouncil.org publishes): as they are
export function wordmarkDataUri(file, entity) {
  if (!file || !fs.existsSync(file)) return null;
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();
  const buf = fs.readFileSync(file);
  if (ext === ".svg") {
    let svg = buf.toString("utf8");
    if (!NO_INVERT.has(entity) && !base.includes("white")) svg = makeLogoWhite(svg);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  const raster = `data:${MIME[ext] || "image/png"};base64,${buf.toString("base64")}`;
  if (!NO_INVERT.has(entity) && /black|dark/.test(base)) {
    const s = logoSize(file) ?? { w: 400, h: 100 };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${s.w} ${s.h}" width="${s.w}" height="${s.h}">`
      + `<filter id="w"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>`
      + `<image width="${s.w}" height="${s.h}" href="${raster}" xlink:href="${raster}" filter="url(#w)"/></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return raster;
}
