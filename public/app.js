'use strict';
const $ = id => document.getElementById(id);
let session = null;
let sessionVersion = 0;
let currentPerson = null;
let platformSession = null;
const status = message => { $('status').textContent = message; };
const date = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

function showSession(value) {
  sessionVersion++;
  session = value;
  currentPerson = null;
  $('login-panel').hidden = Boolean(value);
  $('workspace').hidden = !value;
  $('result').hidden = true;
  $('audit-result').hidden = true;
  $('result-details').replaceChildren();
  $('result-name').textContent = '';
  $('audit-result').textContent = '';
  $('create-form').reset(); $('search-form').reset();
  $('search-label').textContent = 'CPF';
  $('empty-result').textContent = 'A consulta é limitada à instituição da sua conta.';
  $('empty-result').hidden = false;
  if (value) {
    $('institution-name').textContent = value.institutionName;
    const roles = { TENANT_ADMIN: 'Administrador institucional', ACADEMIC_SECRETARY: 'Secretaria', VIEWER: 'Consulta' };
    $('account-name').textContent = `${value.username} · ${roles[value.role]}`;
    $('create-fields').disabled = !value.permissions.includes('people:create');
    $('create-help').textContent = value.permissions.includes('people:create')
      ? 'Informe o CPF ou um identificador institucional. O cadastro não cria uma matrícula.'
      : 'Sua conta permite consultas. O cadastro exige permissão da administração institucional.';
  } else {
    $('institution-name').textContent = ''; $('account-name').textContent = '';
  }
}

async function api(path, method = 'GET', payload) {
  const version = sessionVersion;
  const response = await fetch(path, { method, credentials: 'same-origin', headers: payload ? { 'Content-Type': 'application/json' } : {},
    ...(payload ? { body: JSON.stringify(payload) } : {}) });
  const value = response.status === 204 ? null : await response.json();
  if (version !== sessionVersion) throw new Error('A sessão mudou. Repita a operação na instituição atual.');
  if (!response.ok) {
    if (response.status === 401 && session) { showSession(null); $('password').focus(); }
    throw new Error(value.message || 'Não foi possível concluir. Tente novamente.');
  }
  return value;
}

async function busy(button, message, work) {
  button.disabled = true; status(message);
  try { await work(); }
  catch (error) { status(error instanceof TypeError ? 'Falha de conexão. Confira sua conexão e tente novamente.' : error.message); }
  finally { button.disabled = false; }
}

function showPerson(person) {
  currentPerson = person;
  $('result').hidden = !person;
  $('empty-result').hidden = Boolean(person);
  $('audit-result').hidden = true;
  $('audit-result').textContent = '';
  $('result-details').replaceChildren();
  $('result-name').textContent = person ? person.name : '';
  if (!person) { $('empty-result').textContent = 'Nenhuma pessoa encontrada. Confira o identificador ou cadastre a pessoa se necessário.'; return; }
  const entries = [['CPF', person.cpf || 'Não informado'], ['Identificador institucional', person.institutionalId || 'Não informado'], ['Cadastrado em', date(person.createdAt)]];
  for (const [label, value] of entries) {
    const term = document.createElement('dt'); term.textContent = label;
    const description = document.createElement('dd'); description.textContent = value;
    $('result-details').append(term, description);
  }
  $('audit-button').hidden = !session.permissions.includes('audit:read');
  $('result').focus();
}

