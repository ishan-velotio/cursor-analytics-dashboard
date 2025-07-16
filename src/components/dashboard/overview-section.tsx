import { Users, Activity, DollarSign, TrendingUp, Brain, Code } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { formatNumber, formatCurrency, formatPercentage, calculatePercentage } from '@/lib/utils';
import { DailyUsageEntry, TeamMemberSpend } from '@/lib/cursor-api';

interface OverviewSectionProps {
  teamSize: number;
  dailyUsageData: DailyUsageEntry[];
  spendingData: TeamMemberSpend[];
  isLoading?: boolean;
}

export function OverviewSection({ 
  teamSize, 
  dailyUsageData, 
  spendingData, 
  isLoading 
}: OverviewSectionProps) {
  // Calculate key metrics
  const activeMembers = dailyUsageData.filter(entry => entry.isActive).length;
  const totalSpend = spendingData.reduce((sum, member) => sum + member.spendCents, 0);
  const totalLinesAdded = dailyUsageData.reduce((sum, entry) => sum + entry.totalLinesAdded, 0);
  const totalAILinesAccepted = dailyUsageData.reduce((sum, entry) => sum + entry.acceptedLinesAdded, 0);
  const totalAIRequests = dailyUsageData.reduce((sum, entry) => 
    sum + entry.chatRequests + entry.composerRequests + entry.agentRequests, 0
  );
  const totalAccepts = dailyUsageData.reduce((sum, entry) => sum + entry.totalAccepts, 0);
  const totalApplies = dailyUsageData.reduce((sum, entry) => sum + entry.totalApplies, 0);

  const aiAdoptionRate = calculatePercentage(totalAILinesAccepted, totalLinesAdded);
  const aiAcceptanceRate = calculatePercentage(totalAccepts, totalApplies);
  const activityRate = calculatePercentage(activeMembers, teamSize);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Team Members"
        value={formatNumber(teamSize)}
        subtitle={`${activeMembers} active (${formatPercentage(activityRate)})`}
        icon={Users}
      />
      
      <MetricCard
        title="Monthly Spending"
        value={formatCurrency(totalSpend)}
        subtitle={`$${(totalSpend / 100 / teamSize).toFixed(2)} per member`}
        icon={DollarSign}
      />
      
      <MetricCard
        title="Lines of Code"
        value={formatNumber(totalLinesAdded)}
        subtitle={`${formatNumber(totalAILinesAccepted)} AI-assisted (${formatPercentage(aiAdoptionRate)})`}
        icon={Code}
      />
      
      <MetricCard
        title="AI Requests"
        value={formatNumber(totalAIRequests)}
        subtitle="Chat, Composer & Agent requests"
        icon={Brain}
      />
      
      <MetricCard
        title="AI Acceptance Rate"
        value={formatPercentage(aiAcceptanceRate)}
        subtitle={`${formatNumber(totalAccepts)} of ${formatNumber(totalApplies)} applies`}
        icon={TrendingUp}
      />
      
      <MetricCard
        title="Team Activity"
        value={formatPercentage(activityRate)}
        subtitle={`${activeMembers} of ${teamSize} members active`}
        icon={Activity}
      />
    </div>
  );
} 