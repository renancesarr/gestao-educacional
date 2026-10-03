import { InstitutionJourney } from '../../../components/institution-journey.tsx';

export default async function InstitutionPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <InstitutionJourney tenantId={decodeURIComponent(tenantId)} />;
}
