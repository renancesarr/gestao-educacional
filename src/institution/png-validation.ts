import { inflateSync } from 'node:zlib';

export function isValidPng(bytes: Uint8Array): boolean {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 57 || signature.some((value, index) => bytes[index] !== value)) return false;
  let offset = 8;
  let sawHeader = false;
  let sawData = false;
  let sawEnd = false;
  const compressed: Uint8Array[] = [];
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    if (length > bytes.length - offset - 12) return false;
    const name = String.fromCharCode(bytes[offset + 4]!, bytes[offset + 5]!, bytes[offset + 6]!, bytes[offset + 7]!);
    const chunkEnd = offset + length + 12;
    const expectedCrc = readU32(bytes, offset + 8 + length);
    if (crc32(bytes.subarray(offset + 4, offset + 8 + length)) !== expectedCrc) return false;
    if (!sawHeader) {
      if (name !== 'IHDR' || length !== 13) return false;
      const width = readU32(bytes, offset + 8);
      const height = readU32(bytes, offset + 12);
      if (!width || !height || width > 10000 || height > 10000) return false;
      sawHeader = true;
    } else if (name === 'IHDR') return false;
    if (name === 'IDAT' && length > 0) {
      sawData = true;
      compressed.push(bytes.subarray(offset + 8, offset + 8 + length));
    }
    if (name === 'IEND') {
      if (length !== 0 || chunkEnd !== bytes.length) return false;
      sawEnd = true;
      break;
    }
    offset = chunkEnd;
  }
  if (!sawHeader || !sawData || !sawEnd) return false;
  try {
    const width = readU32(bytes, 16);
    const height = readU32(bytes, 20);
    const depth = bytes[24]!;
    const color = bytes[25]!;
    const interlace = bytes[28]!;
    const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[color];
    const depths = color === 0 ? [1, 2, 4, 8, 16] : color === 3 ? [1, 2, 4, 8] : [8, 16];
    if (!channels || !depths.includes(depth) || bytes[26] !== 0 || bytes[27] !== 0 || interlace > 1) return false;
    const passes = interlace === 0 ? [[0, 0, 1, 1]] : [
      [0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4],
      [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2],
    ];
    const scanlines: { rows: number; stride: number }[] = [];
    for (const [x, y, dx, dy] of passes) {
      const columns = Math.max(0, Math.ceil((width - x!) / dx!));
      const rows = Math.max(0, Math.ceil((height - y!) / dy!));
      if (columns && rows) scanlines.push({ rows, stride: 1 + Math.ceil(columns * channels * depth / 8) });
    }
    const expected = scanlines.reduce((size, pass) => size + pass.rows * pass.stride, 0);
    if (expected > 64 * 1024 * 1024) return false;
    // Validate both the zlib stream and the rows specified by IHDR/Adam7.
    const pixels = inflateSync(Buffer.concat(compressed), { maxOutputLength: expected });
    if (pixels.length !== expected) return false;
    let position = 0;
    for (const pass of scanlines) {
      for (let row = 0; row < pass.rows; row += 1) {
        if (pixels[position]! > 4) return false;
        position += pass.stride;
      }
    }
    return true;
  } catch { return false; }
}

function readU32(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! * 0x1000000 + (bytes[offset + 1]! << 16) + (bytes[offset + 2]! << 8) + bytes[offset + 3]!;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
