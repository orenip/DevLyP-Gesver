import { SummaryCards } from '@/components/summary/summary-cards';
import { fetchSummaryData } from '@/lib/data';

export default async function SummaryPage() {
  const summaryData = await fetchSummaryData();
  
  return (
    <div className="space-y-6">
      <SummaryCards data={summaryData} />
    </div>
  );
}
