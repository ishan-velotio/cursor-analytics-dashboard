/* eslint-disable @typescript-eslint/no-explicit-any */

// Export utilities for Cursor Analytics Dashboard - matching existing format

export type ExportFormat = 'csv' | 'json';

export type ExportDataType = 
  | 'summary-report'
  | 'team-members' 
  | 'spending'
  | 'daily-usage';

export interface ExportOptions {
  format: ExportFormat;
  dataType: ExportDataType;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  selectedTeam?: string;
  selectedMembers?: string[];
}

// Utility function to convert array of objects to CSV
function arrayToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// Generate timestamp for filename (matching existing format)
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Calculate date range in days
function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
}

// Summary Report Export (matching existing format)
export function prepareSummaryReportData(
  teamMembers: any[],
  dailyUsage: any[],
  spending: any[],
  dateRange: { startDate: Date; endDate: Date }
) {
  const periodDays = calculateDaysBetween(dateRange.startDate, dateRange.endDate);
  const activeMembers = dailyUsage.filter(entry => entry.isActive).length;
  const totalSpend = spending.reduce((sum, member) => sum + (member.spendCents || 0), 0) / 100;
  const totalLinesAdded = dailyUsage.reduce((sum, entry) => sum + (entry.totalLinesAdded || 0), 0);
  const totalAILinesAccepted = dailyUsage.reduce((sum, entry) => sum + (entry.acceptedLinesAdded || 0), 0);
  const totalRequests = dailyUsage.reduce((sum, entry) => 
    sum + (entry.composerRequests || 0) + (entry.chatRequests || 0) + (entry.agentRequests || 0), 0);
  const totalApplies = dailyUsage.reduce((sum, entry) => sum + (entry.totalApplies || 0), 0);
  const totalAccepts = dailyUsage.reduce((sum, entry) => sum + (entry.totalAccepts || 0), 0);
  const totalRejects = dailyUsage.reduce((sum, entry) => sum + (entry.totalRejects || 0), 0);
  const totalTabsShown = dailyUsage.reduce((sum, entry) => sum + (entry.totalTabsShown || 0), 0);
  const totalTabsAccepted = dailyUsage.reduce((sum, entry) => sum + (entry.totalTabsAccepted || 0), 0);

  const now = new Date();
  const reportDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const reportTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const csvData = {
    'Report Date': reportDate,
    'Report Time': reportTime,
    'Period Start': dateRange.startDate.toISOString().split('T')[0],
    'Period End': dateRange.endDate.toISOString().split('T')[0],
    'Period Days': periodDays,
    'Total Members': teamMembers.length,
    'Active Members': activeMembers,
    'Activity Rate': `${((activeMembers / teamMembers.length) * 100).toFixed(1)}%`,
    'Total Spend ($)': totalSpend.toFixed(2),
    'Avg Spend/Member ($)': (totalSpend / teamMembers.length).toFixed(2),
    'Avg Spend/Active Member ($)': activeMembers > 0 ? (totalSpend / activeMembers).toFixed(2) : '0.00',
    'Total Lines Added': totalLinesAdded,
    'AI Lines Accepted': totalAILinesAccepted,
    'AI Adoption Rate (%)': totalLinesAdded > 0 ? ((totalAILinesAccepted / totalLinesAdded) * 100).toFixed(2) : '0.00',
    'Total AI Requests': totalRequests,
    'Composer Requests': dailyUsage.reduce((sum, entry) => sum + (entry.composerRequests || 0), 0),
    'Chat Requests': dailyUsage.reduce((sum, entry) => sum + (entry.chatRequests || 0), 0),
    'Agent Requests': dailyUsage.reduce((sum, entry) => sum + (entry.agentRequests || 0), 0),
    'Total Applies': totalApplies,
    'Total Accepts': totalAccepts,
    'Total Rejects': totalRejects,
    'Overall Acceptance Rate (%)': totalApplies > 0 ? ((totalAccepts / totalApplies) * 100).toFixed(2) : '0.00',
    'Total Tabs Shown': totalTabsShown,
    'Total Tabs Accepted': totalTabsAccepted,
    'Tab Acceptance Rate (%)': totalTabsShown > 0 ? ((totalTabsAccepted / totalTabsShown) * 100).toFixed(2) : '0.00',
    'Total Usage Events': dailyUsage.length,
    'Sampled Usage Events': Math.min(100, dailyUsage.length)
  };

  const jsonData = {
    reportInfo: {
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.startDate.toISOString().split('T')[0],
        end: dateRange.endDate.toISOString().split('T')[0],
        days: periodDays
      }
    },
    teamMetrics: {
      totalMembers: teamMembers.length,
      activeMembers: activeMembers,
      activityRate: `${((activeMembers / teamMembers.length) * 100).toFixed(1)}%`
    },
    financialMetrics: {
      totalSpend: `$${totalSpend.toFixed(2)}`,
      averageSpendPerMember: `$${(totalSpend / teamMembers.length).toFixed(2)}`,
      averageSpendPerActiveMember: `$${activeMembers > 0 ? (totalSpend / activeMembers).toFixed(2) : '0.00'}`
    },
    productivityMetrics: {
      totalLinesAdded: totalLinesAdded,
      totalAILinesAccepted: totalAILinesAccepted,
      aiAdoptionRate: `${totalLinesAdded > 0 ? ((totalAILinesAccepted / totalLinesAdded) * 100).toFixed(2) : '0.00'}%`,
      totalRequests: totalRequests
    },
    usageEvents: {
      totalEvents: dailyUsage.length,
      sampledEvents: Math.min(100, dailyUsage.length)
    }
  };

  return { csvData: [csvData], jsonData };
}

