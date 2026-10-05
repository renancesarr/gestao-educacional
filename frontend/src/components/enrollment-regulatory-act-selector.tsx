'use client';

import { useEffect, useState } from 'react';
import { listRegulatoryActs, type RegulatoryAct, type RegulatoryActTarget } from '../lib/regulatory-acts-api.ts';

export type EnrollmentActChoice = { readonly target: RegulatoryActTarget; readonly actId: string | null; readonly versionId: string | null;
  readonly text: string | null; readonly status: 'ativo' | 'vencido' | 'suspenso' | 'revogado' | 'ausente'; readonly versionNumber: number | null };

export function EnrollmentRegulatoryActSelector({ tenantId, courseId, onChoice }:
  { readonly tenantId: string; readonly courseId: string; readonly onChoice: (target: RegulatoryActTarget, choice: EnrollmentActChoice | null) => void }) {
  const [institutionActs, setInstitutionActs] = useState<readonly RegulatoryAct[]>([]);
  const [courseActs, setCourseActs] = useState<readonly RegulatoryAct[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    void Promise.all([
      listRegulatoryActs(tenantId, { target: 'institution' }),
      listRegulatoryActs(tenantId, { target: 'course', courseId }),
    ]).then(([institution, course]) => {
      if (!current) return;
      setInstitutionActs(institution); setCourseActs(course); setError('');
    }).catch(cause => {
      if (current) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os atos regulatórios.');
    });
    return () => { current = false; };
  }, [tenantId, courseId]);

  return <fieldset className="stack" aria-label="Atos regulatórios da matrícula">
    <legend>Atos regulatórios usados na matrícula</legend>
    <ActVersionSelect target="institution" acts={institutionActs} onChoice={onChoice} />
    <ActVersionSelect target="course" acts={courseActs} onChoice={onChoice} />
    {error && <p role="alert" className="error">{error}</p>}
    <p className="muted">Selecione a versão do ato da instituição e do curso que será registrada nesta matrícula.</p>
    {(institutionActs.length === 0 || courseActs.length === 0) && <p role="alert" className="error">Não há ato cadastrado para um ou mais alvos. A matrícula exigirá confirmação e justificativa.</p>}
  </fieldset>;
}

function ActVersionSelect({ target, acts, onChoice }: { readonly target: RegulatoryActTarget;
  readonly acts: readonly RegulatoryAct[]; readonly onChoice: (target: RegulatoryActTarget, choice: EnrollmentActChoice | null) => void }) {
  const label = target === 'institution' ? 'Ato regulatório da instituição' : 'Ato regulatório do curso';
  const versions = acts.flatMap(act => act.versions.map(version => ({ act, version })));
  return <label>{label}<select name={`${target}ActVersion`} required defaultValue="" onChange={event => {
    const selected = versions.find(({ act, version }) => `${act.id}:${version.id}` === event.target.value);
    if (selected) onChoice(target, { target, actId: selected.act.id, versionId: selected.version.id,
      text: selected.version.text, status: selected.version.status, versionNumber: selected.version.number });
    else if (event.target.value === 'none') onChoice(target, { target, actId: null, versionId: null, text: null,
      status: 'ausente', versionNumber: null });
    else onChoice(target, null);
  }}>
    <option value="">Selecione um ato e sua versão</option>
    <option value="none">Nenhum ato regulatório</option>
    {versions.map(({ act, version }) => <option key={`${act.id}:${version.id}`} value={`${act.id}:${version.id}`}>
      {version.text} · versão {version.number} · {version.status}
    </option>)}
  </select></label>;
}
