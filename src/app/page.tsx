'use client';

import { useState, useMemo } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Providers } from './providers';
import { DateRangePicker, DateRange } from '@/components/ui/date-range-picker';
import { TeamMemberSelector } from '@/components/ui/team-member-selector';
import { TeamSelector } from '@/components/ui/team-selector';
import { TeamManagement } from '@/components/teams/team-management';
import { ExportButton } from '@/components/ui/export-button';
import { OverviewSection } from '@/components/dashboard/overview-section';
import { AnalyticsTabs } from '@/components/dashboard/analytics-tabs';
import { 
  useTeamMembers, 
  useDailyUsage, 
  useSpending, 
  useUsageEvents,
  useDefaultDateRange,
  useAPIConnection 
} from '@/hooks/useCursorData';
import { useTeamMembers as useTeamMembersList } from '@/hooks/useTeams';

function DashboardContent() {
  const { startDate: defaultStartDate, endDate: defaultEndDate } = useDefaultDateRange();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);

  // API queries
  const { data: connectionTest, isLoading: isTestingConnection } = useAPIConnection();
  const { data: teamMembers, isLoading: isLoadingMembers, error: membersError } = useTeamMembers();
  const { data: dailyUsage, isLoading: isLoadingUsage, error: usageError } = useDailyUsage(
    dateRange.startDate, 
    dateRange.endDate,
    !!teamMembers
  );
  const { data: spending, isLoading: isLoadingSpending, error: spendingError } = useSpending();
  const { data: usageEvents, isLoading: isLoadingEvents } = useUsageEvents(
    dateRange.startDate,
    dateRange.endDate,
    !!teamMembers
  );
  
  // Team members hook
  const { members: teamMembersList } = useTeamMembersList(selectedTeam);

  // Determine active filter - team takes precedence over individual members
  const activeFilterEmails = useMemo(() => {
    if (selectedTeam && teamMembersList.length > 0) {
      return teamMembersList;
    }
    return selectedMembers;
  }, [selectedTeam, teamMembersList, selectedMembers]);

  // Filter data based on active filter (team or individual members)
  const filteredDailyUsage = useMemo(() => {
    if (!dailyUsage?.data || activeFilterEmails.length === 0) {
      return dailyUsage?.data || [];
    }
    
    return dailyUsage.data.filter(entry => 
      activeFilterEmails.includes(entry.email || '')
    );
  }, [dailyUsage, activeFilterEmails]);

  const filteredSpending = useMemo(() => {
    if (!spending?.teamMemberSpend || activeFilterEmails.length === 0) {
      return spending?.teamMemberSpend || [];
    }
    
    return spending.teamMemberSpend.filter(member => 
      activeFilterEmails.includes(member.email)
    );
  }, [spending, activeFilterEmails]);

  const filteredTeamMembers = useMemo(() => {
    if (!teamMembers?.teamMembers || activeFilterEmails.length === 0) {
      return teamMembers?.teamMembers || [];
    }
    
    return teamMembers.teamMembers.filter(member => 
      activeFilterEmails.includes(member.email)
    );
  }, [teamMembers, activeFilterEmails]);

  // const filteredUsageEvents = useMemo(() => {
  //   if (!usageEvents?.usageEvents || activeFilterEmails.length === 0) {
  //     return usageEvents?.usageEvents || [];
  //   }
  //   
  //   return usageEvents.usageEvents.filter((event: { userEmail?: string }) => 
  //     activeFilterEmails.includes(event.userEmail || '')
  //   );
  // }, [usageEvents, activeFilterEmails]);

  const isLoading = isTestingConnection || isLoadingMembers || isLoadingUsage || isLoadingSpending || isLoadingEvents;
  const hasError = membersError || usageError || spendingError;

  // Handle member selection changes
  const handleMemberSelectionChange = (emails: string[]) => {
    setSelectedMembers(emails);
  };

  // Connection status display
  const renderConnectionStatus = () => {
    if (isTestingConnection) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Testing API connection...
        </div>
      );
    }

    if (!connectionTest?.success) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          API connection failed: {connectionTest?.error || 'Unknown error'}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
        <CheckCircle className="w-4 h-4" />
        Connected • {connectionTest.teamSize} team members
      </div>
    );
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border border-red-200 shadow-sm max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Error Loading Dashboard</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            {membersError && <p>• {membersError.message}</p>}
            {usageError && <p>• {usageError.message}</p>}
            {spendingError && <p>• {spendingError.message}</p>}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
            <p>Please check your API key configuration and network connection.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cursor Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Team usage insights and productivity metrics
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {renderConnectionStatus()}
              {/* Export Button - only show when data is available */}
              {!isLoading && teamMembers?.teamMembers && dailyUsage?.data && spending?.teamMemberSpend && (
                <ExportButton
                  teamMembers={filteredTeamMembers}
                  dailyUsage={filteredDailyUsage}
                  spending={filteredSpending}
                  filters={{
                    dateRange,
                    selectedTeam: selectedTeam || undefined,
                    selectedMembers: selectedMembers.length > 0 ? selectedMembers : undefined
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full lg:w-auto"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teams
              </label>
              <TeamSelector
                selectedTeam={selectedTeam}
                onChange={(team) => {
                  setSelectedTeam(team);
                  // Clear individual member selection when team is selected
                  if (team) {
                    setSelectedMembers([]);
                  }
                }}
                onManageTeams={() => setIsTeamManagementOpen(true)}
                placeholder="Select a team or use individual members"
                className="w-full"
              />
            </div>
            
            {/* Only show member selector when no team is selected */}
            {!selectedTeam && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Individual Members ({teamMembers?.teamMembers.length || 0} total)
                </label>
                <TeamMemberSelector
                  members={teamMembers?.teamMembers || []}
                  selectedMembers={selectedMembers}
                  onChange={handleMemberSelectionChange}
                  placeholder="All team members"
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          {/* Filter status display */}
          {(selectedTeam || selectedMembers.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {selectedTeam ? (
                  <>
                    Showing data for team <strong>{selectedTeam}</strong> ({teamMembersList.length} members)
                    from {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
                  </>
                ) : (
                  <>
                    Showing data for {selectedMembers.length} selected member(s) 
                    from {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Overview Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
            <p className="text-sm text-gray-600">
              Key metrics and team performance indicators
              {selectedMembers.length > 0 && ` (filtered to ${selectedMembers.length} members)`}
            </p>
          </div>
          
          <OverviewSection
            teamSize={filteredTeamMembers.length || teamMembers?.teamMembers.length || 0}
            dailyUsageData={filteredDailyUsage}
            spendingData={filteredSpending}
            isLoading={isLoading}
          />
        </div>

        {/* Advanced Analytics Section */}
        {!isLoading && dailyUsage?.data && teamMembers?.teamMembers && spending?.teamMemberSpend && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h2>
              <p className="text-sm text-gray-600">
                Comprehensive insights, visualizations, and individual member analytics
                {selectedTeam && ` (filtered to team ${selectedTeam} with ${teamMembersList.length} members)`}
                {!selectedTeam && selectedMembers.length > 0 && ` (filtered to ${selectedMembers.length} members)`}
              </p>
            </div>
            
            <AnalyticsTabs
              dailyUsageData={filteredDailyUsage}
              teamMembers={filteredTeamMembers}
              spendingData={filteredSpending}
            />
          </div>
        )}

        {/* Loading State for Analytics */}
        {isLoading && (
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Analytics</h3>
              <p className="text-sm text-gray-600">
                Fetching comprehensive data from Cursor API...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Team Management Modal */}
      <TeamManagement
        isOpen={isTeamManagementOpen}
        onClose={() => setIsTeamManagementOpen(false)}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Providers>
      <DashboardContent />
    </Providers>
  );
}
