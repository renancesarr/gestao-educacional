import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPeopleService } from '../../src/people/index.ts';
import { MemoryPeopleStore } from '../support/memory-people-store.ts';

const operator = {
  accountId: '00000000-0000-4000-8000-000000000001',
  tenantId: '00000000-0000-4000-8000-000000000010',
  accountContext: 'professional' as const,
  permissions: ['people:create', 'people:read'] as const,
};

function setup() {
  let sequence = 99;
  return createPeopleService({
    store: new MemoryPeopleStore(),
    newId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
    now: () => new Date('2026-09-29T12:00:00.000Z'),
  });
}

test('pessoa cadastrada pode ser consultada pelo operador da instituição', async () => {
  const people = setup();
  const created = await people.create(operator, {
    name: '  Aluno Fictício  ',
    institutionalId: 'ALUNO-001',
    birthMunicipality: 'Campinas',
    birthUf: 'SP',
  });
  assert.deepEqual(await people.get(operator, created.id), {
    id: '00000000-0000-4000-8000-000000000100',
    tenantId: operator.tenantId,
    name: 'Aluno Fictício',
    cpf: null,
    institutionalId: 'ALUNO-001',
    birthMunicipality: 'Campinas',
    birthUf: 'SP',
    createdAt: '2026-09-29T12:00:00.000Z',
  });
});

test('cadastro aceita município e UF de nascimento sem exigir os campos para registros antigos', async () => {
  const people = setup();
  const withoutBirthplace = await people.create(operator, { name: 'Aluno legado', institutionalId: 'LEGADO-001' });
  assert.equal(withoutBirthplace.birthMunicipality, null);
  assert.equal(withoutBirthplace.birthUf, null);
  let invalidIndex = 0;
  for (const birthplace of [
    { birthMunicipality: 'Campinas' },
    { birthUf: 'SP' },
    { birthMunicipality: 'Campinas', birthUf: 'SÃO' },
    { birthMunicipality: ' ', birthUf: 'SP' },
  ]) {
    await assert.rejects(people.create(operator, {
      name: 'Aluno inválido', institutionalId: `INVALIDO-${++invalidIndex}`, ...birthplace,
    }), { code: 'INVALID_INPUT' });
  }
});

test('CPF normalizado identifica uma pessoa por instituição sem unir nomes iguais', async () => {
  const people = setup();
  const first = await people.create(operator, { name: 'Aluno Fictício', cpf: '123.456.789-01' });
  await assert.rejects(people.create(operator, { name: 'Outro Aluno Fictício', cpf: '12345678901' }), { code: 'CONFLICT' });
  const sameName = await people.create(operator, { name: 'Aluno Fictício', institutionalId: 'OUTRO-001' });
  const otherTenant = { ...operator, tenantId: '00000000-0000-4000-8000-000000000020' };
  const independent = await people.create(otherTenant, { name: 'Aluno Fictício', cpf: '12345678901' });
  assert.notEqual(sameName.id, first.id);
  assert.notEqual(independent.id, first.id);
  assert.equal((await people.get(operator, first.id)).cpf, '12345678901');
});

test('operador sem permissão não cadastra pessoa', async () => {
  const people = setup();
  await assert.rejects(
    people.create({ ...operator, permissions: ['people:read'] }, {
      name: 'Aluno Fictício', institutionalId: 'ALUNO-001',
    }),
    { code: 'FORBIDDEN' },
  );
});

test('consulta exige permissão mesmo conhecendo o identificador da pessoa', async () => {
  const people = setup();
  const created = await people.create(operator, { name: 'Aluno Fictício', institutionalId: 'ALUNO-001' });
  await assert.rejects(people.get({ ...operator, permissions: [] }, created.id), { code: 'FORBIDDEN' });
});

test('conta de aluno não herda permissões profissionais da mesma pessoa', async () => {
  const people = setup();
  await assert.rejects(people.create({ ...operator, accountContext: 'student' }, {
    name: 'Aluno Fictício', institutionalId: 'ALUNO-001',
  }), { code: 'FORBIDDEN' });
});

test('ID de pessoa de outra instituição responde como um ID inexistente', async () => {
  const people = setup();
  const created = await people.create(operator, { name: 'Aluno Fictício', institutionalId: 'ALUNO-001' });
  const other = { ...operator, tenantId: '00000000-0000-4000-8000-000000000020' };
  await assert.rejects(people.get(other, created.id), { code: 'NOT_FOUND', message: 'Pessoa não encontrada.' });
  await assert.rejects(people.get(other, '00000000-0000-4000-8000-000000000999'), {
    code: 'NOT_FOUND', message: 'Pessoa não encontrada.',
  });
});

test('cadastro exige nome e identificador e não aceita tenant informado na entrada', async () => {
  const people = setup();
  const invalid = [
    { name: '', institutionalId: 'ALUNO-001' },
    { name: 'Aluno Fictício' },
    { name: 'Aluno Fictício', institutionalId: '   ' },
    { name: 'Aluno Fictício', cpf: 'abc' },
    { name: 'Aluno Fictício', cpf: '12345678901', tenantId: 'outra-instituicao' },
    { name: 123, institutionalId: 'ALUNO-001' },
    null,
  ];
  for (const input of invalid) {
    await assert.rejects(people.create(operator, input), { code: 'INVALID_INPUT' });
  }
});

