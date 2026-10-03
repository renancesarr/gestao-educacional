import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAcademicHistory, deleteAcademicHistory, getAcademicHistory, listAcademicHistories, updateAcademicHistory } from './academic-history-api.ts';

test('cliente de históricos mantém tenant explícito e suporta o CRUD manual', async () => {
  const calls: Array<{ path: string; method: string; body: Record<string, unknown> }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ path: String(input), method: String(init?.method), body: JSON.parse(String(init?.body ?? '{}')) });
    return new Response(JSON.stringify({ id: 'history-1', deleted: true }), { status: 200,
      headers: { 'Content-Type': 'application/json' } });
  };
  await createAcademicHistory('tenant-1', { studentId: 'student-1', sourceInstitution: 'Escola anterior', courseName: 'Fundamental',
    academicYear: 2022, period: '2º bimestre', subjectName: 'Matemática', workloadHours: 80, result: 'Aprovado' }, fetcher);
  await listAcademicHistories('tenant-1', 'student-1', fetcher);
  await getAcademicHistory('tenant-1', 'history-1', fetcher);
  await updateAcademicHistory('tenant-1', 'history-1', { result: 'Recuperação concluída' }, fetcher);
  await deleteAcademicHistory('tenant-1', 'history-1', fetcher);
  assert.deepEqual(calls.map(call => [call.path, call.method]), [
    ['/api/platform/histories', 'POST'], ['/api/platform/histories/search', 'POST'], ['/api/platform/histories/get', 'POST'],
    ['/api/platform/histories/history-1', 'PATCH'], ['/api/platform/histories/history-1', 'DELETE'],
  ]);
  assert.ok(calls.every(call => call.body.targetTenantId === 'tenant-1'));
  assert.equal(calls[1]!.body.studentId, 'student-1');
});
