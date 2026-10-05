import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInstitutionImage } from '../../src/institution/document-profile.ts';

test('marca SVG não pode importar estilos remotos', () => {
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><style>@import "https://example.invalid/font.css";</style></svg>');
  assert.throws(() => validateInstitutionImage('logo', 'image/svg+xml', svg), { code: 'INVALID_INPUT' });
});

test('assinatura manuscrita recusa conteúdo que apenas declara ser PNG', () => {
  assert.throws(() => validateInstitutionImage('signature', 'image/png', new TextEncoder().encode('não é uma imagem PNG')),
    { code: 'INVALID_INPUT' });
});

test('marca SVG exige XML bem formado e mantém suporte à imagem válida', () => {
  for (const source of ['<svg>', '<svg xmlns="http://www.w3.org/2000/svg"><g></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><text>A & B</text></svg>']) {
    assert.throws(() => validateInstitutionImage('logo', 'image/svg+xml', new TextEncoder().encode(source)), { code: 'INVALID_INPUT' });
  }
  const valid = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><text>A &amp; B</text></svg>');
  assert.deepEqual(validateInstitutionImage('logo', 'image/svg+xml', valid).bytes, valid);
});

test('imagem PNG recusa fluxo comprimido inválido mesmo com CRC correto', () => {
  const corrupt = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQAnGNgAAAAAgABrTFhHQAAAABJRU5ErkJggg==', 'base64');
  assert.throws(() => validateInstitutionImage('signature', 'image/png', corrupt), { code: 'INVALID_INPUT' });
});

test('imagem PNG recusa pixels que não correspondem às dimensões declaradas', () => {
  const wrongHeight = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAAAAAC86un7AAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
  assert.throws(() => validateInstitutionImage('logo', 'image/png', wrongHeight), { code: 'INVALID_INPUT' });
});
