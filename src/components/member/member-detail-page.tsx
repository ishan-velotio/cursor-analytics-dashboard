import { useState } from 'react';
import { ArrowLeft, User, TrendingUp, Brain, DollarSign, Calendar, Target } from 'lucide-react';
import { DailyUsageEntry, TeamMember, TeamMemberSpend } from '@/lib/cursor-api';
import { MetricCard } from '@/components/ui/metric-card';
import { ProductivityTrendChart } from '@/components/charts/productivity-trend-chart';
import { formatNumber, formatCurrency, formatPercentage, calculatePercentage } from '@/lib/utils';
import { format, subDays } from 'date-fns';

interface MemberDetailPageProps {
  member: TeamMember;
  usageData: DailyUsageEntry[];
  spendingData: TeamMemberSpend | undefined;
  allUsageData: DailyUsageEntry[]; // For team comparison
  onBack: () => void;
}

export function MemberDetailPage({ 
  member, 
  usageData, 
  spendingData, 
  allUsageData, 
  onBack 
}: MemberDetailPageProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Filter data by time range
  const filteredData = usageData.filter(entry => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = subDays(new Date(), days).getTime();
    return entry.date >= cutoff;
  });

  // Calculate member stats
  const memberStats = {
    totalLines: filteredData.reduce((sum, entry) => sum + entry.totalLinesAdded, 0),
    aiAssistedLines: filteredData.reduce((sum, entry) => sum + entry.acceptedLinesAdded, 0),
    totalRequests: filteredData.reduce((sum, entry) => 
      sum + entry.chatRequests + entry.composerRequests + entry.agentRequests, 0),
    totalAccepts: filteredData.reduce((sum, entry) => sum + entry.totalAccepts, 0),
    totalApplies: filteredData.reduce((sum, entry) => sum + entry.totalApplies, 0),
    activeDays: filteredData.filter(entry => entry.isActive).length,
    chatRequests: filteredData.reduce((sum, entry) => sum + entry.chatRequests, 0),
    composerRequests: filteredData.reduce((sum, entry) => sum + entry.composerRequests, 0),
    agentRequests: filteredData.reduce((sum, entry) => sum + entry.agentRequests, 0),
    tabsAccepted: filteredData.reduce((sum, entry) => sum + entry.totalTabsAccepted, 0),
    tabsShown: filteredData.reduce((sum, entry) => sum + entry.totalTabsShown, 0),
    cmdkUsages: filteredData.reduce((sum, entry) => sum + entry.cmdkUsages, 0),
  };

  // Calculate team averages for comparison
  const teamAverage = {
    linesPerMember: allUsageData.reduce((sum, entry) => sum + entry.totalLinesAdded, 0) / 
      new Set(allUsageData.map(entry => entry.email)).size,
    acceptanceRate: calculatePercentage(
      allUsageData.reduce((sum, entry) => sum + entry.totalAccepts, 0),
      allUsageData.reduce((sum, entry) => sum + entry.totalApplies, 0)
    ),
    requestsPerMember: allUsageData.reduce((sum, entry) => 
      sum + entry.chatRequests + entry.composerRequests + entry.agentRequests, 0) /
      new Set(allUsageData.map(entry => entry.email)).size
  };

  // Calculate derived metrics
  const aiAdoptionRate = calculatePercentage(memberStats.aiAssistedLines, memberStats.totalLines);
  const acceptanceRate = calculatePercentage(memberStats.totalAccepts, memberStats.totalApplies);
  const tabAcceptanceRate = calculatePercentage(memberStats.tabsAccepted, memberStats.tabsShown);
  const dailyAvgLines = memberStats.activeDays > 0 ? memberStats.totalLines / memberStats.activeDays : 0;
  const costPerLine = spendingData && memberStats.totalLines > 0 ? 
    spendingData.spendCents / memberStats.totalLines / 100 : 0;

  // Get most used model
  const mostUsedModel = filteredData
    .map(entry => entry.mostUsedModel)
    .filter(Boolean)
    .reduce((acc, model) => {
      acc[model!] = (acc[model!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const preferredModel = Object.entries(mostUsedModel)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

  // Performance comparison with team
  const performanceVsTeam = {
    productivity: memberStats.totalLines > teamAverage.linesPerMember ? 'above' : 'below',
    aiUsage: memberStats.totalRequests > teamAverage.requestsPerMember ? 'above' : 'below',
    efficiency: acceptanceRate > teamAverage.acceptanceRate ? 'above' : 'below'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {member.name || 'Unknown Name'}
                </h1>
                <p className="text-sm text-gray-600">{member.email} • {member.role}</p>
              </div>
            </div>
          </div>
          
          {/* Time Range Selector */}
          <div className="mt-4 flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Lines of Code"
            value={formatNumber(memberStats.totalLines)}
            subtitle={`${dailyAvgLines.toFixed(0)} per active day`}
            icon={TrendingUp}
            trend={performanceVsTeam.productivity === 'above' ? 
              { value: 15, isPositive: true } : undefined}
          />
          
          <MetricCard
            title="AI Assistance"
            value={formatPercentage(aiAdoptionRate)}
            subtitle={`${formatNumber(memberStats.aiAssistedLines)} AI-assisted lines`}
            icon={Brain}
          />
          
          <MetricCard
            title="AI Acceptance Rate"
            value={formatPercentage(acceptanceRate)}
            subtitle={`${memberStats.totalAccepts} of ${memberStats.totalApplies} applies`}
            icon={Target}
            trend={performanceVsTeam.efficiency === 'above' ? 
              { value: 8, isPositive: true } : undefined}
          />
          
          {spendingData && (
            <MetricCard
              title="Monthly Spending"
              value={formatCurrency(spendingData.spendCents)}
              subtitle={costPerLine > 0 ? `$${costPerLine.toFixed(4)} per line` : 'N/A'}
              icon={DollarSign}
            />
          )}
        </div>

        {/* Performance Comparison */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                performanceVsTeam.productivity === 'above' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {performanceVsTeam.productivity === 'above' ? '↗' : '↘'} Productivity
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatNumber(memberStats.totalLines)} vs {formatNumber(teamAverage.linesPerMember)} team avg
              </p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                performanceVsTeam.aiUsage === 'above' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {performanceVsTeam.aiUsage === 'above' ? '↗' : '↘'} AI Usage
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatNumber(memberStats.totalRequests)} vs {formatNumber(teamAverage.requestsPerMember)} team avg
              </p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                performanceVsTeam.efficiency === 'above' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {performanceVsTeam.efficiency === 'above' ? '↗' : '↘'} Efficiency
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatPercentage(acceptanceRate)} vs {formatPercentage(teamAverage.acceptanceRate)} team avg
              </p>
            </div>
          </div>
        </div>

        {/* Feature Usage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Feature Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chat Requests</span>
                <span className="font-medium">{formatNumber(memberStats.chatRequests)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Composer Requests</span>
                <span className="font-medium">{formatNumber(memberStats.composerRequests)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Agent Requests</span>
                <span className="font-medium">{formatNumber(memberStats.agentRequests)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tab Completions</span>
                <span className="font-medium">
                  {formatNumber(memberStats.tabsAccepted)} ({formatPercentage(tabAcceptanceRate)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cmd+K Usage</span>
                <span className="font-medium">{formatNumber(memberStats.cmdkUsages)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences & Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Preferred AI Model</span>
                <span className="font-medium">{preferredModel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Days</span>
                <span className="font-medium">
                  {memberStats.activeDays} of {filteredData.length} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Activity Rate</span>
                <span className="font-medium">
                  {formatPercentage(calculatePercentage(memberStats.activeDays, filteredData.length))}
                </span>
              </div>
              {spendingData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Premium Requests</span>
                    <span className="font-medium">{formatNumber(spendingData.fastPremiumRequests)}</span>
                  </div>
                  {costPerLine > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cost Efficiency</span>
                      <span className="font-medium">{(1/costPerLine).toFixed(0)} lines/$</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Productivity Trend Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productivity Trends</h2>
          <ProductivityTrendChart data={filteredData} />
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {performanceVsTeam.productivity === 'above' && (
                  <li>• Above-average code productivity</li>
                )}
                {performanceVsTeam.efficiency === 'above' && (
                  <li>• High AI acceptance rate (efficient AI usage)</li>
                )}
                {acceptanceRate > 80 && (
                  <li>• Excellent AI suggestion acceptance</li>
                )}
                {memberStats.activeDays / filteredData.length > 0.8 && (
                  <li>• Consistent daily activity</li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Growth Opportunities</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {memberStats.chatRequests < 10 && (
                  <li>• Consider using Chat feature more for complex problems</li>
                )}
                {memberStats.composerRequests < 5 && (
                  <li>• Try Composer for larger code changes</li>
                )}
                {tabAcceptanceRate < 50 && (
                  <li>• Review tab completion suggestions more carefully</li>
                )}
                {performanceVsTeam.productivity === 'below' && (
                  <li>• Explore AI features to boost productivity</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 