$('login-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Entrando…', async () => {
    const value = await api('/api/session', 'POST', { institution: $('institution').value, username: $('username').value, password: $('password').value });
    $('password').value = ''; showSession(value); status('Acesso autorizado.'); $('name').focus();
  });
});
async function platformCeremony(optionsPath, verifyPath, payload, button) {
  if (!window.SimpleWebAuthnBrowser || !navigator.credentials) throw new Error('Este navegador não oferece suporte a passkeys.');
  const options = await api(optionsPath, 'POST', payload);
  const response = verifyPath.includes('activation')
    ? await window.SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options })
    : await window.SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: options });
  return api(verifyPath, 'POST', { username: payload.username, response });
}
$('platform-activation-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Validando código e cadastrando passkey…', async () => {
    const username = $('activation-username').value.trim();
    const result = await platformCeremony('/api/platform/activation/options', '/api/platform/activation/verify',
      { username, activationCode: $('activation-code').value }, event.submitter);
    $('activation-code').value = ''; $('activation-username').value = '';
    showPlatformSession(result); status('Passkey cadastrada. Acesso à plataforma autorizado.');
  });
});
$('platform-login-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Aguardando verificação da passkey…', async () => {
    const username = $('platform-username').value.trim();
    const result = await platformCeremony('/api/platform/login/options', '/api/platform/login/verify', { username }, event.submitter);
    $('platform-username').value = ''; showPlatformSession(result); status('Acesso da plataforma autorizado.');
  });
});
function showPlatformSession(value) {
  platformSession = value;
  $('login-panel').hidden = Boolean(value);
  $('platform-workspace').hidden = !value;
  $('workspace').hidden = true;
  $('platform-account-name').textContent = value?.username ?? '';
}
$('platform-logout').addEventListener('click', event => void busy(event.currentTarget, 'Saindo…', async () => {
  await api('/api/platform/session', 'DELETE'); showPlatformSession(null); showSession(null); status('Você saiu da plataforma.');
}));
$('institution-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Criando instituição…', async () => {
    const educationScope = [...document.querySelectorAll('#institution-education-scope input[name="educationScope"]:checked')]
      .map(input => {
        const { level, stage, modality, courseType } = input.dataset;
        return level === 'BASIC' ? { level, stage, ...(modality ? { modality } : {}) } : { level, courseType };
      });
    if (!educationScope.length) throw new Error('Selecione ao menos uma opção de escopo educacional.');
    const institution = await api('/api/platform/institutions', 'POST', { code: $('institution-code').value,
      name: $('institution-new-name').value, username: $('tenant-admin-username').value,
      password: $('tenant-admin-password').value, educationScope });
    $('institution-form').reset();
    status(`Instituição ${institution.name} cadastrada. ID interno: ${institution.tenantId}. O TENANT_ADMIN já pode entrar pelo acesso institucional.`);
  });
});
$('global-person-create-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Cadastrando pessoa…', async () => {
    const person = await api('/api/platform/people', 'POST', {
      targetTenantId: $('global-create-target').value.trim(), name: $('global-create-name').value,
      ...($('global-create-cpf').value.trim() ? { cpf: $('global-create-cpf').value.trim() } : {}),
      ...($('global-create-institutional-id').value.trim() ? { institutionalId: $('global-create-institutional-id').value.trim() } : {}),
    });
    $('global-person-create-form').reset();
    status(`Pessoa ${person.name} cadastrada.`);
  });
});
$('global-person-search-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Buscando pessoa…', async () => {
    const person = await api('/api/platform/people/search', 'POST', {
      targetTenantId: $('global-search-target').value.trim(),
      [$('global-search-kind').value]: $('global-search-value').value.trim(),
    });
    const result = $('global-person-result');
    result.textContent = person ? `${person.name} · ${person.id}` : 'Nenhuma pessoa encontrada.';
    result.hidden = false;
    status(person ? 'Pessoa encontrada.' : 'Nenhuma pessoa encontrada.');
  });
});
$('global-course-create-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Cadastrando curso…', async () => {
    const [level, value, modality] = $('global-course-scope').value.split(':');
    const educationScope = level === 'HIGHER' ? { level, courseType: value } : {
      level, stage: value, ...(modality ? { modality } : {}),
    };
    const course = await api('/api/platform/courses', 'POST', { targetTenantId: $('global-course-target').value.trim(),
      name: $('global-course-name').value, code: $('global-course-code').value.trim(), educationScope });
    $('global-course-create-form').reset();
    status(`Curso ${course.name} cadastrado.`);
  });
});
$('global-course-list').addEventListener('click', event => void busy(event.currentTarget, 'Consultando cursos…', async () => {
  const [level, value, modality] = $('global-course-scope').value.split(':');
  const educationScope = level === 'HIGHER' ? { level, courseType: value } : { level, stage: value, ...(modality ? { modality } : {}) };
  const courses = await api('/api/platform/courses/search', 'POST', { targetTenantId: $('global-course-target').value.trim(), educationScope });
  $('global-course-result').textContent = courses.length ? courses.map(course => `${course.code} · ${course.name} · ${course.active ? 'ativo' : 'inativo'}`).join(' | ') : 'Nenhum curso encontrado.';
  $('global-course-result').hidden = false;
}));
$('global-course-update-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Atualizando curso…', async () => {
    const input = { targetTenantId: $('global-course-target').value.trim(), active: $('global-course-active').checked };
    const name = $('global-course-update-name').value.trim();
    if (name) input.name = name;
    const course = await api(`/api/platform/courses/${$('global-course-id').value.trim()}`, 'PATCH', input);
    status(`Curso ${course.name} atualizado.`);
  });
});
$('global-collaborator-create-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Vinculando colaborador…', async () => {
    const collaborator = await api('/api/platform/collaborators', 'POST', {
      targetTenantId: $('global-collaborator-target').value.trim(), personId: $('global-collaborator-person').value.trim(),
    });
    status(`${collaborator.personName} vinculado como colaborador.`);
  });
});
$('global-collaborator-list').addEventListener('click', event => void busy(event.currentTarget, 'Consultando colaboradores…', async () => {
  const values = await api('/api/platform/collaborators/search', 'POST', {
    targetTenantId: $('global-collaborator-target').value.trim(),
  });
  $('global-collaborator-result').textContent = values.length
    ? values.map(value => `${value.personName} · ${value.active ? 'ativo' : 'inativo'} · ${value.id}`).join(' | ')
    : 'Nenhum colaborador cadastrado.';
  $('global-collaborator-result').hidden = false;
}));
$('global-collaborator-update-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Atualizando colaborador…', async () => {
    await api(`/api/platform/collaborators/${$('global-collaborator-id').value.trim()}`, 'PATCH', {
      targetTenantId: $('global-collaborator-target').value.trim(), active: $('global-collaborator-active').checked,
    });
    status('Disponibilidade do colaborador atualizada.');
  });
});
$('global-subject-create-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Adicionando matéria…', async () => {
    const ids = $('global-subject-collaborators').value.split(',').map(value => value.trim()).filter(Boolean);
    const subject = await api(`/api/platform/courses/${$('global-subject-course').value.trim()}/subjects`, 'POST', {
      targetTenantId: $('global-subject-target').value.trim(), name: $('global-subject-name').value,
      code: $('global-subject-code').value.trim(), workloadHours: Number($('global-subject-hours').value), collaboratorIds: ids,
    });
    status(`Matéria ${subject.name} adicionada ao PPC.`);
  });
});
$('global-subject-detail').addEventListener('click', event => void busy(event.currentTarget, 'Consultando PPC…', async () => {
  const course = await api('/api/platform/courses/detail', 'POST', { targetTenantId: $('global-subject-target').value.trim(),
    courseId: $('global-subject-course').value.trim() });
  $('global-subject-result').textContent = `${course.code} · ${course.name} — ${course.subjects.map(subject =>
    `${subject.code} ${subject.name} (${subject.workloadHours}h): ${subject.collaborators.map(value => value.personName).join(', ')}`).join(' | ') || 'PPC vazio'}`;
  $('global-subject-result').hidden = false;
}));
$('global-subject-update-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Atualizando matéria…', async () => {
    const input = { targetTenantId: $('global-subject-target').value.trim(), active: $('global-subject-active').checked };
    const name = $('global-subject-update-name').value.trim();
    const hours = $('global-subject-update-hours').value;
    const collaborators = $('global-subject-update-collaborators').value.trim();
    if (name) input.name = name;
    if (hours) input.workloadHours = Number(hours);
    if (collaborators) input.collaboratorIds = collaborators.split(',').map(value => value.trim()).filter(Boolean);
    await api(`/api/platform/courses/${$('global-subject-course').value.trim()}/subjects/${$('global-subject-update-id').value.trim()}`, 'PATCH', input);
    status('Matéria atualizada.');
  });
});
$('global-enrollment-create-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Criando matrícula…', async () => {
    const enrollment = await api('/api/platform/enrollments', 'POST', {
      targetTenantId: $('global-enrollment-target').value.trim(),
      courseId: $('global-enrollment-course').value.trim(), personId: $('global-enrollment-person').value.trim(),
    });
    status(`Matrícula criada para ${enrollment.personName}.`);
  });
});
$('global-enrollment-list').addEventListener('click', event => void busy(event.currentTarget, 'Consultando matrículas…', async () => {
  const statusFilter = $('global-enrollment-filter').value;
  const values = await api('/api/platform/enrollments/search', 'POST', {
    targetTenantId: $('global-enrollment-target').value.trim(), courseId: $('global-enrollment-course').value.trim(),
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  $('global-enrollment-result').textContent = values.length
    ? values.map(value => `${value.personName} · ${value.status} · ${value.id}`).join(' | ')
    : 'Nenhuma matrícula encontrada.';
  $('global-enrollment-result').hidden = false;
}));
$('global-enrollment-update-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Atualizando matrícula…', async () => {
    const value = await api(`/api/platform/courses/${$('global-enrollment-course').value.trim()}/enrollments/${$('global-enrollment-id').value.trim()}`, 'PATCH', {
      targetTenantId: $('global-enrollment-target').value.trim(), status: $('global-enrollment-status').value,
    });
    status(`Matrícula atualizada para ${value.status}.`);
  });
});
$('logout').addEventListener('click', event => void busy(event.currentTarget, 'Saindo…', async () => {
  await api('/api/session', 'DELETE'); showSession(null); status('Você saiu da sua conta.'); $('password').focus();
}));
$('create-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Cadastrando pessoa…', async () => {
    const input = { name: $('name').value, ...($('cpf').value.trim() ? { cpf: $('cpf').value.trim() } : {}),
      ...($('institutionalId').value.trim() ? { institutionalId: $('institutionalId').value.trim() } : {}) };
    const person = await api('/api/people', 'POST', input);
    $('create-form').reset(); showPerson(person); status('Pessoa cadastrada.');
  });
});
$('search-kind').addEventListener('change', () => {
  $('search-label').textContent = $('search-kind').value === 'cpf' ? 'CPF' : 'Identificador institucional';
  $('search-value').value = '';
});
$('search-form').addEventListener('submit', event => {
  event.preventDefault();
  void busy(event.submitter, 'Consultando pessoa…', async () => {
    const person = await api('/api/people/search', 'POST', { [$('search-kind').value]: $('search-value').value });
    showPerson(person); status(person ? 'Pessoa encontrada.' : 'Nenhuma pessoa encontrada.');
  });
});
$('audit-button').addEventListener('click', event => void busy(event.currentTarget, 'Consultando registro de criação…', async () => {
  const personId = currentPerson?.id;
  if (!personId) return;
  const events = await api(`/api/people/${personId}/audit`);
  if (currentPerson?.id !== personId) return;
  $('audit-result').textContent = events.length ? events.map(value => `Cadastro registrado em ${date(value.occurredAt)}. Conta autora: ${value.actorId}.`).join(' ')
    : 'Nenhum registro de criação encontrado.';
  $('audit-result').hidden = false; status('Consulta do registro de criação concluída.');
}));
api('/api/session').then(value => { showSession(value); status(''); }).catch(() => { if (!session) showSession(null); });
api('/api/platform/session').then(value => { showPlatformSession(value); status(''); }).catch(() => {});
