'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { getPlatformSession, type PlatformSession } from '../lib/platform-auth.ts';
import { applyInepSchoolImport, previewInepSchoolImport, searchInepSchools,
  type InepSchoolResult, type InepVersionSummary } from '../lib/public-catalog.ts';

const catalogSource = 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/catalogo-de-escolas/';

export function PublicCatalog() {
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<InepVersionSummary | null>(null);
  const [applied, setApplied] = useState<InepVersionSummary | null>(null);
  const [query, setQuery] = useState({ name: '', sourceId: '', municipality: '', state: '' });
  const [schools, setSchools] = useState<readonly InepSchoolResult[]>([]);

  useEffect(() => { getPlatformSession().then(setSession).catch(() => setSession(null)).finally(() => setLoading(false)); }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }

  async function prepareImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || file.size === 0) { setError('Selecione o CSV exportado do INEP.'); return; }
    const collectedAt = new Date(String(data.get('collectedAt'))).toISOString();
    await run(async () => {
      const result = await previewInepSchoolImport({ file, edition: String(data.get('edition')).trim(), collectedAt, sourceUrl: catalogSource });
      setPreview(result); setApplied(null);
      setNotice('Prévia pronta. Confira os registros e rejeições antes de aplicar.');
    });
  }

  async function applyImport() {
    if (!preview) return;
    await run(async () => {
      const result = await applyInepSchoolImport(preview.id);
      setApplied(result); setPreview(null);
      setNotice('Versão INEP aplicada. A edição anterior continua preservada.');
    });
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filters = Object.fromEntries(Object.entries(query).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
    await run(async () => setSchools(await searchInepSchools(filters)));
  }

  if (loading) return <main className="center"><p role="status">Verificando sessão…</p></main>;
  if (!session) return <main className="workspace"><section className="card"><h1>Acesso necessário</h1><p>Entre como `SUPER_ADMIN` para operar o catálogo público.</p><Link href="/">Voltar para o acesso da plataforma</Link></section></main>;

  return <main className="workspace">
    <header className="topbar"><Link className="brand" href="/">Gestão Educacional</Link><div><span>Operador · {session.username}</span><Link href="/">Configuração institucional</Link></div></header>
    <div className="page-heading"><span className="eyebrow">SUPER_ADMIN · REFERÊNCIA GLOBAL</span><h1>Catálogo de escolas do INEP</h1><p>Importe uma edição oficial, revise o resultado e aplique-a antes de usar os registros.</p></div>

    <section className="card catalog-card">
      <h2>Importar edição oficial</h2>
      <p className="muted">Baixe a exportação CSV no <a href={catalogSource} target="_blank" rel="noreferrer">Catálogo de Escolas do INEP</a>. A carga registra a fonte e a edição informadas pelo operador; ela não atesta cobertura nacional completa. O sistema guarda apenas código, nome, situação, localização resumida e etapas/modalidades compatíveis. Contatos e dados pessoais não são importados.</p>
      <form className="stack" onSubmit={event => void prepareImport(event)}>
        <div className="catalog-fields">
          <label>Edição publicada<input name="edition" required maxLength={100} placeholder="Ex.: Censo Escolar 2025" /></label>
          <label>Data e hora da coleta<input name="collectedAt" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} /></label>
          <label>Arquivo CSV oficial<input name="file" type="file" accept=".csv,text/csv" required /></label>
        </div>
        <button className="primary" disabled={busy}>{busy ? 'Lendo arquivo…' : 'Preparar prévia'}</button>
      </form>
      {preview && <section className="catalog-preview" aria-labelledby="preview-heading">
        <h3 id="preview-heading">Revisão antes da aplicação</h3>
        <dl className="catalog-counts"><div><dt>Fonte e edição</dt><dd><a href={preview.sourceUrl} target="_blank" rel="noreferrer">{preview.source}</a> · {preview.edition}</dd></div><div><dt>Coletada em</dt><dd>{new Date(preview.collectedAt).toLocaleString('pt-BR')}</dd></div><div><dt>Registros válidos</dt><dd>{preview.validCount}</dd></div><div><dt>Rejeitados</dt><dd>{preview.rejectedCount}</dd></div><div><dt>Conflitos</dt><dd>{preview.conflictCount}</dd></div><div><dt>Resultado</dt><dd>{preview.completeness === 'COMPLETE' ? 'Completo' : 'Parcial'}</dd></div></dl>
        {preview.rejected.length > 0 && <div><h4>Rejeições para revisão</h4><ul className="item-list">{preview.rejected.map((item, index) => <li key={`${item.sourceId ?? 'linha'}-${index}`}><span>{item.sourceId ?? 'Sem código'}</span><small>{item.reason}</small></li>)}</ul>{preview.rejectionsTruncated && <p className="muted">A lista está limitada a 100 rejeições; todas foram registradas na versão.</p>}</div>}
        <button className="primary" disabled={busy} onClick={() => void applyImport()}>Aplicar esta versão</button>
      </section>}
      {applied && <p className="notice" role="status">Versão aplicada: {applied.edition} · {applied.validCount} escolas.</p>}
      <Feedback error={error} notice={notice} />
    </section>

    <section className="card catalog-search">
      <h2>Consultar versão vigente</h2><p className="muted">Pesquise por nome, município e UF, ou combine os filtros. A lista mostra até 100 resultados.</p>
      <form className="catalog-search-form" onSubmit={event => void search(event)}><label>Nome da escola<input name="name" value={query.name} onChange={event => setQuery(current => ({ ...current, name: event.target.value }))} /></label><label>Código INEP<input name="sourceId" value={query.sourceId} onChange={event => setQuery(current => ({ ...current, sourceId: event.target.value }))} /></label><label>Município<input name="municipality" value={query.municipality} onChange={event => setQuery(current => ({ ...current, municipality: event.target.value }))} /></label><label>UF<input name="state" value={query.state} maxLength={2} onChange={event => setQuery(current => ({ ...current, state: event.target.value.toUpperCase() }))} /></label><button className="secondary" disabled={busy}>Pesquisar</button></form>
      {schools.length > 0 && <ul className="item-list catalog-results">{schools.map(school => <li key={`${school.versionId}-${school.sourceId}`}><span><strong>{school.name}</strong><small>Código INEP: {school.sourceId}{school.state?.code ? ` · ${school.state.code}` : ''}{school.municipality?.label ? ` · ${school.municipality.label}` : ''}</small><small>{school.educationalOffers.map(offer => `${offer.stageLabel}${offer.modalityLabel ? ` · ${offer.modalityLabel}` : ''}`).join(' | ') || 'Etapa/modalidade não informada'}</small></span></li>)}</ul>}
      {schools.length === 0 && Object.values(query).some(value => value.length >= 2) && !busy && <p className="muted">Nenhuma escola encontrada com esses filtros.</p>}
    </section>

  </main>;
}

function Feedback({ error, notice }: { error: string; notice: string }) {
  return <div aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</div>;
}
