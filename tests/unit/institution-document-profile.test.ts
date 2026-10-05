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
