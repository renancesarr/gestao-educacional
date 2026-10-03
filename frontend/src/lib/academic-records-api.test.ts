import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAssessment, createAttendance, createGrade, deleteAssessment, deleteAttendance, deleteGrade,
  listAssessments, listAttendance, listGrades, updateAssessment, updateAttendance, updateGrade } from './academic-records-api.ts';

test('adapters do CRUD acadêmico mantêm o tenant explícito e encaminham datas retroativas', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ path: String(input), init });
    return new Response(JSON.stringify({ id: 'record-1', deleted: true }), { status: 200,
      headers: { 'Content-Type': 'application/json' } });
  };
  await createAssessment('tenant-1', 'course-1', 'subject-1', { title: 'Prova antiga', occursOn: '2025-05-02', maxPoints: 10 }, fetcher);
  await listAssessments('tenant-1', 'course-1', 'subject-1', fetcher);
  await updateAssessment('tenant-1', 'assessment-1', { title: 'Prova corrigida' }, fetcher);
  await deleteAssessment('tenant-1', 'assessment-1', fetcher);
  await createGrade('tenant-1', { enrollmentId: 'enrollment-1', assessmentId: 'assessment-1', value: 8 }, fetcher);
  await listGrades('tenant-1', { enrollmentId: 'enrollment-1' }, fetcher);
  await updateGrade('tenant-1', 'grade-1', 9, fetcher);
  await deleteGrade('tenant-1', 'grade-1', fetcher);
  await createAttendance('tenant-1', 'course-1', 'subject-1', {
    enrollmentId: 'enrollment-1', occursOn: '2025-05-03', status: 'presente',
  }, fetcher);
  await listAttendance('tenant-1', { enrollmentId: 'enrollment-1' }, fetcher);
  await updateAttendance('tenant-1', 'attendance-1', { status: 'ausente' }, fetcher);
  await deleteAttendance('tenant-1', 'attendance-1', fetcher);

  assert.deepEqual(calls.map(call => call.path), [
    '/api/platform/courses/course-1/subjects/subject-1/assessments', '/api/platform/assessments/search',
    '/api/platform/assessments/assessment-1', '/api/platform/assessments/assessment-1',
    '/api/platform/grades', '/api/platform/grades/search', '/api/platform/grades/grade-1', '/api/platform/grades/grade-1',
    '/api/platform/courses/course-1/subjects/subject-1/attendance', '/api/platform/attendance/search',
    '/api/platform/attendance/attendance-1', '/api/platform/attendance/attendance-1',
  ]);
  for (const call of calls) assert.equal(JSON.parse(String(call.init?.body)).targetTenantId, 'tenant-1');
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    title: 'Prova antiga', occursOn: '2025-05-02', maxPoints: 10, targetTenantId: 'tenant-1',
  });
});
