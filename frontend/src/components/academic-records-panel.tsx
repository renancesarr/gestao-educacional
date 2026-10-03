'use client';

import { useState, type FormEvent } from 'react';
import { type Course, type CourseDetail, getCourseDetail } from '../lib/academic-api.ts';
import { type Enrollment, listEnrollments } from '../lib/enrollment-api.ts';
import { createAssessment, createAttendance, createGrade, deleteAssessment, deleteAttendance, deleteGrade,
  listAssessments, listAttendance, listGrades, updateAssessment, updateAttendance, updateGrade,
  type Assessment, type Attendance, type AttendanceStatus, type Grade } from '../lib/academic-records-api.ts';

export function AcademicRecordsPanel({ tenantId, courses }: { tenantId: string; courses: readonly Course[] }) {
  const [courseId, setCourseId] = useState('');
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [enrollments, setEnrollments] = useState<readonly Enrollment[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [assessments, setAssessments] = useState<readonly Assessment[]>([]);
  const [grades, setGrades] = useState<readonly Grade[]>([]);
  const [attendance, setAttendance] = useState<readonly Attendance[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function act(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  async function loadCourse() {
    if (!courseId) throw new Error('Selecione um curso.');
    const [course, listedEnrollments] = await Promise.all([getCourseDetail(tenantId, courseId), listEnrollments(tenantId, courseId)]);
    setDetail(course); setEnrollments(listedEnrollments); setSubjectId(course.subjects[0]?.id ?? '');
    setEnrollmentId(listedEnrollments[0]?.id ?? ''); setAssessments([]); setGrades([]); setAttendance([]);
    setNotice('Curso, matérias e matrículas carregados.');
  }
  async function loadAssessments() {
    if (!courseId || !subjectId) return;
    setAssessments(await listAssessments(tenantId, courseId, subjectId));
  }
  async function loadStudentRecords() {
    if (!enrollmentId) { setGrades([]); setAttendance([]); return; }
    const [studentGrades, studentAttendance] = await Promise.all([
      listGrades(tenantId, { enrollmentId }), listAttendance(tenantId, { enrollmentId }),
    ]);
    setGrades(studentGrades); setAttendance(studentAttendance);
  }
  async function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<void>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    await act(async () => { await action(data); form.reset(); });
  }
  const selectedSubject = detail?.subjects.find(value => value.id === subjectId);
  const selectedEnrollment = enrollments.find(value => value.id === enrollmentId);
  const assessmentTitle = (id: string) => assessments.find(value => value.id === id)?.title ?? 'Avaliação';

  return <section className="stack" aria-label="CRUD de avaliações, notas e frequência">
    <div className="form-grid">
      <div className="stack"><h3>Selecionar percurso</h3>
        {courses.length ? <label>Curso<select name="recordsCourse" value={courseId} onChange={event => setCourseId(event.target.value)}>
          <option value="">Selecione um curso</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}
        </select></label> : <label>ID do curso<input name="recordsCourse" value={courseId} onChange={event => setCourseId(event.target.value)} /></label>}
        <button className="secondary" disabled={busy || !courseId} onClick={() => void act(loadCourse)}>Carregar curso, matérias e matrículas</button>
        {detail && <><label>Matéria<select aria-label="Matéria" value={subjectId} onChange={event => setSubjectId(event.target.value)}>
          <option value="">Selecione uma matéria</option>{detail.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name}</option>)}
        </select></label><button className="secondary" disabled={busy || !subjectId} onClick={() => void act(loadAssessments)}>Consultar avaliações</button>
        <label>Matrícula<select aria-label="Matrícula" value={enrollmentId} onChange={event => setEnrollmentId(event.target.value)}>
          <option value="">Selecione uma matrícula</option>{enrollments.map(enrollment => <option key={enrollment.id} value={enrollment.id}>{enrollment.personName} · {enrollment.status}</option>)}
        </select></label><button className="secondary" disabled={busy || !enrollmentId} onClick={() => void act(loadStudentRecords)}>Consultar notas e frequência</button></>}
      </div>

      <form className="stack" onSubmit={event => void submit(event, async data => {
        if (!subjectId) throw new Error('Carregue o curso e selecione uma matéria.');
        const value = await createAssessment(tenantId, courseId, subjectId, { title: String(data.get('title')),
          occursOn: String(data.get('occursOn')), maxPoints: Number(data.get('maxPoints')) });
        await loadAssessments(); setNotice(`Avaliação criada: ${value.title} · ${value.occursOn}`);
      })}>
        <h3>Nova avaliação</h3><label>Título<input name="title" required maxLength={200} /></label>
        <label>Data acadêmica<input name="occursOn" type="date" required /></label>
        <label>Pontuação máxima<input name="maxPoints" type="number" min="0.01" step="any" required /></label>
        <button className="primary" disabled={busy || !subjectId}>Criar avaliação</button>
        <p className="muted">A data pode ser anterior para lançamento manual de histórico transferido.</p>
      </form>
    </div>

    <section className="stack"><h3>Avaliações de {selectedSubject?.name ?? 'matéria selecionada'}</h3>
      <ul className="item-list">{assessments.map(item => <li key={item.id}>
        <form className="stack" aria-label={`Editar avaliação ${item.title}`} onSubmit={event => void submit(event, async data => {
          const updated = await updateAssessment(tenantId, item.id, { title: String(data.get('title')),
            occursOn: String(data.get('occursOn')), maxPoints: Number(data.get('maxPoints')) });
          await loadAssessments(); setNotice(`Avaliação atualizada: ${updated.title}.`);
        })}>
          <strong>{item.title}</strong><div className="form-grid"><label>Título<input name="title" defaultValue={item.title} required /></label>
            <label>Data acadêmica<input name="occursOn" type="date" defaultValue={item.occursOn} required /></label>
            <label>Pontuação máxima<input name="maxPoints" type="number" min="0.01" step="any" defaultValue={item.maxPoints} required /></label></div>
          <div className="inline-actions"><button className="quiet" disabled={busy}>Salvar avaliação</button>
            <button className="quiet" type="button" disabled={busy} onClick={() => void act(async () => {
              await deleteAssessment(tenantId, item.id); await loadAssessments(); await loadStudentRecords(); setNotice('Avaliação excluída.');
            })}>Excluir avaliação</button></div>
        </form>
      </li>)}</ul>
    </section>

    <div className="form-grid">
      <form className="stack" onSubmit={event => void submit(event, async data => {
        if (!enrollmentId) throw new Error('Selecione uma matrícula.');
        const value = await createGrade(tenantId, { enrollmentId, assessmentId: String(data.get('assessmentId')), value: Number(data.get('value')) });
        await loadStudentRecords(); setNotice(`Nota registrada: ${value.value}.`);
      })}>
        <h3>Registrar nota{selectedEnrollment ? ` · ${selectedEnrollment.personName}` : ''}</h3>
        <label>Avaliação<select name="assessmentId" required>{assessments.map(item => <option key={item.id} value={item.id}>{item.title} · máximo {item.maxPoints}</option>)}</select></label>
        <label>Nota<input name="value" type="number" min="0" step="any" required /></label>
        <button className="primary" disabled={busy || !enrollmentId || assessments.length === 0}>Registrar nota</button>
      </form>
      <form className="stack" onSubmit={event => void submit(event, async data => {
        if (!enrollmentId || !subjectId) throw new Error('Selecione uma matrícula e uma matéria.');
        const value = await createAttendance(tenantId, courseId, subjectId, { enrollmentId,
          occursOn: String(data.get('occursOn')), status: String(data.get('status')) as AttendanceStatus });
        await loadStudentRecords(); setNotice(`Frequência registrada: ${value.status} · ${value.occursOn}.`);
      })}>
        <h3>Registrar frequência{selectedEnrollment ? ` · ${selectedEnrollment.personName}` : ''}</h3>
        <label>Data acadêmica<input name="occursOn" type="date" required /></label>
        <label>Situação<select name="status"><option value="presente">Presente</option><option value="ausente">Ausente</option></select></label>
        <button className="primary" disabled={busy || !enrollmentId || !subjectId}>Registrar frequência</button>
      </form>
    </div>

    <div className="form-grid">
      <section className="stack"><h3>Notas de {selectedEnrollment?.personName ?? 'matrícula selecionada'}</h3><ul className="item-list">
        {grades.map(grade => <li key={grade.id}><span>{assessmentTitle(grade.assessmentId)} · nota {grade.value}</span>
          <div className="inline-actions"><button className="quiet" onClick={() => { const value = prompt('Nova nota', String(grade.value));
            if (value === null) return; void act(async () => { await updateGrade(tenantId, grade.id, Number(value)); await loadStudentRecords(); setNotice('Nota atualizada.'); }); }}>Editar</button>
            <button className="quiet" onClick={() => void act(async () => { await deleteGrade(tenantId, grade.id); await loadStudentRecords(); setNotice('Nota excluída.'); })}>Excluir</button></div>
        </li>)}
      </ul></section>
      <section className="stack"><h3>Frequência de {selectedEnrollment?.personName ?? 'matrícula selecionada'}</h3><ul className="item-list">
        {attendance.map(item => <li key={item.id}><span>{item.occursOn} · {item.status}</span>
          <div className="inline-actions"><button className="quiet" onClick={() => { const occursOn = prompt('Nova data acadêmica (AAAA-MM-DD)', item.occursOn);
            if (!occursOn) return; void act(async () => { const updated = await updateAttendance(tenantId, item.id, { occursOn });
              await loadStudentRecords(); setNotice(`Frequência atualizada: ${updated.occursOn}.`); }); }}>Editar data</button>
            <button className="quiet" onClick={() => void act(async () => {
            const updated = await updateAttendance(tenantId, item.id, { status: item.status === 'presente' ? 'ausente' : 'presente' });
            await loadStudentRecords(); setNotice(`Frequência atualizada: ${updated.status}.`);
          })}>Alternar situação</button>
            <button className="quiet" onClick={() => void act(async () => { await deleteAttendance(tenantId, item.id); await loadStudentRecords(); setNotice('Frequência excluída.'); })}>Excluir</button></div>
        </li>)}
      </ul></section>
    </div>
    <div aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</div>
  </section>;
}
