import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: SUPER_ADMIN cria curso para a instituição-alvo explícita', async () => {
  const origin = 'http://127.0.0.1:4322';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-course' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4322, '127.0.0.1', resolve); });
  try {
    const response = await fetch(`${origin}/api/platform/courses`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010',
      name: 'Ensino Fundamental', code: 'fund-2026', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } }) });
    assert.equal(response.status, 201);
    const course = await response.json() as { id: string; code: string; active: boolean };
    assert.equal(course.code, 'fund-2026');
    const personResponse = await fetch(`${origin}/api/platform/people`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010',
      name: 'Professora de Teste', institutionalId: 'prof-001' }) });
    const person = await personResponse.json() as { id: string };
    const collaboratorResponse = await fetch(`${origin}/api/platform/collaborators`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', personId: person.id }) });
    assert.equal(collaboratorResponse.status, 201);
    const collaborator = await collaboratorResponse.json() as { id: string; personName: string };
    assert.equal(collaborator.personName, 'Professora de Teste');
    const collaboratorList = await fetch(`${origin}/api/platform/collaborators/search`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010' }) });
    assert.deepEqual((await collaboratorList.json() as { id: string }[]).map(item => item.id), [collaborator.id]);
    const subjectResponse = await fetch(`${origin}/api/platform/courses/${course.id}/subjects`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', name: 'Matemática',
      code: 'mat-01', workloadHours: 40, collaboratorIds: [collaborator.id] }) });
    assert.equal(subjectResponse.status, 201);
    const subject = await subjectResponse.json() as { id: string };
    const detail = await fetch(`${origin}/api/platform/courses/detail`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', courseId: course.id }) });
    assert.equal((await detail.json() as { subjects: { code: string }[] }).subjects[0]!.code, 'mat-01');
    const enrollmentResponse = await fetch(`${origin}/api/platform/enrollments`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', personId: person.id, courseId: course.id }) });
    assert.equal(enrollmentResponse.status, 201);
    const enrollment = await enrollmentResponse.json() as { id: string; status: string; studentProfileId: string };
    assert.equal(enrollment.status, 'ativa');
    assert.ok(enrollment.studentProfileId);
    const enrollmentList = await fetch(`${origin}/api/platform/enrollments/search`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', courseId: course.id, status: 'ativa' }) });
    assert.equal((await enrollmentList.json() as { id: string }[])[0]!.id, enrollment.id);
    const assessmentResponse = await fetch(`${origin}/api/platform/courses/${course.id}/subjects/${subject.id}/assessments`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', title: 'Avaliação transferida',
      occursOn: '2026-03-10', maxPoints: 10 }) });
    assert.equal(assessmentResponse.status, 201);
    const assessment = await assessmentResponse.json() as { id: string; occursOn: string; createdAt: string };
    assert.equal(assessment.occursOn, '2026-03-10');
    const assessmentList = await fetch(`${origin}/api/platform/assessments/search`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', courseId: course.id, subjectId: subject.id }) });
    assert.equal((await assessmentList.json() as { id: string }[])[0]!.id, assessment.id);
    const gradeResponse = await fetch(`${origin}/api/platform/grades`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', enrollmentId: enrollment.id,
      assessmentId: assessment.id, value: 8 }) });
    assert.equal(gradeResponse.status, 201);
    const grade = await gradeResponse.json() as { id: string; value: number };
    assert.equal(grade.value, 8);
    const attendanceResponse = await fetch(`${origin}/api/platform/courses/${course.id}/subjects/${subject.id}/attendance`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', enrollmentId: enrollment.id,
      occursOn: '2026-03-11', status: 'presente' }) });
    assert.equal(attendanceResponse.status, 201);
    const attendance = await attendanceResponse.json() as { id: string; occursOn: string; status: string };
    assert.deepEqual({ occursOn: attendance.occursOn, status: attendance.status }, { occursOn: '2026-03-11', status: 'presente' });
    const gradeDeleteBlocked = await fetch(`${origin}/api/platform/assessments/${assessment.id}`, { method: 'DELETE', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010' }) });
    assert.equal(gradeDeleteBlocked.status, 409);
    const attendanceUpdate = await fetch(`${origin}/api/platform/attendance/${attendance.id}`, { method: 'PATCH', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', status: 'ausente' }) });
    assert.equal((await attendanceUpdate.json() as { status: string }).status, 'ausente');
    await fetch(`${origin}/api/platform/grades/${grade.id}`, { method: 'DELETE', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010' }) });
    await fetch(`${origin}/api/platform/assessments/${assessment.id}`, { method: 'DELETE', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010' }) });
    await fetch(`${origin}/api/platform/attendance/${attendance.id}`, { method: 'DELETE', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010' }) });
    const transition = await fetch(`${origin}/api/platform/courses/${course.id}/enrollments/${enrollment.id}`, { method: 'PATCH', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', status: 'trancada' }) });
    assert.equal((await transition.json() as { status: string }).status, 'trancada');
    const updated = await fetch(`${origin}/api/platform/courses/${course.id}`, { method: 'PATCH', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010', active: false }) });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json() as { active: boolean }).active, false);
    const list = await fetch(`${origin}/api/platform/courses/search`, { method: 'POST', headers: {
      Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ targetTenantId: '00000000-0000-4000-8000-000000000010',
      educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } }) });
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json() as { code: string }[]).map(course => course.code), ['fund-2026']);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
