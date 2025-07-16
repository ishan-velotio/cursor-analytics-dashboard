import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend } from 'recharts';
import { TeamMemberSpend, DailyUsageEntry } from '@/lib/cursor-api';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface CostAnalysisChartProps {
  spendingData: TeamMemberSpend[];
  usageData: DailyUsageEntry[];
  className?: string;
}

export function CostAnalysisChart({ spendingData, usageData, className }: CostAnalysisChartProps) {
  // Combine spending and usage data
  const combinedData = spendingData.map(spend => {
    const memberUsage = usageData.filter(usage => usage.email === spend.email);
    const totalLines = memberUsage.reduce((sum, usage) => sum + usage.totalLinesAdded, 0);
    const totalRequests = memberUsage.reduce((sum, usage) => 
      sum + usage.chatRequests + usage.composerRequests + usage.agentRequests, 0);
    
    const costPerLine = totalLines > 0 ? spend.spendCents / totalLines : 0;
    const costPerRequest = totalRequests > 0 ? spend.spendCents / totalRequests : 0;
    
    return {
      name: spend.name || spend.email.split('@')[0],
      email: spend.email,
      spendDollars: spend.spendCents / 100,
      spendCents: spend.spendCents,
      totalLines,
      totalRequests,
      costPerLine: costPerLine / 100, // Convert to dollars
      costPerRequest: costPerRequest / 100,
      premiumRequests: spend.fastPremiumRequests,
      efficiency: totalLines > 0 ? totalLines / (spend.spendCents / 100) : 0 // Lines per dollar
    };
  }).filter(item => item.spendCents > 0); // Only show users with spending

  // Sort by spending for top spenders chart
  const topSpenders = [...combinedData]
    .sort((a, b) => b.spendDollars - a.spendDollars)
    .slice(0, 20);

  // Cost efficiency data (spending vs productivity)
  const efficiencyData = combinedData
    .filter(item => item.totalLines > 0)
    .map(item => ({
      ...item,
      x: item.spendDollars,
      y: item.totalLines,
      z: item.efficiency
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Spending:</span> {formatCurrency(data.spendCents)}</p>
            <p><span className="font-medium">Lines of Code:</span> {formatNumber(data.totalLines)}</p>
            <p><span className="font-medium">AI Requests:</span> {formatNumber(data.totalRequests)}</p>
            <p><span className="font-medium">Cost per Line:</span> ${data.costPerLine.toFixed(4)}</p>
            <p><span className="font-medium">Lines per $:</span> {data.efficiency.toFixed(1)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Spending:</span> ${data.x.toFixed(2)}</p>
            <p><span className="font-medium">Lines of Code:</span> {formatNumber(data.y)}</p>
            <p><span className="font-medium">Efficiency:</span> {data.z.toFixed(1)} lines/$</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${className} space-y-8`}>
      {/* Top Spenders Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 20 Spenders</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topSpenders} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spendDollars" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost vs Productivity Scatter Plot */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost vs Productivity Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={efficiencyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Spending ($)" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Lines of Code" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter 
              dataKey="y" 
              fill="#10b981"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-2">
          Each point represents a team member. Higher and further right = more productive and higher spending.
          Points closer to the top-left represent better cost efficiency.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total Team Spending</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(combinedData.reduce((sum, item) => sum + item.spendCents, 0))}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Average Cost/Line</p>
          <p className="text-2xl font-bold text-green-900">
            ${(combinedData.reduce((sum, item) => sum + item.costPerLine, 0) / combinedData.length || 0).toFixed(4)}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Most Efficient</p>
          <p className="text-lg font-bold text-purple-900">
            {efficiencyData.sort((a, b) => b.efficiency - a.efficiency)[0]?.name || 'N/A'}
          </p>
          <p className="text-sm text-purple-700">
            {(efficiencyData.sort((a, b) => b.efficiency - a.efficiency)[0]?.efficiency || 0).toFixed(1)} lines/$
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-orange-600">Active Spenders</p>
          <p className="text-2xl font-bold text-orange-900">
            {combinedData.length}
          </p>
          <p className="text-sm text-orange-700">of {spendingData.length} total</p>
        </div>
      </div>
    </div>
  );
} 