// Team Members Export (matching existing format)
export function prepareTeamMembersData(data: any[]) {
  const csvData = data.map(member => ({
    'Name': member.name || '',
    'Email': member.email || '',
    'Role': member.role || 'member'
  }));

  const jsonData = {
    exportDate: new Date().toISOString(),
    totalMembers: data.length,
    members: data.map(member => ({
      name: member.name || '',
      email: member.email || '',
      role: member.role || 'member'
    }))
  };

  return { csvData, jsonData };
}

// Spending Export (matching existing format)
export function prepareSpendingData(data: any[]) {
  const csvData = data.map(member => ({
    'Name': member.name || member.memberName || '',
    'Email': member.email || '',
    'Role': member.role || 'member',
    'Spend ($)': ((member.spendCents || 0) / 100).toFixed(2),
    'Premium Requests': member.fastPremiumRequests || 0,
    'Cost per Request ($)': member.fastPremiumRequests > 0 ? 
      (((member.spendCents || 0) / 100) / member.fastPremiumRequests).toFixed(4) : '0.0000',
    'Limit Override ($)': member.hardLimitOverrideDollars || 5
  }));

  const jsonData = {
    exportDate: new Date().toISOString(),
    subscriptionCycleStart: new Date().toISOString(), // Use current date as fallback
    totalMembers: data.length,
    totalPages: 1,
    spending: data.map(member => ({
      name: member.name || member.memberName || '',
      email: member.email || '',
      role: member.role || 'member',
      spendDollars: ((member.spendCents || 0) / 100).toFixed(2),
      spendCents: member.spendCents || 0,
      fastPremiumRequests: member.fastPremiumRequests || 0,
      hardLimitOverrideDollars: member.hardLimitOverrideDollars || 5,
      costPerRequest: member.fastPremiumRequests > 0 ? 
        (((member.spendCents || 0) / 100) / member.fastPremiumRequests).toFixed(4) : '0.0000'
    }))
  };

  return { csvData, jsonData };
}

