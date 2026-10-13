import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "apps/web/public");
const legacyMark =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="36" fill="#e8f8fb"/><g transform="translate(0 5)"><ellipse cx="80" cy="117" rx="69" ry="20" fill="#80d9ee"/><path d="M21 115c11-14 34-15 48-19 15-5 52 1 66 15 12 14-7 21-32 20-14 0-21-4-34-2-25 6-53 0-48-14Z" fill="white"/><path d="M31 111c5-18 30-28 49-28 24 0 44 13 48 30-21 12-41 3-54 5-19 4-33 2-43-7Z" fill="#ffe0a2"/><path d="M60 92c7-21 12-41 10-61l15 1c-2 27-9 49-16 61Z" fill="#ad7548"/><path d="M76 34C60 18 45 23 38 40c17-8 22-8 33-2C50 36 44 51 45 58c9-10 18-15 29-17 6 13 17 20 29 17-6-9-10-16-19-21 17-2 21 3 31 8-1-22-24-28-38-12Z" fill="#50b98a"/><circle cx="78" cy="40" r="7" fill="#be8046"/><path d="M36 68c-4-14-22-17-22-5 0 13 17 15 22 5Z" fill="#ff867d"/><path d="M101 18c0-13 14-20 18-11 5 10-3 20-18 11Z" fill="#ffc954"/><path d="M123 58c1-17 18-23 22-11 4 12-9 17-22 11Z" fill="#56b8ea"/><circle cx="66" cy="105" r="3.5" fill="#6f543c"/><circle cx="96" cy="105" r="3.5" fill="#6f543c"/><path d="M76 111q5 6 10 0" fill="none" stroke="#6f543c" stroke-width="3" stroke-linecap="round"/><ellipse cx="55" cy="110" rx="5" ry="3" fill="#f5b6a3"/><ellipse cx="106" cy="110" rx="5" ry="3" fill="#f5b6a3"/></g></svg>';
// I25: retain the original SVG above as history; current visible art is generated.
const uiArt = JSON.parse(await fs.readFile(path.join(root, "content/ui-art-v1/manifest.json"), "utf8"));
const brandOriginal = uiArt.assets.find(asset => asset.id === "brand-island");
if (!brandOriginal) throw Error('Generated brand original missing.');
// SVG rasterizers do not reliably decode embedded WebP. Keep the generated
// original and use a sufficiently large PNG for both PWA and OGP derivatives.
const brandBitmap = await sharp(await fs.readFile(path.join(root, brandOriginal.originalFile)))
  .trim({ threshold: 6 })
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png().toBuffer();
const mark = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="36" fill="#e8f8fb"/><image href="data:image/png;base64,' + brandBitmap.toString("base64") + '" x="20" y="16" width="120" height="128"/></svg>';
if (!legacyMark.startsWith('<svg')) throw Error('Retained brand source missing.');
await fs.mkdir(path.join(publicDir, "icons"), { recursive: true });
await fs.writeFile(path.join(publicDir, "brand.svg"), mark);
for (const size of [192, 512])
  await sharp(Buffer.from(mark))
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, `icons/icon-${size}.png`));
await sharp(Buffer.from(mark))
  .resize(384, 384)
  .flatten({ background: "#e8f8fb" })
  .extend({ top: 64, bottom: 64, left: 64, right: 64, background: "#e8f8fb" })
  .png()
  .toFile(path.join(publicDir, "icons/maskable-512.png"));
const canvas = createCanvas(1200, 630),
  ctx = canvas.getContext("2d");
ctx.fillStyle = "#eaf7fa";
ctx.fillRect(0, 0, 1200, 630);
ctx.fillStyle = "#d1edf3";
ctx.beginPath();
ctx.ellipse(600, 680, 830, 220, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#fffdf5";
ctx.beginPath();
ctx.roundRect(65, 55, 1070, 510, 54);
ctx.fill();
ctx.fillStyle = "#e8f8fb";
ctx.beginPath();
ctx.roundRect(110, 150, 280, 280, 63);
ctx.fill();
const island = await loadImage(brandBitmap);
ctx.drawImage(island, 145, 178, 210, 224);
ctx.fillStyle = "#e69b61";
ctx.font = 'bold 52px "Yu Gothic",sans-serif';
ctx.fillText("キッズ塗り絵", 440, 205);
ctx.fillStyle = "#385f73";
ctx.font = 'bold 78px "Yu Gothic",sans-serif';
ctx.fillText("アイランド", 430, 310);
ctx.fillStyle = "#5e7b87";
ctx.font = '29px "Yu Gothic",sans-serif';
ctx.fillText("きみだけの色で、せかいをつくろう", 435, 385);
const colors = [
  "#f19586",
  "#f3bad0",
  "#f7ce77",
  "#a9cda0",
  "#8fcddd",
  "#baacd9",
];
colors.forEach((color, i) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(485 + i * 63, 455, 17, 0, Math.PI * 2);
  ctx.fill();
});
await fs.writeFile(path.join(publicDir, "ogp.png"), await canvas.encode("png"));
console.log("Brand SVG, PWA icons, and 1200 × 630 OGP generated.");
