import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import type { createIdentityService } from '../identity/index.ts';
import type { createPeopleService } from '../people/index.ts';
import type { createAcademicService } from '../academic/index.ts';
import type { createGlobalPeopleService } from '../people/index.ts';
import type { createGlobalStudentSearchService } from '../people/student-search.ts';
import type { createPublicStudentSearchService } from '../people/public-student-search.ts';
import type { createPlatformIdentityService } from '../identity/index.ts';
import type { createInstitutionOperationContextService, createSuperAdminService } from '../super_admin/index.ts';
import type { createPublicCatalogService, PublicCatalogVersion } from '../public_catalog/index.ts';
import type { createCredentialService } from '../credential/index.ts';
import type { createAcademicHistoryService } from '../academic/history.ts';
import { parseInepSchoolCsv } from '../public_catalog/inep-csv.ts';
import { ApplicationError, type ErrorCode } from '../shared/errors.ts';

interface Services {
  identity: ReturnType<typeof createIdentityService>;
  people: ReturnType<typeof createPeopleService>;
  globalPeople: ReturnType<typeof createGlobalPeopleService>;
  globalStudentSearch: ReturnType<typeof createGlobalStudentSearchService>;
  publicStudentSearch: ReturnType<typeof createPublicStudentSearchService>;
  institutionOperationContext: ReturnType<typeof createInstitutionOperationContextService>;
  globalAcademic: ReturnType<typeof createAcademicService>;
  platformIdentity: ReturnType<typeof createPlatformIdentityService>;
  superAdmin: ReturnType<typeof createSuperAdminService>;
  publicCatalog: ReturnType<typeof createPublicCatalogService>;
  credentials: ReturnType<typeof createCredentialService>;
  academicHistory: ReturnType<typeof createAcademicHistoryService>;
}
const statuses: Record<ErrorCode, number> = { UNAUTHENTICATED: 401, FORBIDDEN: 403, INVALID_INPUT: 400,
  NOT_FOUND: 404, CONFLICT: 409, UNAVAILABLE: 503, RATE_LIMITED: 429 };
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

async function body(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
    throw new ApplicationError('INVALID_INPUT', 'Envie dados no formato JSON.');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const part of request) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
    size += chunk.length;
    if (size > 16_384) throw new ApplicationError('INVALID_INPUT', 'O conteúdo excede o limite permitido.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ApplicationError('INVALID_INPUT', 'Não foi possível ler os dados enviados.'); }
}

