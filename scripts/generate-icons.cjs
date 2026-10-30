const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 calculation table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.slice(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, drawFn) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 per scanline
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a crisp medical calendar emblem with cyan & navy gradient
function drawAppIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Background gradient: Dark navy to rich deep blue
  let r = Math.round(11 + nx * 5);
  let g = Math.round(15 + ny * 20);
  let b = Math.round(25 + ny * 40);

  const cx = 0.5;
  const cy = 0.5;
  const dist = Math.hypot(nx - cx, ny - cy);

  // Center radial glow
  if (dist < 0.45) {
    const glow = 1 - dist / 0.45;
    g = Math.min(255, Math.round(g + glow * 25));
    b = Math.min(255, Math.round(b + glow * 60));
  }

  // Draw Calendar Card
  const scale = isMaskable ? 0.65 : 0.78;
  const cardLeft = 0.5 - scale * 0.42;
  const cardRight = 0.5 + scale * 0.42;
  const cardTop = 0.5 - scale * 0.40;
  const cardBottom = 0.5 + scale * 0.44;
  const cardHeader = cardTop + scale * 0.22;

  if (nx >= cardLeft && nx <= cardRight && ny >= cardTop && ny <= cardBottom) {
    // Header Bar (Cyan)
    if (ny <= cardHeader) {
      r = 6;
      g = 182;
      b = 212; // Cyan 500
    } else {
      // Body (Deep slate)
      r = 15;
      g = 23;
      b = 42; // Slate 900
      
      // Medical Cross in Center of Calendar Body
      const crossCx = 0.5;
      const crossCy = (cardHeader + cardBottom) / 2;
      const armW = scale * 0.08;
      const armLen = scale * 0.22;

      const inVert = Math.abs(nx - crossCx) < armW / 2 && Math.abs(ny - crossCy) < armLen / 2;
      const inHoriz = Math.abs(ny - crossCy) < armW / 2 && Math.abs(nx - crossCx) < armLen / 2;

      if (inVert || inHoriz) {
        r = 56;
        g = 189;
        b = 248; // Sky 400
      }
    }
  }

  // Card Ring Binders on Top
  const ringY = cardTop - scale * 0.05;
  const r1X = cardLeft + (cardRight - cardLeft) * 0.28;
  const r2X = cardLeft + (cardRight - cardLeft) * 0.72;
  const ringW = scale * 0.04;
  const ringH = scale * 0.12;

  if (
    (Math.abs(nx - r1X) < ringW && Math.abs(ny - ringY) < ringH) ||
    (Math.abs(nx - r2X) < ringW && Math.abs(ny - ringY) < ringH)
  ) {
    r = 241;
    g = 245;
    b = 249; // Slate 100
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve(__dirname, '../public');

// Generate 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
// Generate 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
// Generate Maskable 512x512 (with safe zone margin)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true)));
// Generate Apple Touch Icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

console.log('Successfully generated all PWA icons (192x192, 512x512, maskable, apple-touch-icon)!');
