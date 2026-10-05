'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createRegulatoryAct, deleteRegulatoryAct, listRegulatoryActs, updateRegulatoryAct,
  type RegulatoryAct, type RegulatoryActStatus, type RegulatoryActTarget } from '../lib/regulatory-acts-api.ts';
import { listCourses, type Course } from '../lib/academic-api.ts';

const statusOptions: readonly { value: RegulatoryActStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' }, { value: 'vencido', label: 'Vencido' },
  { value: 'suspenso', label: 'Suspenso' }, { value: 'revogado', label: 'Revogado' },
];

export function RegulatoryActsPanel({ tenantId }: { readonly tenantId: string }) {
  const [target, setTarget] = useState<RegulatoryActTarget>('institution');
  const [courses, setCourses] = useState<readonly Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [acts, setActs] = useState<readonly RegulatoryAct[]>([]);
  const [editing, setEditing] = useState<RegulatoryAct | null>(null);
  const [preserve, setPreserve] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { void listCourses(tenantId).then(values => { setCourses(values); setCourseId(values[0]?.id ?? ''); })
    .catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível consultar os cursos.')); }, [tenantId]);

  async function perform(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }

  async function refresh() {
    const filter = { target, ...(target === 'course' && courseId ? { courseId } : {}) };
    setActs(await listRegulatoryActs(tenantId, filter));
  }

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await perform(async () => {
      await createRegulatoryAct(tenantId, { target,
        ...(target === 'course' ? { courseId } : {}), text: String(data.get('text') ?? ''),
        status: String(data.get('status')) as RegulatoryActStatus });
      form.reset();
      setNotice('Ato cadastrado.');
      await refresh();
    });
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || preserve === '') return;
    const data = new FormData(event.currentTarget);
    await perform(async () => {
      const updated = await updateRegulatoryAct(tenantId, editing.id, {
        text: String(data.get('editText') ?? ''), status: String(data.get('editStatus')) as RegulatoryActStatus,
        preservePreviousVersion: preserve === 'true',
      });
      setEditing(null); setPreserve(''); setNotice('Ato atualizado.');
      setActs(current => current.map(act => act.id === updated.id ? updated : act));
    });
  }

  return <section className="stack" aria-label="Atos regulatórios">
    <div className="form-grid">
      <form className="stack" onSubmit={event => void submitNew(event)}>
        <h3>Cadastrar ato</h3>
        <label>Vincular ato a<select name="target" value={target} onChange={event => {
          setTarget(event.target.value as RegulatoryActTarget); setActs([]); setEditing(null);
        }}><option value="institution">Instituição</option><option value="course">Curso</option></select></label>
        {target === 'course' && <label>Curso<select name="courseId" value={courseId} onChange={event => { setCourseId(event.target.value); setActs([]); }} required>
          <option value="">Selecione um curso</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}
        </select></label>}
        <label>Texto do ato<textarea name="text" required rows={5} /></label>
        <label>Status<select name="status" required defaultValue="ativo">{statusOptions.map(option =>
          <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <button className="primary" disabled={busy || (target === 'course' && !courseId)}>Cadastrar ato</button>
      </form>

      <div className="stack">
        <h3>Atos cadastrados</h3>
        <button className="secondary" disabled={busy || (target === 'course' && !courseId)}
          onClick={() => void perform(refresh)}>Atualizar lista de atos</button>
        {acts.length === 0 && <p className="muted">Nenhum ato carregado para esta seleção.</p>}
        {acts.map(act => <article className="card stack" key={act.id} aria-label={`Ato ${act.id}`}>
          <p><strong>{act.target === 'institution' ? 'Ato da instituição' : 'Ato do curso'}</strong> · {act.id}</p>
          <div className="stack">{act.versions.map(version => <div key={version.id}>
            <p><strong>Versão {version.number}{version.id === act.currentVersionId ? ' · atual' : ' · preservada'}</strong></p>
            <p>{version.text}</p><p>Status: {statusOptions.find(option => option.value === version.status)?.label ?? version.status}</p>
          </div>)}</div>
          {editing?.id === act.id ? <form className="stack" onSubmit={event => void submitEdit(event)}>
            <label>Texto do ato<textarea name="editText" required rows={5} defaultValue={act.text} /></label>
            <label>Status da versão atual<select name="editStatus" defaultValue={act.status}>{statusOptions.map(option =>
              <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <fieldset className="stack"><legend>Como salvar esta edição?</legend>
              <label><input type="radio" name="preservePreviousVersion" value="true" checked={preserve === 'true'}
                onChange={event => setPreserve(event.target.value)} required /> Preservar a versão anterior</label>
              <label><input type="radio" name="preservePreviousVersion" value="false" checked={preserve === 'false'}
                onChange={event => setPreserve(event.target.value)} required /> Sobrescrever sem preservar esta versão</label>
            </fieldset>
            <div className="inline-actions"><button className="primary" disabled={busy || preserve === ''}>Salvar edição</button>
              <button type="button" className="secondary" onClick={() => { setEditing(null); setPreserve(''); }}>Cancelar</button></div>
          </form> : <div className="inline-actions"><button className="secondary" disabled={busy} onClick={() => {
            setEditing(act); setPreserve('');
          }}>Editar</button><button className="quiet" disabled={busy} onClick={() => void perform(async () => {
            await deleteRegulatoryAct(tenantId, act.id); setNotice('Ato excluído.'); await refresh();
          })}>Excluir</button></div>}
        </article>)}
      </div>
    </div>
    <div aria-live="polite">{error && <p role="alert" className="error">{error}</p>}{notice && <p role="status" className="notice">{notice}</p>}</div>
  </section>;
}