test('falha de persistência não retorna sucesso nem torna a pessoa consultável', async () => {
  const store = new MemoryPeopleStore({ unavailable: true });
  const people = createPeopleService({
    store, newId: () => '00000000-0000-4000-8000-000000000100',
    now: () => new Date('2026-09-29T12:00:00.000Z'),
  });
  await assert.rejects(people.create(operator, { name: 'Aluno Fictício', institutionalId: 'ALUNO-001' }), {
    code: 'UNAVAILABLE', message: 'Não foi possível acessar os registros.',
  });
  store.restore();
  await assert.rejects(people.get(operator, '00000000-0000-4000-8000-000000000100'), { code: 'NOT_FOUND' });
});

test('falhas de consulta e auditoria não expõem detalhes da infraestrutura', async () => {
  const store = new MemoryPeopleStore({ unavailable: true });
  const people = createPeopleService({ store, newId: () => 'unused', now: () => new Date(0) });
  await assert.rejects(people.get(operator, '00000000-0000-4000-8000-000000000100'), {
    code: 'UNAVAILABLE', message: 'Não foi possível acessar os registros.',
  });
});

test('identificador institucional duplicado não sobrescreve a pessoa original', async () => {
  const people = setup();
  const original = await people.create(operator, { name: 'Aluno Fictício', institutionalId: 'ALUNO-001' });
  await assert.rejects(people.create(operator, { name: 'Outro Aluno', institutionalId: ' ALUNO-001 ' }), { code: 'CONFLICT' });
  assert.equal((await people.get(operator, original.id)).name, 'Aluno Fictício');
});

test('cada instância de teste possui armazenamento independente', async () => {
  const people = setup();
  const person = await people.create(operator, { name: 'Aluno Fictício', institutionalId: 'ALUNO-001' });
  await assert.rejects(setup().get(operator, person.id), { code: 'NOT_FOUND' });
});

test('operador localiza cadastro por CPF formatado ou identificador institucional', async () => {
  const people = setup();
  const person = await people.create(operator, {
    name: 'Aluno Fictício', cpf: '12345678901', institutionalId: 'ALUNO-001',
  });
  assert.deepEqual(await people.find(operator, { cpf: '123.456.789-01' }), person);
  assert.deepEqual(await people.find(operator, { institutionalId: ' ALUNO-001 ' }), person);
});

test('busca por identificador exige permissão de leitura', async () => {
  await assert.rejects(setup().find({ ...operator, permissions: [] }, { cpf: '12345678901' }), { code: 'FORBIDDEN' });
});

test('falha na busca por identificador não expõe detalhes de persistência', async () => {
  const people = createPeopleService({ store: new MemoryPeopleStore({ unavailable: true }),
    newId: () => 'unused', now: () => new Date(0) });
  await assert.rejects(people.find(operator, { cpf: '12345678901' }), {
    code: 'UNAVAILABLE', message: 'Não foi possível acessar os registros.',
  });
});

test('busca não encontra CPF nem identificador institucional de outro tenant', async () => {
  const people = setup();
  await people.create(operator, { name: 'Aluno Fictício', cpf: '12345678901', institutionalId: 'ALUNO-001' });
  const other = { ...operator, tenantId: '00000000-0000-4000-8000-000000000020' };
  assert.equal(await people.find(other, { cpf: '12345678901' }), null);
  assert.equal(await people.find(other, { institutionalId: 'ALUNO-001' }), null);
  assert.equal(await people.find(operator, { institutionalId: 'INEXISTENTE' }), null);
});

test('busca exige um identificador válido e rejeita tentativa de escolher tenant', async () => {
  const people = setup();
  for (const input of [null, {}, { name: 'Aluno' }, { cpf: 'abc' }, { institutionalId: '' },
    { cpf: '12345678901', institutionalId: 'ALUNO-001' },
    { cpf: '12345678901', tenantId: 'outra-instituicao' }]) {
    await assert.rejects(people.find(operator, input), { code: 'INVALID_INPUT' });
  }
});

test('busca paginada combina nome, local de nascimento e UF dentro do tenant', async () => {
  const people = setup();
  await people.create(operator, { name: 'Ana Souza', institutionalId: 'ANA-002', birthMunicipality: 'Campinas', birthUf: 'SP' });
  await people.create(operator, { name: 'Ana Lima', institutionalId: 'ANA-001', birthMunicipality: 'Campinas', birthUf: 'SP' });
  await people.create(operator, { name: 'Ana Santos', institutionalId: 'ANA-003', birthMunicipality: 'Santos', birthUf: 'SP' });
  await people.create({ ...operator, tenantId: '00000000-0000-4000-8000-000000000020' }, {
    name: 'Ana Campinas', institutionalId: 'ANA-OUTRA', birthMunicipality: 'Campinas', birthUf: 'SP',
  });

  const result = await people.search(operator, { name: 'ana', birthMunicipality: 'camp', birthUf: 'sp' }, { page: 1, pageSize: 1 });

  assert.equal(result.total, 2);
  assert.equal(result.totalPages, 2);
  assert.equal(result.people[0]?.name, 'Ana Lima');
  assert.equal((await people.search(operator, { birthMunicipality: 'Campinas', birthUf: 'sp' }, { page: 2, pageSize: 1 })).people[0]?.name, 'Ana Souza');
});

test('busca por CPF normaliza formatação e exige permissão de leitura', async () => {
  const people = setup();
  const created = await people.create(operator, { name: 'Aluno CPF', cpf: '12345678901' });
  const result = await people.search(operator, { cpf: '123.456.789-01' }, { page: 1, pageSize: 10 });
  assert.deepEqual(result.people, [created]);
  await assert.rejects(people.search({ ...operator, permissions: [] }, { cpf: '12345678901' }, { page: 1, pageSize: 10 }), { code: 'FORBIDDEN' });
});
