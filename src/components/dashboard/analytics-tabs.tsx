import { useState } from 'react';
import { Users, DollarSign, TrendingUp, Brain, Target } from 'lucide-react';
import { ProductivityTrendChart } from '@/components/charts/productivity-trend-chart';
import { AIAdoptionHeatmap } from '@/components/charts/ai-adoption-heatmap';
import { CostAnalysisChart } from '@/components/charts/cost-analysis-chart';
import { MemberDetailPage } from '@/components/member/member-detail-page';
import { DailyUsageEntry, TeamMember, TeamMemberSpend } from '@/lib/cursor-api';

interface AnalyticsTabsProps {
  dailyUsageData: DailyUsageEntry[];
  teamMembers: TeamMember[];
  spendingData: TeamMemberSpend[];
  className?: string;
}

type TabType = 'trends' | 'heatmap' | 'costs' | 'members' | 'insights';

export function AnalyticsTabs({ 
  dailyUsageData, 
  teamMembers, 
  spendingData, 
  className 
}: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('trends');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const tabs = [
    {
      id: 'trends' as TabType,
      name: 'Productivity Trends',
      icon: TrendingUp,
      description: 'Daily productivity and activity patterns'
    },
    {
      id: 'heatmap' as TabType,
      name: 'AI Adoption Heatmap',
      icon: Brain,
      description: 'Feature usage across team members'
    },
    {
      id: 'costs' as TabType,
      name: 'Cost Analysis',
      icon: DollarSign,
      description: 'Spending patterns and ROI analysis'
    },
    {
      id: 'members' as TabType,
      name: 'Team Directory',
      icon: Users,
      description: 'Individual member analytics'
    },
    {
      id: 'insights' as TabType,
      name: 'Insights',
      icon: Target,
      description: 'AI-powered recommendations'
    }
  ];

  // If viewing individual member, show member detail page
  if (selectedMember) {
    const memberUsageData = dailyUsageData.filter(entry => entry.email === selectedMember.email);
    const memberSpendingData = spendingData.find(spend => spend.email === selectedMember.email);
    
    return (
      <MemberDetailPage
        member={selectedMember}
        usageData={memberUsageData}
        spendingData={memberSpendingData}
        allUsageData={dailyUsageData}
        onBack={() => setSelectedMember(null)}
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trends':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Productivity Over Time</h3>
              <p className="text-sm text-gray-600 mb-4">
                Track daily productivity metrics, AI usage, and team activity patterns
              </p>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <ProductivityTrendChart data={dailyUsageData} />
              </div>
            </div>
          </div>
        );

      case 'heatmap':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Feature Adoption Heatmap</h3>
              <p className="text-sm text-gray-600 mb-4">
                Visual representation of AI feature usage intensity across team members
              </p>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <AIAdoptionHeatmap 
                  usageData={dailyUsageData} 
                  members={teamMembers}
                />
              </div>
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost Analysis & ROI</h3>
              <p className="text-sm text-gray-600 mb-4">
                Analyze spending patterns, cost efficiency, and return on AI investment
              </p>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <CostAnalysisChart 
                  spendingData={spendingData}
                  usageData={dailyUsageData}
                />
              </div>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Directory</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click on any team member to view their detailed analytics and insights
              </p>
              
              {/* Active Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teamMembers
                  .filter(member => 
                    dailyUsageData.some(entry => 
                      entry.email === member.email && entry.isActive
                    )
                  )
                  .sort((a, b) => {
                    const aUsage = dailyUsageData
                      .filter(entry => entry.email === a.email)
                      .reduce((sum, entry) => sum + entry.totalLinesAdded, 0);
                    const bUsage = dailyUsageData
                      .filter(entry => entry.email === b.email)
                      .reduce((sum, entry) => sum + entry.totalLinesAdded, 0);
                    return bUsage - aUsage;
                  })
                  .slice(0, 50) // Show top 50 active members
                  .map(member => {
                    const memberUsage = dailyUsageData.filter(entry => entry.email === member.email);
                    const totalLines = memberUsage.reduce((sum, entry) => sum + entry.totalLinesAdded, 0);
                    const totalRequests = memberUsage.reduce((sum, entry) => 
                      sum + entry.chatRequests + entry.composerRequests + entry.agentRequests, 0);
                    const memberSpending = spendingData.find(spend => spend.email === member.email);
                    
                    return (
                      <button
                        key={member.email}
                        onClick={() => setSelectedMember(member)}
                        className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {(member.name || member.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {member.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{member.role}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lines:</span>
                            <span className="font-medium">{totalLines.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">AI Requests:</span>
                            <span className="font-medium">{totalRequests}</span>
                          </div>
                          {memberSpending && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Spending:</span>
                              <span className="font-medium">${(memberSpending.spendCents / 100).toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
              
              {teamMembers.length > 50 && (
                <p className="text-sm text-gray-500 mt-4">
                  Showing top 50 most active members ({teamMembers.length} total team members)
                </p>
              )}
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automated analysis and recommendations based on your team&apos;s usage patterns
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">🏆 Top Performers</h4>
                  <div className="space-y-3">
                    {teamMembers
                      .map(member => ({
                        ...member,
                        productivity: dailyUsageData
                          .filter(entry => entry.email === member.email)
                          .reduce((sum, entry) => sum + entry.totalLinesAdded, 0)
                      }))
                      .sort((a, b) => b.productivity - a.productivity)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.email} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{member.productivity.toLocaleString()} lines</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* AI Adoption Leaders */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">🧠 AI Adoption Leaders</h4>
                  <div className="space-y-3">
                    {teamMembers
                      .map(member => ({
                        ...member,
                        aiUsage: dailyUsageData
                          .filter(entry => entry.email === member.email)
                          .reduce((sum, entry) => 
                            sum + entry.chatRequests + entry.composerRequests + entry.agentRequests, 0)
                      }))
                      .sort((a, b) => b.aiUsage - a.aiUsage)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.email} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{member.aiUsage} AI requests</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Cost Efficiency */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">💡 Cost Efficiency</h4>
                  <div className="space-y-3">
                    {spendingData
                      .map(spend => {
                        const memberUsage = dailyUsageData.filter(entry => entry.email === spend.email);
                        const totalLines = memberUsage.reduce((sum, entry) => sum + entry.totalLinesAdded, 0);
                        return {
                          ...spend,
                          efficiency: totalLines > 0 ? totalLines / (spend.spendCents / 100) : 0
                        };
                      })
                      .sort((a, b) => b.efficiency - a.efficiency)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.email} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{member.efficiency.toFixed(0)} lines per $</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">🎯 Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Consider AI training for low-adoption team members</p>
                    <p>• Review cost efficiency with top spenders</p>
                    <p>• Share best practices from top performers</p>
                    <p>• Monitor acceptance rates for optimization</p>
                    <p>• Evaluate feature usage for team training</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
} 