async function csvBody(request: IncomingMessage): Promise<Uint8Array> {
  const contentType = request.headers['content-type']?.split(';')[0]?.trim();
  if (contentType !== 'text/csv' && contentType !== 'application/csv') {
    throw new ApplicationError('INVALID_INPUT', 'Envie o arquivo oficial exportado em CSV.');
  }
  const maximum = 128 * 1024 * 1024;
  const declaredSize = Number(request.headers['content-length'] ?? 0);
  if (declaredSize > maximum) throw new ApplicationError('INVALID_INPUT', 'O arquivo excede o limite de 128 MB.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const part of request) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
    size += chunk.length;
    if (size > maximum) throw new ApplicationError('INVALID_INPUT', 'O arquivo excede o limite de 128 MB.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function versionSummary(version: PublicCatalogVersion) {
  return {
    id: version.id,
    source: version.source,
    edition: version.edition,
    collectedAt: version.collectedAt,
    sourceUrl: version.sourceUrl,
    state: version.state,
    completeness: version.completeness,
    validCount: version.validCount,
    rejectedCount: version.rejectedCount,
    conflictCount: version.conflictCount,
    ...(version.appliedAt ? { appliedAt: version.appliedAt } : {}),
    rejected: version.rejected.slice(0, 100),
    rejectionsTruncated: version.rejected.length > 100,
  };
}

function token(request: IncomingMessage, name = 'session'): string | undefined {
  return request.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function targetInput(input: unknown, allowed: readonly string[]): { targetTenantId: unknown; operation: Record<string, unknown> } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados inválidos.');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !['targetTenantId', ...allowed].includes(key))) {
    throw new ApplicationError('INVALID_INPUT', 'Dados inválidos.');
  }
  const { targetTenantId, ...operation } = value;
  return { targetTenantId, operation };
}

export function createHttpServer(services: Services, options: { origin: string; platformPostLimit?: number }) {
  const configured = new URL(options.origin);
  if (configured.origin !== options.origin || !['https:', 'http:'].includes(configured.protocol)) throw new Error('PUBLIC_ORIGIN deve conter apenas protocolo e origem.');
  if (configured.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(configured.hostname)) throw new Error('Use HTTPS fora do ambiente local.');
  const cookie = (value: string, age: number) => `session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${configured.protocol === 'https:' ? '; Secure' : ''}`;
  const namedCookie = (name: string, value: string, age: number) => `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${configured.protocol === 'https:' ? '; Secure' : ''}`;
  const files: Record<string, [string, string]> = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  };
  const loginAttempts = new Map<string, { count: number; until: number }>();
  const platformAttempts = new Map<string, { count: number; until: number }>();
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const url = new URL(request.url ?? '/', options.origin);
      if (url.origin !== options.origin) throw new ApplicationError('INVALID_INPUT', 'Endereço inválido.');
      if (request.method === 'GET' && files[url.pathname]) {
        const [file, mime] = files[url.pathname]!;
        const content = await readFile(new URL(`../../public/${file}`, import.meta.url));
        response.writeHead(200, { 'Content-Type': mime }); response.end(content); return;
      }
      if (request.method === 'GET' && url.pathname === '/webauthn.js') {
        const content = await readFile(new URL('../../node_modules/@simplewebauthn/browser/dist/bundle/index.umd.min.js', import.meta.url));
        response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); response.end(content); return;
      }
      if (request.method === 'GET' && url.pathname === '/health') { json(response, 200, { status: 'ok' }); return; }
      const publicCredential = /^\/validar\/([A-Za-z0-9_-]{1,256})$/.exec(url.pathname);
      if (request.method === 'GET' && publicCredential) {
        json(response, 200, await services.credentials.validate(publicCredential[1]!)); return;
      }
      const apiPublicCredential = /^\/api\/credentials\/validate\/([A-Za-z0-9_-]{1,256})$/.exec(url.pathname);
      if (request.method === 'GET' && apiPublicCredential) {
        json(response, 200, await services.credentials.validate(apiPublicCredential[1]!)); return;
      }
      if (!['GET', 'HEAD'].includes(request.method ?? '') && request.headers.origin !== options.origin) {
        throw new ApplicationError('FORBIDDEN', 'Origem da solicitação não autorizada.');
      }
      if (request.method === 'POST' && url.pathname === '/api/public/students/search') {
        const input = await body(request);
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados inválidos.');
        const value = input as Record<string, unknown>;
        const allowed = ['cpf', 'name', 'birthMunicipality', 'birthUf', 'course', 'page', 'pageSize'];
        if (Object.keys(value).some(key => !allowed.includes(key))) throw new ApplicationError('INVALID_INPUT', 'Dados inválidos.');
        const { page = 1, pageSize = 20, ...filters } = value;
        json(response, 200, await services.publicStudentSearch.search(filters, { page, pageSize })); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/session') {
        const now = Date.now();
        for (const [key, value] of loginAttempts) if (value.until <= now) loginAttempts.delete(key);
        const key = request.socket.remoteAddress ?? 'unknown';
        const attempt = loginAttempts.get(key) ?? { count: 0, until: now + 60_000 };
        if (attempt.count >= 20 || (!loginAttempts.has(key) && loginAttempts.size >= 1000)) {
          throw new ApplicationError('RATE_LIMITED', 'Muitas tentativas. Aguarde um minuto e tente novamente.');
        }
        attempt.count++; loginAttempts.set(key, attempt);
        const login = await services.identity.login(await body(request));
        response.setHeader('Set-Cookie', cookie(login.token, 8 * 60 * 60));
        json(response, 200, login.principal); return;
      }
      if (request.method === 'POST' && url.pathname.startsWith('/api/platform/')) {
        const now = Date.now();
        for (const [key, value] of platformAttempts) if (value.until <= now) platformAttempts.delete(key);
        const key = request.socket.remoteAddress ?? 'unknown';
        const attempt = platformAttempts.get(key) ?? { count: 0, until: now + 60_000 };
        if (attempt.count >= (options.platformPostLimit ?? 20) || (!platformAttempts.has(key) && platformAttempts.size >= 1000)) {
          throw new ApplicationError('RATE_LIMITED', 'Muitas tentativas. Aguarde um minuto e tente novamente.');
        }
        attempt.count++; platformAttempts.set(key, attempt);
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/activation/options') {
        const result = await services.platformIdentity.beginActivation(await body(request));
        response.setHeader('Set-Cookie', namedCookie('platform_activation', result.ceremonyToken, 300));
        json(response, 200, result.options); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/activation/verify') {
        const input = await body(request);
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('UNAUTHENTICATED', 'Ativação inválida ou expirada.');
        const result = await services.platformIdentity.completeActivation({ ...input,
          ceremonyToken: token(request, 'platform_activation') });
        response.setHeader('Set-Cookie', [namedCookie('platform_activation', '', 0), namedCookie('platform_login', '', 0),
          namedCookie('platform_session', result.token, 8 * 60 * 60)]);
        json(response, 200, result.principal); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/login/options') {
        const result = await services.platformIdentity.beginLogin(await body(request));
        response.setHeader('Set-Cookie', namedCookie('platform_login', result.ceremonyToken, 300));
        json(response, 200, result.options); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/login/verify') {
        const input = await body(request);
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
        const result = await services.platformIdentity.completeLogin({ ...input,
          ceremonyToken: token(request, 'platform_login') });
        response.setHeader('Set-Cookie', [namedCookie('platform_login', '', 0), namedCookie('platform_session', result.token, 8 * 60 * 60)]);
        json(response, 200, result.principal); return;
      }
      if (request.method === 'DELETE' && url.pathname === '/api/platform/session') {
        await services.platformIdentity.logout(token(request, 'platform_session'));
        response.setHeader('Set-Cookie', namedCookie('platform_session', '', 0));
        response.writeHead(204); response.end(); return;
      }
      if (request.method === 'GET' && url.pathname === '/api/platform/session') {
        json(response, 200, await services.platformIdentity.authenticate(token(request, 'platform_session'))); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/public-catalog/inep/preview') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        if ([...url.searchParams.keys()].some(key => !['edition', 'collectedAt', 'sourceUrl'].includes(key))) {
          throw new ApplicationError('INVALID_INPUT', 'Metadados da carga inválidos.');
        }
        const edition = url.searchParams.get('edition');
        const collectedAt = url.searchParams.get('collectedAt');
        const sourceUrl = url.searchParams.get('sourceUrl');
        if (!edition || !collectedAt || !sourceUrl) throw new ApplicationError('INVALID_INPUT', 'Informe edição, data de coleta e link oficial da fonte.');
        const batch = parseInepSchoolCsv(await csvBody(request), { edition, collectedAt, sourceUrl });
        const preview = await services.publicCatalog.previewInepSchools(platform, batch);
        json(response, 201, versionSummary(preview)); return;
      }
      if (request.method === 'GET' && url.pathname === '/api/platform/public-catalog/inep/schools') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        if ([...url.searchParams.keys()].some(key => !['name', 'sourceId', 'municipality', 'state'].includes(key))) {
          throw new ApplicationError('INVALID_INPUT', 'Filtro de escolas inválido.');
        }
        const query = Object.fromEntries(url.searchParams.entries());
        json(response, 200, await services.publicCatalog.searchInepSchools(platform, query)); return;
      }
      const inepVersion = /^\/api\/platform\/public-catalog\/inep\/versions\/([^/]+)(\/apply)?$/.exec(url.pathname);
      if (inepVersion && request.method === 'GET' && !inepVersion[2]) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const version = await services.publicCatalog.getInepVersion(platform, decodeURIComponent(inepVersion[1]!));
        json(response, version ? 200 : 404, version ? versionSummary(version) : { code: 'NOT_FOUND', message: 'Versão não encontrada.' }); return;
      }
      if (inepVersion && request.method === 'POST' && inepVersion[2]) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const version = await services.publicCatalog.applyInepSchools(platform, decodeURIComponent(inepVersion[1]!));
        json(response, 200, versionSummary(version)); return;
      }
      if (url.pathname.startsWith('/api/platform/public-catalog/emec/')) {
        throw new ApplicationError('NOT_FOUND', 'Operação não encontrada.');
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/institutions') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        json(response, 201, await services.superAdmin.createInstitution(platform, await body(request))); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/credentials') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['studentId', 'courseId', 'type', 'issuedOn']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.credentials.create(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/credentials/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.credentials.list(context)); return;
      }
      const platformCredential = new RegExp(`^/api/platform/credentials/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformCredential) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['type', 'issuedOn']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.credentials.update(context, platformCredential[1]!, input.operation)); return;
      }
      if (request.method === 'DELETE' && platformCredential) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        await services.credentials.delete(context, platformCredential[1]!);
        json(response, 200, { deleted: true }); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/histories') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['studentId', 'sourceInstitution', 'courseName', 'academicYear', 'period',
          'subjectName', 'workloadHours', 'gradeOrConcept', 'absenceCount', 'result', 'notes']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.academicHistory.create(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/histories/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['studentId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.academicHistory.list(context, input.operation.studentId as string | undefined)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/histories/get') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['id']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        if (typeof input.operation.id !== 'string') throw new ApplicationError('INVALID_INPUT', 'Informe o ID do histórico.');
        json(response, 200, await services.academicHistory.get(context, input.operation.id)); return;
      }
      const platformHistory = new RegExp(`^/api/platform/histories/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformHistory) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['studentId', 'sourceInstitution', 'courseName', 'academicYear', 'period',
          'subjectName', 'workloadHours', 'gradeOrConcept', 'absenceCount', 'result', 'notes']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.academicHistory.update(context, platformHistory[1]!, input.operation)); return;
      }
      if (request.method === 'DELETE' && platformHistory) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        await services.academicHistory.delete(context, platformHistory[1]!);
        json(response, 200, { deleted: true }); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/people') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['name', 'cpf', 'institutionalId', 'birthMunicipality', 'birthUf']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalPeople.create(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/courses') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['name', 'code', 'educationScope']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createCourse(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/courses/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['educationScope']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.listCourses(context, input.operation.educationScope)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/collaborators') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['personId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createCollaborator(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/collaborators/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.listCollaborators(context)); return;
      }
      const platformCollaborator = new RegExp(`^/api/platform/collaborators/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformCollaborator) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['active']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.updateCollaborator(context, platformCollaborator[1]!, input.operation)); return;
      }
      const platformCourse = new RegExp(`^/api/platform/courses/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformCourse) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['name', 'active']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.updateCourse(context, platformCourse[1]!, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/courses/detail') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['courseId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.getCourseDetail(context, String(input.operation.courseId))); return;
      }
      const platformCourseSubject = new RegExp(`^/api/platform/courses/(${uuid})/subjects$`, 'i').exec(url.pathname);
      if (request.method === 'POST' && platformCourseSubject) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['name', 'code', 'workloadHours', 'collaboratorIds']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createSubject(context, platformCourseSubject[1]!, input.operation)); return;
      }
      const platformSubjectAssessments = new RegExp(`^/api/platform/courses/(${uuid})/subjects/(${uuid})/assessments$`, 'i').exec(url.pathname);
      if (request.method === 'POST' && platformSubjectAssessments) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['title', 'occursOn', 'maxPoints']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createAssessment(context, platformSubjectAssessments[1]!,
          platformSubjectAssessments[2]!, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/assessments/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['courseId', 'subjectId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.listAssessments(context, String(input.operation.courseId),
          String(input.operation.subjectId))); return;
      }
      const platformAssessment = new RegExp(`^/api/platform/assessments/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformAssessment) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['title', 'occursOn', 'maxPoints']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.updateAssessment(context, platformAssessment[1]!, input.operation)); return;
      }
      if (request.method === 'DELETE' && platformAssessment) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        await services.globalAcademic.deleteAssessment(context, platformAssessment[1]!);
        json(response, 200, { deleted: true }); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/grades') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['enrollmentId', 'assessmentId', 'value']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createGrade(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/grades/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['enrollmentId', 'assessmentId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.listGrades(context, input.operation)); return;
      }
      const platformGrade = new RegExp(`^/api/platform/grades/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformGrade) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['value']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.updateGrade(context, platformGrade[1]!, input.operation)); return;
      }
      if (request.method === 'DELETE' && platformGrade) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        await services.globalAcademic.deleteGrade(context, platformGrade[1]!);
        json(response, 200, { deleted: true }); return;
      }
      const platformSubjectAttendance = new RegExp(`^/api/platform/courses/(${uuid})/subjects/(${uuid})/attendance$`, 'i').exec(url.pathname);
      if (request.method === 'POST' && platformSubjectAttendance) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['enrollmentId', 'occursOn', 'status']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createAttendance(context, platformSubjectAttendance[1]!,
          platformSubjectAttendance[2]!, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/attendance/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['enrollmentId', 'subjectId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.listAttendance(context, input.operation)); return;
      }
      const platformAttendance = new RegExp(`^/api/platform/attendance/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformAttendance) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['occursOn', 'status']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.updateAttendance(context, platformAttendance[1]!, input.operation)); return;
      }
      if (request.method === 'DELETE' && platformAttendance) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), []);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        await services.globalAcademic.deleteAttendance(context, platformAttendance[1]!);
        json(response, 200, { deleted: true }); return;
      }
      const platformCourseSubjectUpdate = new RegExp(`^/api/platform/courses/(${uuid})/subjects/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformCourseSubjectUpdate) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['name', 'workloadHours', 'active', 'collaboratorIds']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.updateSubject(context, platformCourseSubjectUpdate[1]!,
          platformCourseSubjectUpdate[2]!, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/enrollments') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['personId', 'courseId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 201, await services.globalAcademic.createEnrollment(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/enrollments/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['courseId', 'status']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.listEnrollments(context, String(input.operation.courseId), input.operation.status)); return;
      }
      const platformEnrollment = new RegExp(`^/api/platform/courses/(${uuid})/enrollments/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'PATCH' && platformEnrollment) {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['status']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalAcademic.transitionEnrollment(context, platformEnrollment[1]!, platformEnrollment[2]!, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/people/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['cpf', 'institutionalId']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        json(response, 200, await services.globalPeople.find(context, input.operation)); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/platform/students/search') {
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const input = targetInput(await body(request), ['cpf', 'name', 'birthMunicipality', 'birthUf', 'course', 'page', 'pageSize']);
        const context = await services.institutionOperationContext.resolve(platform, input.targetTenantId);
        const page = input.operation.page ?? 1;
        const pageSize = input.operation.pageSize ?? 20;
        const { page: _page, pageSize: _pageSize, ...filters } = input.operation;
        json(response, 200, await services.globalStudentSearch.search(context, filters, { page, pageSize })); return;
      }
      const platformPerson = new RegExp(`^/api/platform/people/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'GET' && platformPerson) {
        if ([...url.searchParams.keys()].some(key => key !== 'targetTenantId')) {
          throw new ApplicationError('INVALID_INPUT', 'Dados inválidos.');
        }
        const platform = await services.platformIdentity.authenticate(token(request, 'platform_session'));
        const context = await services.institutionOperationContext.resolve(platform, url.searchParams.get('targetTenantId'));
        json(response, 200, await services.globalPeople.get(context, platformPerson[1]!));
        return;
      }
      if (request.method === 'DELETE' && url.pathname === '/api/session') {
        await services.identity.logout(token(request));
        response.setHeader('Set-Cookie', cookie('', 0));
        response.writeHead(204); response.end(); return;
      }
      const principal = await services.identity.authenticate(token(request));
      if (request.method === 'GET' && url.pathname === '/api/session') { json(response, 200, principal); return; }
      if (request.method === 'POST' && url.pathname === '/api/people') {
        json(response, 201, await services.people.create(principal, await body(request))); return;
      }
      if (request.method === 'POST' && url.pathname === '/api/people/search') {
        json(response, 200, await services.people.find(principal, await body(request))); return;
      }
      const match = new RegExp(`^/api/people/(${uuid})$`, 'i').exec(url.pathname);
      if (request.method === 'GET' && match) {
        json(response, 200, await services.people.get(principal, match[1]!)); return;
      }
      throw new ApplicationError('NOT_FOUND', 'Operação não encontrada.');
    } catch (error) {
      const known = error instanceof ApplicationError;
      if (known && error.code === 'UNAUTHENTICATED') {
        response.setHeader('Set-Cookie', request.url?.startsWith('/api/platform/')
          ? [namedCookie('platform_session', '', 0)] : [cookie('', 0)]);
      }
      if (known && error.code === 'RATE_LIMITED') response.setHeader('Retry-After', '60');
      if (!response.destroyed) json(response, known ? statuses[error.code] : 500, {
        code: known ? error.code : 'INTERNAL', message: known ? error.message : 'Não foi possível concluir. Tente novamente.',
      });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5000;
  return server;
}
