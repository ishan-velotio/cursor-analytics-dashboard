import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { DailyUsageEntry } from '@/lib/cursor-api';
import { formatNumber } from '@/lib/utils';

interface ProductivityTrendChartProps {
  data: DailyUsageEntry[];
  className?: string;
}

export function ProductivityTrendChart({ data, className }: ProductivityTrendChartProps) {
  // Group data by date and calculate daily totals
  const chartData = data.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.date), 'MMM dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        totalLines: 0,
        aiAssisted: 0,
        requests: 0,
        activeUsers: 0,
        acceptanceRate: 0,
        acceptanceCount: 0,
        applyCount: 0
      };
    }
    
    acc[dateKey].totalLines += entry.totalLinesAdded;
    acc[dateKey].aiAssisted += entry.acceptedLinesAdded;
    acc[dateKey].requests += (entry.chatRequests + entry.composerRequests + entry.agentRequests);
    acc[dateKey].activeUsers += entry.isActive ? 1 : 0;
    acc[dateKey].acceptanceCount += entry.totalAccepts;
    acc[dateKey].applyCount += entry.totalApplies;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate acceptance rate and convert to array
  const chartArray = Object.values(chartData).map((day: any) => ({
    ...day,
    acceptanceRate: day.applyCount > 0 ? (day.acceptanceCount / day.applyCount * 100) : 0,
    aiAdoptionRate: day.totalLines > 0 ? (day.aiAssisted / day.totalLines * 100) : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {entry.dataKey.includes('Rate') ? 
                `${entry.value.toFixed(1)}%` : 
                formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartArray} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Line 
            type="monotone" 
            dataKey="totalLines" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Lines of Code"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="aiAssisted" 
            stroke="#10b981" 
            strokeWidth={2}
            name="AI Assisted Lines"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="requests" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="AI Requests"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="activeUsers" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            name="Active Users"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 