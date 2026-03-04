import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputSvg = 'src/app/icon.svg';
const publicDir = 'public';

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(inputSvg);

    // Generate 192x192
    await sharp(svgBuffer)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192x192.png'));
    console.log('Generated icon-192x192.png');

    // Generate 512x512
    await sharp(svgBuffer)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512x512.png'));
    console.log('Generated icon-512x512.png');

    // Generate apple-touch-icon (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
