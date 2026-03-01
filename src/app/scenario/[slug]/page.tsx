import ScenarioEngine from '@/components/scenario-engine'

export default async function ScenarioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ScenarioEngine slug={slug} />
}
