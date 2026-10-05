import { createRequire } from 'node:module';
import { ApplicationError } from '../shared/errors.ts';

// Narrow boundary to the parser's public runtime API. Its upstream declaration
// file is incompatible with this project's strict TypeScript 6 configuration.
interface XmlParser {
  on(event: 'opentag', listener: (node: { local: string; uri: string }) => void): void;
  write(source: string): { close(): void };
}
const { SaxesParser } = createRequire(import.meta.url)('saxes') as {
  SaxesParser: new (options: { xmlns: true }) => XmlParser;
};

export function validateSvg(bytes: Uint8Array): void {
  let source: string;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new ApplicationError('INVALID_INPUT', 'O arquivo SVG deve conter texto UTF-8 válido.'); }
  const normalized = source.replace(/^\uFEFF/, '').trim();
  if (!/^<svg(?:\s|>)/i.test(normalized.replace(/^<\?xml[^>]*>\s*/i, '')) ||
      /<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|iframe|object|embed|image|audio|video)\b|\bon[a-z]+\s*=|\b(?:href|src)\s*=|url\s*\(|@import\b|javascript:/i.test(normalized)) {
    throw new ApplicationError('INVALID_INPUT', 'O SVG contém elementos ou referências não permitidos.');
  }
  try {
    const parser = new SaxesParser({ xmlns: true });
    let rootSeen = false;
    parser.on('opentag', node => {
      if (!rootSeen && (node.local !== 'svg' || node.uri !== 'http://www.w3.org/2000/svg')) throw new Error('Raiz SVG inválida.');
      rootSeen = true;
    });
    parser.write(normalized).close();
  } catch {
    throw new ApplicationError('INVALID_INPUT', 'O arquivo deve conter um documento SVG bem formado.');
  }
}
