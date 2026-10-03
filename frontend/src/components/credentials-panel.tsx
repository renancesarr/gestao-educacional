'use client';

import { useState } from 'react';
import { type Course } from '../lib/academic-api.ts';
import { type Person } from '../lib/academic-api.ts';
import { createCredential, deleteCredential, listCredentials, updateCredential, type Credential, type CredentialType } from '../lib/credential-api.ts';

export function CredentialsPanel({ tenantId, people, courses }: { tenantId: string; people: readonly Person[]; courses: readonly Course[] }) {
  const [records, setRecords] = useState<readonly Credential[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function act(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  return <section className="stack" aria-label="CRUD de credenciais acadêmicas">
    <div className="form-grid">
      <form className="stack" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
        void act(async () => { const value = await createCredential(tenantId, { studentId: String(data.get('studentId')),
          courseId: String(data.get('courseId')), type: String(data.get('type')) as CredentialType, issuedOn: String(data.get('issuedOn')) });
          setRecords(await listCredentials(tenantId)); form.reset(); setNotice(`Credencial emitida para ${value.holderName}. Link público: ${location.origin}/validar/${value.validationToken}`); }); }}>
        <h3>Emitir credencial demonstrativa</h3>
        {people.length ? <label>Aluno<select required name="studentId"><option value="">Selecione</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          : <label>ID do aluno<input required name="studentId" /></label>}
        {courses.length ? <label>Curso<select required name="courseId"><option value="">Selecione</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
          : <label>ID do curso<input required name="courseId" /></label>}
        <label>Tipo<select name="type"><option value="certificado">Certificado</option><option value="diploma">Diploma</option></select></label>
        <label>Data de emissão<input required name="issuedOn" type="date" /></label>
        <button className="primary" disabled={busy}>Emitir credencial</button>
        <p className="muted">Documento demonstrativo, sem validade oficial ou assinatura digital real.</p>
      </form>
      <div className="stack"><h3>Credenciais da instituição</h3>
        <button className="secondary" disabled={busy} onClick={() => void act(async () => setRecords(await listCredentials(tenantId)))}>Atualizar lista</button>
        <ul className="item-list">{records.map(item => <li key={item.id}>
          <form className="stack" aria-label={`Editar credencial ${item.holderName}`} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget);
            void act(async () => { await updateCredential(tenantId, item.id, { type: String(data.get('type')) as CredentialType,
              issuedOn: String(data.get('issuedOn')) }); setRecords(await listCredentials(tenantId)); setNotice('Credencial atualizada. O link anterior foi invalidado.'); }); }}>
            <strong>{item.holderName} · {item.type}</strong><span>{item.courseName} · {item.issuedOn}</span>
            <label>Tipo<select name="type" defaultValue={item.type}><option value="certificado">Certificado</option><option value="diploma">Diploma</option></select></label>
            <label>Data de emissão<input name="issuedOn" type="date" defaultValue={item.issuedOn} required /></label>
            <p className="muted">Hash: <code>{item.contentHash.slice(0, 16)}…</code></p>
            <div className="inline-actions"><button className="quiet" disabled={busy}>Salvar edição</button>
              <a className="quiet" href={`/validar/${encodeURIComponent(item.validationToken)}`} target="_blank" rel="noreferrer">Validar</a>
              <button className="quiet" type="button" disabled={busy} onClick={() => void act(async () => { await deleteCredential(tenantId, item.id);
                setRecords(await listCredentials(tenantId)); setNotice('Credencial excluída; o link público foi invalidado.'); })}>Excluir</button></div>
          </form>
        </li>)}</ul>
      </div>
    </div>
    <div aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</div>
  </section>;
}
