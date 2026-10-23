import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../mobile/assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Standard CRC32 table implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

/**
 * Generates an uncompressed/deflated RGBA PNG buffer with an AgriME brand graphic
 */
export function generateBrandPng(width, height, isSplash = false) {
  // 8-byte PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk (13 bytes)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);   // bit depth 8
  ihdrData.writeUInt8(6, 9);   // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10);  // compression method
  ihdrData.writeUInt8(0, 11);  // filter method
  ihdrData.writeUInt8(0, 12);  // interlace method
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // Generate pixels (Scanlines: filter byte 0 followed by width * 4 bytes RGBA)
  const scanlineLength = 1 + width * 4;
  const rawScanlines = Buffer.alloc(scanlineLength * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const logoRadius = Math.min(width, height) * 0.28;

  // Background color: #15803d (Forest Green)
  const bgR = 21, bgG = 128, bgB = 61, bgA = 255;
  // Accent gold: #eab308 (Harvest Gold)
  const goldR = 234, goldG = 179, goldB = 8;
  // Leaf green: #22c55e (Vibrant Emerald)
  const leafR = 34, leafG = 197, leafB = 94;
  // White: #ffffff
  const whiteR = 255, whiteG = 255, whiteB = 255;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawScanlines[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: #15803d
      let r = bgR, g = bgG, b = bgB, a = bgA;

      // Circular badge in center
      if (dist < logoRadius) {
        // Subtle badge background
        const t = dist / logoRadius;
        r = Math.round(18 + 10 * t);
        g = Math.round(105 + 23 * t);
        b = Math.round(50 + 11 * t);

        // Stylized Central Wheat & Leaf emblem
        // Central stalk: vertical line
        if (Math.abs(dx) < logoRadius * 0.08 && dy > -logoRadius * 0.7 && dy < logoRadius * 0.6) {
          r = goldR; g = goldG; b = goldB;
        }

        // Wheat grains (elliptical petals along stalk)
        for (let grainY = -0.5; grainY <= 0.3; grainY += 0.2) {
          const gy = grainY * logoRadius;
          const gDistLeft = Math.sqrt(Math.pow(dx + logoRadius * 0.22, 2) + Math.pow((dy - gy) * 1.5, 2));
          const gDistRight = Math.sqrt(Math.pow(dx - logoRadius * 0.22, 2) + Math.pow((dy - gy) * 1.5, 2));

          if (gDistLeft < logoRadius * 0.16 || gDistRight < logoRadius * 0.16) {
            r = goldR; g = goldG; b = goldB;
          }
        }

        // Arching vibrant green leaves at the base
        const leafArch = -Math.pow(dx / (logoRadius * 0.75), 2) * logoRadius * 0.6 + logoRadius * 0.35;
        if (Math.abs(dy - leafArch) < logoRadius * 0.15 && Math.abs(dx) < logoRadius * 0.65) {
          r = leafR; g = leafG; b = leafB;
        }
      }

      // Outer border ring for icon
      if (!isSplash && Math.abs(dist - logoRadius) < logoRadius * 0.05) {
        r = whiteR; g = whiteG; b = whiteB;
      }

      rawScanlines[pxOffset] = r;
      rawScanlines[pxOffset + 1] = g;
      rawScanlines[pxOffset + 2] = b;
      rawScanlines[pxOffset + 3] = a;
    }
  }

  // Deflate compressed IDAT chunk
  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND chunk (0 data bytes)
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

export function generateAllAssets() {
  console.log('🌱 Generating AgriME Mobile PNG Assets...');

  const iconBuffer = generateBrandPng(1024, 1024, false);
  const splashBuffer = generateBrandPng(1242, 2436, true);
  const adaptiveBuffer = generateBrandPng(1024, 1024, false);
  const faviconBuffer = generateBrandPng(48, 48, false);

  const iconPath = path.join(assetsDir, 'icon.png');
  const splashPath = path.join(assetsDir, 'splash.png');
  const adaptivePath = path.join(assetsDir, 'adaptive-icon.png');
  const faviconPath = path.join(assetsDir, 'favicon.png');

  fs.writeFileSync(iconPath, iconBuffer);
  fs.writeFileSync(splashPath, splashBuffer);
  fs.writeFileSync(adaptivePath, adaptiveBuffer);
  fs.writeFileSync(faviconPath, faviconBuffer);

  console.log(`✅ icon.png (${iconBuffer.length} bytes) -> ${iconPath}`);
  console.log(`✅ splash.png (${splashBuffer.length} bytes) -> ${splashPath}`);
  console.log(`✅ adaptive-icon.png (${adaptiveBuffer.length} bytes) -> ${adaptivePath}`);
  console.log(`✅ favicon.png (${faviconBuffer.length} bytes) -> ${faviconPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('generate-png-assets.mjs')) {
  generateAllAssets();
}
