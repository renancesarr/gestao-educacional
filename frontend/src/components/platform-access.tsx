'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { beginPlatformActivation, beginPlatformLogin, createInstitution, getPlatformSession,
  type InstitutionScope, type PlatformSession, verifyPlatformActivation, verifyPlatformLogin } from '../lib/platform-auth.ts';

const scopes: Array<{ title: string; value: InstitutionScope }> = [
  { title: 'Ensino Fundamental', value: { level: 'BASIC', stage: 'FUNDAMENTAL' } },
  { title: 'EJA · Ensino Fundamental', value: { level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA' } },
  { title: 'Ensino Médio', value: { level: 'BASIC', stage: 'MEDIO' } },
  { title: 'EJA · Ensino Médio', value: { level: 'BASIC', stage: 'MEDIO', modality: 'EJA' } },
  { title: 'Educação Profissional Técnica de nível médio', value: { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' } },
  { title: 'Graduação', value: { level: 'HIGHER', courseType: 'GRADUACAO' } },
];

export function PlatformAccess() {
  const router = useRouter();
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'login' | 'activation'>('login');
  const [tenantId, setTenantId] = useState('');
  const [created, setCreated] = useState<{ tenantId: string; name: string } | null>(null);

  useEffect(() => { getPlatformSession().then(setSession).catch(() => setSession(null)).finally(() => setLoading(false)); }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  async function authenticate(event: FormEvent<HTMLFormElement>, activation: boolean) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const username = String(data.get('username') ?? '').trim();
    await run(async () => {
      const options = activation
        ? await beginPlatformActivation(username, String(data.get('activationCode') ?? ''))
        : await beginPlatformLogin(username);
      const response = activation ? await startRegistration({ optionsJSON: options as never }) : await startAuthentication({ optionsJSON: options as never });
      const principal = activation ? await verifyPlatformActivation(username, response) : await verifyPlatformLogin(username, response);
      setSession(principal); setNotice('Acesso à plataforma autorizado.');
    });
  }
  async function submitInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const educationScope = scopes.filter((_, index) => data.get(`scope-${index}`) === 'on').map(item => item.value);
    await run(async () => {
      if (!educationScope.length) throw new Error('Selecione ao menos um item do escopo educacional.');
      const value = await createInstitution({ code: String(data.get('code')), name: String(data.get('name')),
        username: String(data.get('username')), password: String(data.get('password')), educationScope });
      setCreated({ tenantId: value.tenantId, name: value.name }); setTenantId(value.tenantId);
      setNotice(`Instituição ${value.name} criada.`); event.currentTarget.reset();
    });
  }

  if (loading) return <main className="center"><p role="status">Verificando sessão…</p></main>;
  if (!session) return <main className="access-layout"><div className="access-intro"><span className="eyebrow">GESTÃO EDUCACIONAL</span><h1>Organize a vida acadêmica da sua instituição.</h1><p>Entre como operador da plataforma para configurar instituições, cursos e matrículas.</p><p><Link href="/consulta-publica-alunos">Consultar alunos publicamente</Link></p></div><section className="card access-card">
    <h2>Acesso da plataforma</h2><div className="tabs" role="tablist"><button role="tab" aria-selected={tab === 'login'} onClick={() => setTab('login')}>Entrar com passkey</button><button role="tab" aria-selected={tab === 'activation'} onClick={() => setTab('activation')}>Ativar conta</button></div>
    <form onSubmit={event => void authenticate(event, tab === 'activation')} className="stack">
      <label>Nome de usuário<input required name="username" autoComplete="username webauthn" /></label>
      {tab === 'activation' && <label>Código de ativação de uso único<input required name="activationCode" autoComplete="one-time-code" /></label>}
      <button className="primary" disabled={busy}>{busy ? 'Aguarde…' : tab === 'login' ? 'Continuar com passkey' : 'Ativar e cadastrar passkey'}</button>
    </form>
    <Feedback error={error} notice={notice} />
    <p className="muted">A conta global é provisionada pelo operador local.</p>
  </section></main>;

  return <main className="workspace"><header className="topbar"><Link className="brand" href="/">Gestão Educacional</Link><div><span>Operador · {session.username}</span><button className="quiet" onClick={() => void run(async () => { const { logoutPlatformSession } = await import('../lib/platform-auth.ts'); await logoutPlatformSession(); setSession(null); })}>Sair</button></div></header>
    <div className="page-heading"><span className="eyebrow">SUPER_ADMIN</span><h1>Configuração institucional</h1><p>Comece criando uma instituição ou abra uma pelo ID interno.</p><p><Link className="button-link" href="/public-catalog">Catálogo público do INEP</Link></p></div>
    <div className="setup-grid"><section className="card"><h2>Criar instituição</h2><form className="stack" onSubmit={event => void submitInstitution(event)}>
      <div className="two-col"><label>Nome da instituição<input name="name" required maxLength={200} /></label><label>Código institucional<input name="code" required minLength={2} maxLength={100} pattern="[a-z0-9][a-z0-9-]{1,99}" /></label></div>
      <fieldset><legend>Escopo de ensino</legend><div className="scope-grid">{scopes.map((item, index) => <label className="check" key={item.title}><input type="checkbox" name={`scope-${index}`} />{item.title}</label>)}</div></fieldset>
      <h3>Primeira conta institucional</h3><div className="two-col"><label>Usuário administrador<input name="username" required autoComplete="username" /></label><label>Senha inicial<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label></div>
      <button className="primary" disabled={busy}>{busy ? 'Criando…' : 'Criar instituição'}</button>
    </form></section>
    <aside className="card"><h2>Abrir instituição existente</h2><p className="muted">Informe o ID interno informado no cadastro. O sistema não oferece uma lista global de instituições.</p><form className="stack" onSubmit={event => { event.preventDefault(); if (tenantId.trim()) router.push(`/institutions/${encodeURIComponent(tenantId.trim())}`); }}><label>ID interno da instituição<input required value={tenantId} onChange={event => setTenantId(event.target.value)} /></label><button className="secondary">Continuar</button></form>
      {created && <div className="created-box" role="status"><strong>{created.name} criada.</strong><p>ID interno: <code>{created.tenantId}</code></p><a className="button-link" href={`/institutions/${encodeURIComponent(created.tenantId)}`}>Configurar instituição</a></div>}
      <Feedback error={error} notice={notice} /></aside></div>
  </main>;
}

function Feedback({ error, notice }: { error: string; notice: string }) { return <div aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</div>; }
