import sharp from "sharp";
import { readFileSync } from "fs";

const svg = readFileSync(new URL("./icon-source.svg", import.meta.url));

const targets = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  await sharp(svg).resize(t.size, t.size).png().toFile(t.file);
  console.log("wrote", t.file);
}

// maskable icon needs safe-zone padding (content within the inner ~80%)
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#151815"/>
  <text x="256" y="295" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="190" font-weight="600" fill="#6bae97">B</text>
</svg>`;
await sharp(Buffer.from(maskableSvg))
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-maskable-512.png");
console.log("wrote public/icons/icon-maskable-512.png");
