'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { assignInstitutionDocumentRoles, createInstitutionEmployee, deleteInstitutionLogo, deleteInstitutionEmployee,
  deleteEmployeeDocumentAsset, getInstitutionDocumentProfile, saveEmployeeDocumentAsset, saveInstitutionLogo, updateInstitutionEmployee,
  type InstitutionDocumentProfile, type InstitutionEmployee } from '../lib/institution-document-profile-api.ts';

function selectedFile(form: HTMLFormElement, name: string): File {
  const value = new FormData(form).get(name);
  if (!(value instanceof File) || value.size === 0) throw new Error('Selecione um arquivo de imagem.');
  return value;
}

async function createStampPng(institutionName: string, personName: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1000; canvas.height = 460;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Este navegador não conseguiu gerar o carimbo.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#173e50'; context.lineWidth = 8;
  context.beginPath(); context.ellipse(500, 230, 470, 190, 0, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 2; context.beginPath(); context.ellipse(500, 230, 450, 170, 0, 0, Math.PI * 2); context.stroke();
  context.fillStyle = '#173e50'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = 'bold 34px sans-serif'; context.fillText(institutionName.toLocaleUpperCase('pt-BR'), 500, 150, 820);
  context.font = 'bold 29px sans-serif'; context.fillText('FUNCIONÁRIO(A)', 500, 225, 820);
  context.font = '24px sans-serif'; context.fillText(personName, 500, 295, 820);
  context.font = '22px sans-serif'; context.fillText('QUADRO ADMINISTRATIVO', 500, 345, 820);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível gerar o carimbo PNG.')), 'image/png'));
}

export function InstitutionDocumentProfilePanel({ tenantId }: { readonly tenantId: string }) {
  const [profile, setProfile] = useState<InstitutionDocumentProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [directorId, setDirectorId] = useState('');
  const [recordsOfficerId, setRecordsOfficerId] = useState('');

  async function perform(action: () => Promise<InstitutionDocumentProfile | void>) {
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await action();
      if (updated) showProfile(updated);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }

  function showProfile(value: InstitutionDocumentProfile) {
    setProfile(value);
    setDirectorId(value.director?.id ?? '');
    setRecordsOfficerId(value.recordsOfficer?.id ?? '');
  }

  async function refresh() { showProfile(await getInstitutionDocumentProfile(tenantId)); }

  useEffect(() => {
    let cancelled = false;
    void getInstitutionDocumentProfile(tenantId).then(value => {
      if (cancelled) return;
      setProfile(value);
      setDirectorId(value.director?.id ?? '');
      setRecordsOfficerId(value.recordsOfficer?.id ?? '');
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Não foi possível consultar o perfil.');
    });
    return () => { cancelled = true; };
  }, [tenantId]);

  async function submitFile(event: FormEvent<HTMLFormElement>, save: (file: File) => Promise<InstitutionDocumentProfile>) {
    event.preventDefault();
    const form = event.currentTarget;
    await perform(async () => {
      const updated = await save(selectedFile(form, 'image'));
      form.reset(); setNotice('Imagem salva.'); return updated;
    });
  }

  const activeEmployees = profile?.employees.filter(value => value.active && value.administrative) ?? [];
  return <section className="stack" aria-label="Perfil documental da instituição">
    <div className="notice" role="status" aria-label="Prontidão documental">
      <strong>{profile?.readiness.ready ? 'Pronta para emissão de documentos' : 'Configuração documental incompleta'}</strong>
      {profile && !profile.readiness.ready && <p>Faltam: {profile.readiness.missing.map(item => ({ logo: 'marca institucional', director: 'diretor', recordsOfficer: 'responsável pelos registros', signature: 'assinatura PNG', stamp: 'carimbo PNG' }[item] ?? item)).join(', ')}.</p>}
    </div>
    <div className="form-grid">
      <div className="stack">
        <h3>Identidade do cabeçalho</h3>
        <p><strong>{profile?.name ?? 'Instituição'}</strong><br />Código: {profile?.code ?? '—'}</p>
        <p>O modelo padrão exibe o Selo Nacional à esquerda e a marca enviada pela instituição à direita.</p>
        <form className="stack" onSubmit={event => void submitFile(event, file => saveInstitutionLogo(tenantId, file))}>
          <label>Marca institucional (PNG ou SVG)<input name="image" type="file" accept="image/png,image/svg+xml,.png,.svg" required /></label>
          <button className="primary" disabled={busy}>Enviar ou substituir marca</button>
        </form>
        {profile?.logoConfigured && <><p className="muted">Marca configurada: {profile.logoMediaType === 'image/svg+xml' ? 'SVG' : 'PNG'}.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- a rota exige cookie de sessão; o otimizador Next não encaminha esta autenticação. */}
          <img alt={`Marca de ${profile.name}`} width="220" height="120"
            src={`/api/platform/institution/document-profile/logo?targetTenantId=${encodeURIComponent(tenantId)}`} style={{ objectFit: 'contain' }} />
          <button type="button" className="quiet" disabled={busy} onClick={() => void perform(async () => {
            await deleteInstitutionLogo(tenantId); setNotice('Marca institucional removida.'); return getInstitutionDocumentProfile(tenantId);
          })}>Remover marca</button>
        </>}
      </div>
      <div className="stack">
        <h3>Funcionários administrativos</h3>
        <form className="stack" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void perform(async () => { await createInstitutionEmployee(tenantId, String(data.get('personId') ?? '')); form.reset(); setNotice('Funcionário vinculado.'); await refresh(); }); }}>
          <label>ID da pessoa já cadastrada<input name="personId" required maxLength={100} /></label>
          <button className="secondary" disabled={busy}>Vincular funcionário administrativo</button>
        </form>
        {profile?.employees.map(employee => <EmployeeRow key={employee.id} tenantId={tenantId} institutionName={profile.name}
          employee={employee} busy={busy} onRun={perform} onNotice={setNotice} onUpdate={showProfile} onError={setError} />)}
      </div>
    </div>
    <fieldset className="stack">
      <legend>Direção e registros acadêmicos</legend>
      <label>Diretor<select aria-label="Diretor" value={directorId} onChange={event => setDirectorId(event.target.value)}>
        <option value="">Não designado</option>{activeEmployees.map(value => <option key={value.id} value={value.id}>{value.personName}</option>)}
      </select></label>
      <label>Responsável pelos registros acadêmicos<select aria-label="Responsável pelos registros acadêmicos" value={recordsOfficerId} onChange={event => setRecordsOfficerId(event.target.value)}>
        <option value="">Não designado</option>{activeEmployees.map(value => <option key={value.id} value={value.id}>{value.personName}</option>)}
      </select></label>
      <button className="primary" disabled={busy} onClick={() => void perform(async () => {
        const value = await assignInstitutionDocumentRoles(tenantId, { directorEmployeeId: directorId || null, recordsOfficerEmployeeId: recordsOfficerId || null });
        setNotice('Responsáveis institucionais atualizados.'); return value;
      })}>Salvar responsáveis</button>
      <p className="muted">O diretor e o responsável podem ser a mesma pessoa. Ambos precisam ser funcionários administrativos ativos.</p>
    </fieldset>
    <p className="muted">A assinatura PNG e o carimbo pertencem ao perfil individual de cada funcionário. A prontidão usa os ativos do responsável atual pelos registros acadêmicos.</p>
    <p className="muted">A assinatura digital do MVP é somente representativa. Ela não usa certificado nem verificação criptográfica; nos documentos, seu QR segue caminho distinto do QR de matrícula.</p>
    <div aria-live="polite">{error && <p role="alert" className="error">{error}</p>}{notice && <p role="status" className="notice">{notice}</p>}</div>
  </section>;
}

