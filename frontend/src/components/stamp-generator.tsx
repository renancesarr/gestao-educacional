'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { StampPreview } from './stamp-preview.tsx';
import { downloadStampPng, downloadStampSvg } from '../lib/stamp-export.ts';
import { layoutStampText } from '../lib/stamp-layout.ts';
import { stampTextMeasurer } from '../lib/stamp-text-metrics.ts';

export function StampGenerator() {
  const [text, setText] = useState('');
  const [shape, setShape] = useState<'square' | 'round'>('square');
  const [color, setColor] = useState('#182a38');
  const [font, setFont] = useState('sans-serif');
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const layout = useMemo(() => layoutStampText(text, shape, text.trim() ? stampTextMeasurer(font) : () => 0), [text, shape, font]);
  async function downloadPng() {
    if (!svgRef.current || layout.error) return;
    setError(''); setExporting(true);
    try { await downloadStampPng(svgRef.current); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível exportar o carimbo.'); }
    finally { setExporting(false); }
  }
  return <main className="workspace">
    <header className="topbar"><Link className="brand" href="/">Gestão Educacional</Link></header>
    <div className="page-heading"><h1>Gerador de carimbos</h1><p>Crie a imagem do seu carimbo diretamente na aplicação.</p></div>
    <div className="setup-grid">
      <section className="card stack">
        <label>Texto do carimbo<textarea name="stampText" rows={5} value={text} aria-describedby="stamp-text-help" onChange={event => setText(event.target.value)} /></label>
        <p id="stamp-text-help" className="muted">Use quebras de linha para organizar o texto. A fonte se ajusta ao espaço disponível, sem cortar o conteúdo.</p>
        <label>Formato<select name="shape" value={shape} onChange={event => setShape(event.target.value as 'square' | 'round')}><option value="square">Quadrado</option><option value="round">Redondo</option></select></label>
        <label>Cor<input name="color" type="color" value={color} onInput={event => setColor(event.currentTarget.value)} /></label>
        <label>Fonte<select name="font" value={font} onChange={event => setFont(event.target.value)}><option value="sans-serif">Sem serifa</option><option value="serif">Com serifa</option><option value="monospace">Monoespaçada</option></select></label>
        <p aria-live="polite" className="muted">{layout.error}</p>
        <button className="primary" disabled={exporting || Boolean(layout.error)} onClick={() => void downloadPng()}>Baixar PNG</button>
        <button className="secondary" disabled={exporting || Boolean(layout.error)} onClick={() => { if (svgRef.current && !layout.error) downloadStampSvg(svgRef.current); }}>Baixar SVG</button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
      <section className="card"><h2>Prévia</h2><StampPreview svgRef={svgRef} layout={layout} shape={shape} color={color} font={font} /><p className="muted">Fundo transparente · PNG 400 × 400 pixels · SVG vetorial</p></section>
    </div>
  </main>;
}
