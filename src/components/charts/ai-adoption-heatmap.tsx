import { useMemo } from 'react';
import { DailyUsageEntry, TeamMember } from '@/lib/cursor-api';
import { formatPercentage, calculatePercentage } from '@/lib/utils';

interface AIAdoptionHeatmapProps {
  usageData: DailyUsageEntry[];
  members: TeamMember[];
  className?: string;
}

interface MemberFeatureUsage {
  email: string;
  name: string;
  chatUsage: number;
  composerUsage: number;
  agentUsage: number;
  tabUsage: number;
  acceptanceRate: number;
  totalRequests: number;
  mostUsedModel: string;
}

export function AIAdoptionHeatmap({ usageData, members, className }: AIAdoptionHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Aggregate usage by member
    const memberStats = usageData.reduce((acc, entry) => {
      const email = entry.email || '';
      if (!email) return acc;

      if (!acc[email]) {
        const member = members.find(m => m.email === email);
        acc[email] = {
          email,
          name: member?.name || 'Unknown',
          chatUsage: 0,
          composerUsage: 0,
          agentUsage: 0,
          tabUsage: 0,
          totalAccepts: 0,
          totalApplies: 0,
          totalRequests: 0,
          mostUsedModel: '',
          modelCounts: {} as Record<string, number>
        };
      }

      acc[email].chatUsage += entry.chatRequests;
      acc[email].composerUsage += entry.composerRequests;
      acc[email].agentUsage += entry.agentRequests;
      acc[email].tabUsage += entry.totalTabsAccepted;
      acc[email].totalAccepts += entry.totalAccepts;
      acc[email].totalApplies += entry.totalApplies;
      acc[email].totalRequests += (entry.chatRequests + entry.composerRequests + entry.agentRequests);
      
      // Track model usage
      if (entry.mostUsedModel) {
        acc[email].modelCounts[entry.mostUsedModel] = (acc[email].modelCounts[entry.mostUsedModel] || 0) + 1;
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate percentages
    return Object.values(memberStats)
      .map((member: any) => {
        const mostUsedModel = Object.entries(member.modelCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

        return {
          email: member.email,
          name: member.name,
          chatUsage: member.chatUsage,
          composerUsage: member.composerUsage,
          agentUsage: member.agentUsage,
          tabUsage: member.tabUsage,
          acceptanceRate: calculatePercentage(member.totalAccepts, member.totalApplies),
          totalRequests: member.totalRequests,
          mostUsedModel
        } as MemberFeatureUsage;
      })
      .filter(member => member.totalRequests > 0) // Only show active users
      .sort((a, b) => b.totalRequests - a.totalRequests); // Sort by total usage
  }, [usageData, members]);

  // Calculate max values for normalization
  const maxValues = useMemo(() => ({
    chat: Math.max(...heatmapData.map(d => d.chatUsage)),
    composer: Math.max(...heatmapData.map(d => d.composerUsage)),
    agent: Math.max(...heatmapData.map(d => d.agentUsage)),
    tab: Math.max(...heatmapData.map(d => d.tabUsage)),
    acceptance: Math.max(...heatmapData.map(d => d.acceptanceRate))
  }), [heatmapData]);

  const getIntensityColor = (value: number, max: number) => {
    if (max === 0) return 'bg-gray-100';
    const intensity = value / max;
    if (intensity >= 0.8) return 'bg-blue-600';
    if (intensity >= 0.6) return 'bg-blue-500';
    if (intensity >= 0.4) return 'bg-blue-400';
    if (intensity >= 0.2) return 'bg-blue-300';
    if (intensity > 0) return 'bg-blue-200';
    return 'bg-gray-100';
  };

  const features = [
    { key: 'chatUsage', name: 'Chat', max: maxValues.chat },
    { key: 'composerUsage', name: 'Composer', max: maxValues.composer },
    { key: 'agentUsage', name: 'Agent', max: maxValues.agent },
    { key: 'tabUsage', name: 'Tab Completion', max: maxValues.tab },
    { key: 'acceptanceRate', name: 'Acceptance Rate', max: maxValues.acceptance, isPercentage: true }
  ];

  if (heatmapData.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center h-64 bg-gray-50 rounded-lg`}>
        <p className="text-gray-500">No usage data available for heatmap</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-3 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10 min-w-[200px]">
                Team Member
              </th>
              {features.map(feature => (
                <th key={feature.key} className="text-center p-3 font-medium text-gray-700 bg-gray-50 min-w-[120px]">
                  {feature.name}
                </th>
              ))}
              <th className="text-center p-3 font-medium text-gray-700 bg-gray-50 min-w-[120px]">
                Preferred Model
              </th>
            </tr>
          </thead>
          <tbody>
            {heatmapData.slice(0, 50).map((member, index) => ( // Show top 50 users
              <tr key={member.email} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 sticky left-0 z-10 bg-inherit border-r">
                  <div>
                    <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </td>
                
                {features.map(feature => {
                  const value = member[feature.key as keyof MemberFeatureUsage] as number;
                  const colorClass = getIntensityColor(value, feature.max);
                  
                  return (
                    <td key={feature.key} className="p-3 text-center">
                      <div 
                        className={`inline-flex items-center justify-center w-16 h-8 rounded text-xs font-medium ${colorClass} ${
                          colorClass.includes('bg-blue-') ? 'text-white' : 'text-gray-700'
                        }`}
                        title={`${feature.name}: ${feature.isPercentage ? formatPercentage(value) : value}`}
                      >
                        {feature.isPercentage ? formatPercentage(value, 0) : value}
                      </div>
                    </td>
                  );
                })}
                
                <td className="p-3 text-center">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {member.mostUsedModel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span>Intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>High</span>
        </div>
      </div>
      
      {heatmapData.length > 50 && (
        <p className="mt-2 text-sm text-gray-500">
          Showing top 50 most active users ({heatmapData.length} total active users)
        </p>
      )}
    </div>
  );
} 