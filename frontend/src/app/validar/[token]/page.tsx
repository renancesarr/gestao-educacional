'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { validateCredential, type PublicCredential } from '../../../lib/credential-api.ts';

export default function ValidateCredentialPage({ params }: { params: Promise<{ token: string }> }) {
  const [credential, setCredential] = useState<PublicCredential | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void params.then(({ token }) => validateCredential(token)).then(value => {
      if (active) setCredential(value);
    }).catch(() => { if (active) setInvalid(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params]);
  return <main className="workspace"><header className="topbar"><Link className="brand" href="/">Gestão Educacional</Link></header>
    <section className="card stack"><span className="eyebrow">VALIDAÇÃO PÚBLICA</span><h1>Credencial acadêmica</h1>
      {loading ? <p>Consultando credencial…</p> : credential ? <>
        <p className="notice" role="status">Documento demonstrativo · credencial válida</p>
        <dl><dt>Titular</dt><dd>{credential.holderName}</dd><dt>Instituição</dt><dd>{credential.institutionName}</dd>
          <dt>Curso</dt><dd>{credential.courseName}</dd><dt>Tipo</dt><dd>{credential.type}</dd>
          <dt>Data de emissão</dt><dd>{credential.issuedOn}</dd></dl>
        <p className="muted">Esta consulta não declara validade oficial nem assinatura digital real.</p>
      </> : invalid ? <p className="error" role="alert">Credencial inválida, excluída ou com link anterior à última edição.</p> : null}
    </section></main>;
}