// Daily Usage Export (matching existing format)
export function prepareDailyUsageData(data: any[]) {
  const csvData = data.map(entry => ({
    'Date': entry.date || new Date(entry.date || Date.now()).toISOString().split('T')[0],
    'Email': entry.email || '',
    'Active': entry.isActive ? 'true' : 'false',
    'Lines Added': entry.totalLinesAdded || 0,
    'Lines Deleted': entry.totalLinesDeleted || 0,
    'AI Lines Added': entry.acceptedLinesAdded || 0,
    'AI Lines Deleted': entry.acceptedLinesDeleted || 0,
    'Total Applies': entry.totalApplies || 0,
    'Total Accepts': entry.totalAccepts || 0,
    'Total Rejects': entry.totalRejects || 0,
    'Acceptance Rate': entry.totalApplies > 0 ? 
      `${((entry.totalAccepts / entry.totalApplies) * 100).toFixed(2)}%` : '0%',
    'Tabs Shown': entry.totalTabsShown || 0,
    'Tabs Accepted': entry.totalTabsAccepted || 0,
    'Tab Acceptance Rate': entry.totalTabsShown > 0 ? 
      `${((entry.totalTabsAccepted / entry.totalTabsShown) * 100).toFixed(2)}%` : '0%',
    'Composer Requests': entry.composerRequests || 0,
    'Chat Requests': entry.chatRequests || 0,
    'Agent Requests': entry.agentRequests || 0,
    'Cmd+K Usage': entry.cmdkUsages || 0,
    'Subscription Requests': entry.subscriptionIncludedReqs || 0,
    'API Key Requests': entry.apiKeyReqs || 0,
    'Usage-Based Requests': entry.usageBasedReqs || 0,
    'Bugbot Usage': entry.bugbotUsages || 0,
    'Most Used Model': entry.mostUsedModel || 'N/A',
    'Apply Extension': entry.applyMostUsedExtension || 'N/A',
    'Tab Extension': entry.tabMostUsedExtension || 'N/A',
    'Client Version': entry.clientVersion || 'N/A'
  }));

  const jsonData = {
    exportDate: new Date().toISOString(),
    dateRange: {
      startDate: Math.min(...data.map(entry => new Date(entry.date || Date.now()).getTime())),
      endDate: Math.max(...data.map(entry => new Date(entry.date || Date.now()).getTime()))
    },
    totalRecords: data.length,
    data: data.map(entry => ({
      date: entry.date || new Date(entry.date || Date.now()).toISOString().split('T')[0],
      email: entry.email || '',
      isActive: entry.isActive || false,
      totalLinesAdded: entry.totalLinesAdded || 0,
      totalLinesDeleted: entry.totalLinesDeleted || 0,
      acceptedLinesAdded: entry.acceptedLinesAdded || 0,
      acceptedLinesDeleted: entry.acceptedLinesDeleted || 0,
      totalApplies: entry.totalApplies || 0,
      totalAccepts: entry.totalAccepts || 0,
      totalRejects: entry.totalRejects || 0,
      acceptanceRate: entry.totalApplies > 0 ? 
        `${((entry.totalAccepts / entry.totalApplies) * 100).toFixed(2)}%` : '0%',
      totalTabsShown: entry.totalTabsShown || 0,
      totalTabsAccepted: entry.totalTabsAccepted || 0,
      tabAcceptanceRate: entry.totalTabsShown > 0 ? 
        `${((entry.totalTabsAccepted / entry.totalTabsShown) * 100).toFixed(2)}%` : '0%',
      composerRequests: entry.composerRequests || 0,
      chatRequests: entry.chatRequests || 0,
      agentRequests: entry.agentRequests || 0,
      cmdkUsages: entry.cmdkUsages || 0,
      subscriptionIncludedReqs: entry.subscriptionIncludedReqs || 0,
      apiKeyReqs: entry.apiKeyReqs || 0,
      usageBasedReqs: entry.usageBasedReqs || 0,
      bugbotUsages: entry.bugbotUsages || 0,
      mostUsedModel: entry.mostUsedModel || 'N/A',
      applyMostUsedExtension: entry.applyMostUsedExtension || 'N/A',
      tabMostUsedExtension: entry.tabMostUsedExtension || 'N/A',
      clientVersion: entry.clientVersion || 'N/A'
    }))
  };

  return { csvData, jsonData };
}

// Main export function (matching existing format)
export async function exportData(
  teamMembers: any[],
  dailyUsage: any[],
  spending: any[],
  options: ExportOptions
): Promise<void> {
  const timestamp = generateTimestamp();
  let filename: string;
  let content: string;
  let mimeType: string;
  let fileExtension: string;

  // Process data based on type
  let processedData: any;
  switch (options.dataType) {
    case 'summary-report':
      processedData = prepareSummaryReportData(teamMembers, dailyUsage, spending, options.dateRange);
      filename = `summary-report_${timestamp}`;
      break;
    case 'team-members':
      processedData = prepareTeamMembersData(teamMembers);
      filename = `team-members_${timestamp}`;
      break;
    case 'spending':
      processedData = prepareSpendingData(spending);
      filename = `spending_${timestamp}`;
      break;
    case 'daily-usage':
      processedData = prepareDailyUsageData(dailyUsage);
      filename = `daily-usage_${timestamp}`;
      break;
    default:
      throw new Error(`Unknown export data type: ${options.dataType}`);
  }

  // Generate content based on format
  if (options.format === 'csv') {
    content = arrayToCSV(processedData.csvData);
    mimeType = 'text/csv;charset=utf-8;';
    fileExtension = 'csv';
  } else {
    content = JSON.stringify(processedData.jsonData, null, 2);
    mimeType = 'application/json;charset=utf-8;';
    fileExtension = 'json';
  }

  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.${fileExtension}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export format descriptions
export const EXPORT_FORMAT_INFO = {
  csv: {
    label: 'CSV',
    description: 'Comma-separated values for spreadsheet applications',
    icon: '📊'
  },
  json: {
    label: 'JSON',
    description: 'JavaScript Object Notation with metadata',
    icon: '📄'
  }
};

// Export data type descriptions (matching existing types)
export const EXPORT_DATA_TYPE_INFO = {
  'summary-report': {
    label: 'Summary Report',
    description: 'High-level team metrics and KPIs overview'
  },
  'team-members': {
    label: 'Team Members',
    description: 'Complete team member list with roles'
  },
  'spending': {
    label: 'Spending Data',
    description: 'Detailed cost breakdown by team member'
  },
  'daily-usage': {
    label: 'Daily Usage',
    description: 'Comprehensive daily usage metrics per member'
  }
}; 