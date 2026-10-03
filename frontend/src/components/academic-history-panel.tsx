'use client';

import { useState, type FormEvent } from 'react';
import type { Person } from '../lib/academic-api.ts';
import { createAcademicHistory, deleteAcademicHistory, listAcademicHistories, updateAcademicHistory,
  type AcademicHistory, type AcademicHistoryInput } from '../lib/academic-history-api.ts';

function formValues(data: FormData, studentId?: string): AcademicHistoryInput {
  const gradeOrConcept = String(data.get('gradeOrConcept') ?? '').trim();
  const absences = String(data.get('absenceCount') ?? '').trim();
  const notes = String(data.get('notes') ?? '').trim();
  return { ...(studentId ? { studentId } : { studentId: String(data.get('studentId')) }),
    sourceInstitution: String(data.get('sourceInstitution')), courseName: String(data.get('courseName')),
    academicYear: Number(data.get('academicYear')), period: String(data.get('period')), subjectName: String(data.get('subjectName')),
    workloadHours: Number(data.get('workloadHours')), result: String(data.get('result')),
    gradeOrConcept: gradeOrConcept || null, absenceCount: absences ? Number(absences) : null, notes: notes || null };
}

export function AcademicHistoryPanel({ tenantId, people }: { tenantId: string; people: readonly Person[] }) {
  const [records, setRecords] = useState<readonly AcademicHistory[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function act(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<void>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    await act(async () => { await action(data); });
  }
  return <section className="stack" aria-label="CRUD de históricos acadêmicos">
    <div className="form-grid">
      <form className="stack" onSubmit={event => void submit(event, async data => {
        const value = await createAcademicHistory(tenantId, formValues(data));
        setRecords(await listAcademicHistories(tenantId, value.studentId));
        setNotice(`Histórico transferido registrado para ${value.studentName}.`);
      })}>
        <h3>Lançar histórico anterior</h3>
        {people.length ? <label>Aluno<select name="studentId" required><option value="">Selecione</option>{people.map(person =>
          <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          : <label>ID do aluno<input required name="studentId" /></label>}
        <label>Instituição de origem<input required name="sourceInstitution" maxLength={200} /></label>
        <label>Curso de origem<input required name="courseName" maxLength={200} /></label>
        <label>Ano letivo<input required name="academicYear" type="number" min="1" max="9999" /></label>
        <label>Período<input required name="period" maxLength={80} placeholder="Ex.: 2º bimestre, 2022.1" /></label>
        <label>Componente curricular<input required name="subjectName" maxLength={200} /></label>
        <label>Carga horária<input required name="workloadHours" type="number" min="1" /></label>
        <label>Nota ou conceito (opcional)<input name="gradeOrConcept" maxLength={40} /></label>
        <label>Faltas (opcional)<input name="absenceCount" type="number" min="0" /></label>
        <label>Resultado informado<input required name="result" maxLength={200} placeholder="Ex.: aprovado, concluído" /></label>
        <label>Observações (opcional)<textarea name="notes" maxLength={2000} rows={3} /></label>
        <button className="primary" disabled={busy}>Registrar histórico manual</button>
        <p className="muted">Dados de sistemas anteriores são digitados manualmente. O sistema não calcula notas, frequência ou aprovação.</p>
      </form>
      <div className="stack"><h3>Históricos cadastrados</h3>
        <div className="inline-actions">{people.length ? <select aria-label="Filtrar histórico por aluno" id="history-student"><option value="">Todos os alunos</option>{people.map(person =>
          <option key={person.id} value={person.id}>{person.name}</option>)}</select> : <input aria-label="ID do aluno para consultar histórico" id="history-student" placeholder="ID do aluno" />}
          <button className="secondary" disabled={busy} onClick={() => void act(async () => setRecords(await listAcademicHistories(tenantId,
            (document.getElementById('history-student') as HTMLInputElement | HTMLSelectElement).value || undefined)))}>Consultar</button></div>
        <ul className="item-list">{records.map(item => <li key={item.id}>
          <form className="stack" aria-label={`Editar histórico ${item.subjectName}`} onSubmit={event => void submit(event, async data => {
            await updateAcademicHistory(tenantId, item.id, formValues(data, item.studentId));
            setRecords(await listAcademicHistories(tenantId, item.studentId)); setNotice('Histórico atualizado.');
          })}>
            <strong>{item.studentName} · {item.subjectName} · {item.academicYear} · {item.period}</strong>
            <div className="form-grid"><label>Instituição de origem<input name="sourceInstitution" defaultValue={item.sourceInstitution} required /></label>
              <label>Curso de origem<input name="courseName" defaultValue={item.courseName} required /></label>
              <label>Ano letivo<input name="academicYear" type="number" min="1" max="9999" defaultValue={item.academicYear} required /></label>
              <label>Período<input name="period" defaultValue={item.period} required /></label>
              <label>Componente<input name="subjectName" defaultValue={item.subjectName} required /></label>
              <label>Carga horária<input name="workloadHours" type="number" min="1" defaultValue={item.workloadHours} required /></label>
              <label>Nota/conceito<input name="gradeOrConcept" defaultValue={item.gradeOrConcept ?? ''} /></label>
              <label>Faltas<input name="absenceCount" type="number" min="0" defaultValue={item.absenceCount ?? ''} /></label>
              <label>Resultado<input name="result" defaultValue={item.result} required /></label>
              <label>Observações<textarea name="notes" defaultValue={item.notes ?? ''} rows={2} /></label></div>
            <div className="inline-actions"><button className="quiet" disabled={busy}>Salvar alterações</button>
              <button className="quiet" type="button" disabled={busy} onClick={() => void act(async () => {
                await deleteAcademicHistory(tenantId, item.id); setRecords(await listAcademicHistories(tenantId, item.studentId)); setNotice('Histórico excluído.');
              })}>Excluir</button></div>
          </form>
        </li>)}</ul>
      </div>
    </div>
    <div aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</div>
  </section>;
}
