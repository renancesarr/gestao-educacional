'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { searchPublicStudents, type PublicStudentSearchResult } from '../lib/public-student-search.ts';

export function PublicStudentSearch() {
  const [results, setResults] = useState<readonly PublicStudentSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{ cpf?: string; name?: string; birthMunicipality?: string; birthUf?: string; course?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function search(criteria: typeof filters, requestedPage: number) {
    setBusy(true); setError('');
    try {
      const result = await searchPublicStudents(criteria, { page: requestedPage, pageSize: 20 });
      setFilters(criteria); setPage(result.page); setTotal(result.total); setTotalPages(result.totalPages);
      setResults(result.students); setSearched(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a busca.'); }
    finally { setBusy(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const criteria = Object.fromEntries(['cpf', 'name', 'birthMunicipality', 'birthUf', 'course']
      .flatMap(key => { const value = String(data.get(key) ?? '').trim(); return value ? [[key, value]] : []; })) as typeof filters;
    void search(criteria, 1);
  }

  return <main className="workspace">
    <header className="topbar"><Link className="brand" href="/">Gestão Educacional</Link><Link href="/">Acesso da plataforma</Link></header>
    <div className="page-heading"><span className="eyebrow">CONSULTA PÚBLICA</span><h1>Buscar alunos</h1>
      <p>Pesquise por CPF, nome, município e UF de nascimento ou curso. Os resultados mostram apenas nome, curso e instituição.</p></div>
    <section className="card catalog-search">
      <form className="catalog-search-form" onSubmit={submit}>
        <label>CPF<input name="cpf" inputMode="numeric" /></label>
        <label>Nome<input name="name" /></label>
        <label>Município de nascimento<input name="birthMunicipality" /></label>
        <label>UF de nascimento<input name="birthUf" maxLength={2} /></label>
        <label>Curso<input name="course" /></label>
        <button className="primary" disabled={busy}>{busy ? 'Buscando…' : 'Buscar alunos'}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {searched && <p className="muted" role="status">{total} aluno(s) encontrado(s).</p>}
      {results.length > 0 && <ul className="item-list" aria-label="Resultados públicos">
        {results.map((result, index) => <li key={`${result.name}-${result.courseName}-${result.institutionName}-${index}`}>
          <span><strong>{result.name}</strong><small>{result.courseName} · {result.institutionName}</small></span>
        </li>)}
      </ul>}
      {searched && results.length === 0 && <p className="muted">Nenhum aluno encontrado.</p>}
      {totalPages > 1 && <div className="step-controls"><button className="secondary" disabled={busy || page <= 1}
        onClick={() => void search(filters, page - 1)}>Anterior</button><span>Página {page} de {totalPages}</span>
        <button className="secondary" disabled={busy || page >= totalPages} onClick={() => void search(filters, page + 1)}>Próxima</button></div>}
    </section>
  </main>;
}
