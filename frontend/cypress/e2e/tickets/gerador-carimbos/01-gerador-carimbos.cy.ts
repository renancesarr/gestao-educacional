/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Gerador de carimbos — ticket 01', () => {
  it('abre a ferramenta pela navegação e mostra o texto na prévia', () => {
    loginAsSuperAdmin();
    cy.contains('a', 'Gerador de carimbos').click();
    cy.contains('h1', 'Gerador de carimbos').should('be.visible');
    cy.get('textarea[name="stampText"]').clear().type('ESCOLA EXEMPLO\nSECRETARIA');
    cy.get('[role="img"][aria-label="Prévia do carimbo"]').should('contain.text', 'ESCOLA EXEMPLO')
      .and('contain.text', 'SECRETARIA');
  });
  it('aplica formato, cor e fonte escolhidos à prévia', () => {
    loginAsSuperAdmin();
    cy.contains('a', 'Gerador de carimbos').click();
    cy.get('textarea[name="stampText"]').type('REGISTROS ACADÊMICOS');
    cy.get('select[name="shape"]').select('round');
    cy.get('input[name="color"]').invoke('val', '#a02030').trigger('input').trigger('change');
    cy.get('select[name="font"]').select('monospace');
    cy.get('[aria-label="Prévia do carimbo"] circle').should('have.attr', 'stroke', '#a02030');
    cy.get('[aria-label="Prévia do carimbo"] text').should('have.attr', 'font-family', 'monospace')
      .and('have.attr', 'fill', '#a02030');
    cy.get('select[name="shape"]').select('square');
    cy.get('[aria-label="Prévia do carimbo"] rect').should('have.attr', 'stroke', '#a02030');
  });
  it('baixa SVG com a aparência escolhida e caracteres especiais literais', () => {
    loginAsSuperAdmin();
    cy.contains('a', 'Gerador de carimbos').click();
    cy.get('textarea[name="stampText"]').type('<script>oi</script> &\nSECRETARIA', { parseSpecialCharSequences: false });
    cy.get('input[name="color"]').invoke('val', '#a02030').trigger('input');
    cy.get('select[name="font"]').select('serif');
    cy.contains('button', 'Baixar SVG').click();
    cy.readFile('cypress/downloads/carimbo.svg').then(source => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml');
      expect(svg.querySelector('parsererror')).to.eq(null);
      expect(svg.documentElement.namespaceURI).to.eq('http://www.w3.org/2000/svg');
      expect(svg.querySelector('script')).to.eq(null);
      expect(svg.querySelector('text')?.textContent).to.eq('<script>oi</script> &SECRETARIA');
      expect(svg.querySelector('text')?.getAttribute('font-family')).to.eq('serif');
      expect(svg.querySelector('rect')?.getAttribute('stroke')).to.eq('#a02030');
    });
  });
  it('baixa PNG transparente com a mesma imagem da prévia', () => {
    loginAsSuperAdmin();
    cy.contains('a', 'Gerador de carimbos').click();
    cy.get('textarea[name="stampText"]').type('ESCOLA EXEMPLO\nSECRETARIA');
    cy.get('input[name="color"]').invoke('val', '#a02030').trigger('input');
    cy.get('select[name="shape"]').select('round');
    cy.get('select[name="font"]').select('monospace');
    cy.contains('button', 'Baixar PNG').click();
    cy.readFile('cypress/downloads/carimbo.png', 'base64').then(base64 => {
      expect(base64).to.match(/^iVBORw0KGgo/);
      cy.window().then(async win => {
        const image = new win.Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        expect([image.width, image.height]).to.deep.eq([400, 400]);
        const canvas = win.document.createElement('canvas');
        canvas.width = canvas.height = 400;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        expect(Array.from(context.getImageData(12, 200, 1, 1).data)).to.deep.eq([160, 32, 48, 255]);
        expect(context.getImageData(0, 0, 1, 1).data[3]).to.eq(0);
        const pixels = context.getImageData(0, 0, 400, 400).data;
        const preview = win.document.querySelector('[aria-label="Prévia do carimbo"]')!;
        const expected = new win.Image();
        expected.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new win.XMLSerializer().serializeToString(preview))}`;
        await expected.decode();
        context.clearRect(0, 0, 400, 400);
        context.drawImage(expected, 0, 0);
        const previewPixels = context.getImageData(0, 0, 400, 400).data;
        expect(Cypress.Buffer.from(new Uint8Array(pixels)).equals(Cypress.Buffer.from(new Uint8Array(previewPixels))), 'PNG corresponde à prévia').to.eq(true);
      });
    });
    cy.get('main').screenshot('gerador-carimbos-previa');
  });
  it('orienta e bloqueia texto vazio ou sem espaço legível, permitindo corrigir', () => {
    loginAsSuperAdmin();
    cy.contains('a', 'Gerador de carimbos').click();
    cy.contains('button', 'Baixar PNG').should('be.disabled');
    cy.contains('button', 'Baixar SVG').should('be.disabled');
    cy.get('textarea[name="stampText"]').type('   ');
    cy.contains('Informe o texto do carimbo.').should('be.visible');
    cy.get('textarea[name="stampText"]').clear().type('W'.repeat(80), { delay: 0 });
    cy.contains('Reduza o texto ou divida-o em menos linhas mais curtas.').should('be.visible');
    cy.contains('button', 'Baixar SVG').should('be.disabled');
    cy.get('textarea[name="stampText"]').clear().type(Array(25).fill('ESCOLA').join('\n'), { delay: 0 });
    cy.contains('button', 'Baixar PNG').should('be.disabled');
    cy.get('textarea[name="stampText"]').clear().type('ESCOLA\nSECRETARIA');
    cy.contains('button', 'Baixar PNG').should('be.enabled');
    cy.contains('button', 'Baixar SVG').should('be.enabled');
    cy.get('[aria-label="Prévia do carimbo"]').should('contain.text', 'SECRETARIA');
  });
});
