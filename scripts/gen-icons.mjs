import sharp from "sharp";
import { readFileSync } from "fs";

const source = readFileSync(new URL("./icon-source-briefcase.png", import.meta.url));

const targets = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/apple-touch-icon.png", size: 180 },
  // full-bleed background + centered mark with generous padding already,
  // safe to reuse directly for maskable's inner-80% safe zone
  { file: "public/icons/icon-maskable-512.png", size: 512 },
];

for (const t of targets) {
  await sharp(source).resize(t.size, t.size).png().toFile(t.file);
  console.log("wrote", t.file);
}