function EmployeeRow({ tenantId, institutionName, employee, busy, onRun, onNotice, onUpdate, onError }: {
  readonly tenantId: string; readonly institutionName: string; readonly employee: InstitutionEmployee; readonly busy: boolean;
  readonly onRun: (action: () => Promise<InstitutionDocumentProfile | void>) => Promise<void>;
  readonly onNotice: (message: string) => void;
  readonly onUpdate: (profile: InstitutionDocumentProfile) => void; readonly onError: (message: string) => void;
}) {
  return <article className="card stack" aria-label={`Funcionário ${employee.personName}`}>
    <strong>{employee.personName}</strong><small>{employee.id} · administrativo · {employee.active ? 'ativo' : 'inativo'}</small>
    <div className="form-grid">
      <form className="stack" onSubmit={event => {
        event.preventDefault(); const form = event.currentTarget;
        void onRun(async () => { const value = await saveEmployeeDocumentAsset(tenantId, employee.id, 'signature', selectedFile(form, 'signature'));
          form.reset(); onNotice('Assinatura PNG salva no perfil do funcionário.'); return value; });
      }}>
        <h4>Assinatura manuscrita</h4>
        <label>Assinatura do funcionário (PNG)<input name="signature" type="file" accept="image/png,.png" required disabled={!employee.active} /></label>
        <button className="secondary" disabled={busy || !employee.active}>Enviar assinatura PNG</button>
        <p className="muted">{employee.signatureConfigured ? 'Assinatura configurada neste funcionário.' : 'Nenhuma assinatura cadastrada.'}</p>
        {employee.signatureConfigured && <button type="button" className="quiet" disabled={busy} onClick={() => void onRun(async () => {
          await deleteEmployeeDocumentAsset(tenantId, employee.id, 'signature'); onNotice('Assinatura removida do perfil do funcionário.');
          return getInstitutionDocumentProfile(tenantId);
        })}>Remover assinatura</button>}
      </form>
      <div className="stack">
        <h4>Carimbo individual</h4>
        <p>Gera um carimbo PNG com a instituição e o nome deste funcionário.</p>
        <button className="secondary" disabled={busy || !employee.active} onClick={() => void onRun(async () => {
          const image = await createStampPng(institutionName, employee.personName);
          const value = await saveEmployeeDocumentAsset(tenantId, employee.id, 'stamp', image);
          onNotice('Carimbo PNG salvo no perfil do funcionário.'); return value;
        })}>Gerar e salvar carimbo PNG</button>
        <p className="muted">{employee.stampConfigured ? 'Carimbo configurado neste funcionário.' : 'Nenhum carimbo cadastrado.'}</p>
        {employee.stampConfigured && <button type="button" className="quiet" disabled={busy} onClick={() => void onRun(async () => {
          await deleteEmployeeDocumentAsset(tenantId, employee.id, 'stamp'); onNotice('Carimbo removido do perfil do funcionário.');
          return getInstitutionDocumentProfile(tenantId);
        })}>Remover carimbo</button>}
      </div>
    </div>
    <div className="inline-actions">
      <button className="quiet" disabled={busy} onClick={() => void updateInstitutionEmployee(tenantId, employee.id, !employee.active)
        .then(() => getInstitutionDocumentProfile(tenantId)).then(onUpdate).catch(cause => onError(cause instanceof Error ? cause.message : 'Falha ao atualizar funcionário.'))}>
        {employee.active ? 'Desativar' : 'Reativar'}
      </button>
      <button className="quiet" disabled={busy} onClick={() => void deleteInstitutionEmployee(tenantId, employee.id)
        .then(() => getInstitutionDocumentProfile(tenantId)).then(onUpdate).catch(cause => onError(cause instanceof Error ? cause.message : 'Falha ao remover funcionário.'))}>Remover</button>
    </div>
  </article>;
}
