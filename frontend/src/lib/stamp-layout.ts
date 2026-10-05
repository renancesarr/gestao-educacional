export type StampShape = 'square' | 'round';
export type StampTextLayout = { lines: string[]; fontSize: number; lineHeight: number; error: string | null };

/** Measurement is supplied by the renderer in the selected font, in SVG pixels. */
export function layoutStampText(text: string, shape: StampShape, measure: (line: string, size: number) => number): StampTextLayout {
  const invalid = (error: string): StampTextLayout => ({ lines: [], fontSize: 24, lineHeight: 32, error });
  if (!text.trim()) return invalid('Informe o texto do carimbo.');
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  // The round model keeps text inside an inscribed square, with room before its border.
  const space = shape === 'round' ? 240 : 336;
  for (let size = 24; size >= 16; size -= 1) {
    const lineHeight = size * 1.35;
    if (lines.length * lineHeight <= space && lines.every(line => measure(line, size) <= space)) {
      return { lines, fontSize: size, lineHeight, error: null };
    }
  }
  return invalid('Reduza o texto ou divida-o em menos linhas mais curtas.');
}
