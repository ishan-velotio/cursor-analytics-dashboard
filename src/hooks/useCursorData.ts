import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import CursorAPI, { 
  TeamMembersResponse, 
  DailyUsageResponse, 
  SpendingResponse, 
  UsageEventsResponse 
} from '@/lib/cursor-api';

// Initialize API client
const cursorAPI = new CursorAPI();

// Query keys for React Query caching
export const queryKeys = {
  teamMembers: ['cursor', 'teamMembers'] as const,
  dailyUsage: (startDate: number, endDate: number) => ['cursor', 'dailyUsage', startDate, endDate] as const,
  spending: () => ['cursor', 'spending'] as const,
  usageEvents: (startDate: number, endDate: number) => ['cursor', 'usageEvents', startDate, endDate] as const,
  comprehensive: (startDate: number, endDate: number) => ['cursor', 'comprehensive', startDate, endDate] as const,
};

// Hook for fetching team members
export function useTeamMembers(): UseQueryResult<TeamMembersResponse, Error> {
  return useQuery({
    queryKey: queryKeys.teamMembers,
    queryFn: () => cursorAPI.getTeamMembers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook for fetching daily usage data
export function useDailyUsage(
  startDate: Date, 
  endDate: Date,
  enabled: boolean = true
): UseQueryResult<DailyUsageResponse, Error> {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  return useQuery({
    queryKey: queryKeys.dailyUsage(startTimestamp, endTimestamp),
    queryFn: () => cursorAPI.getDailyUsageData(startTimestamp, endTimestamp),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Hook for fetching spending data
export function useSpending(): UseQueryResult<SpendingResponse, Error> {
  return useQuery({
    queryKey: queryKeys.spending(),
    queryFn: () => cursorAPI.getSpendingData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook for fetching usage events
export function useUsageEvents(
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
): UseQueryResult<UsageEventsResponse, Error> {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  return useQuery({
    queryKey: queryKeys.usageEvents(startTimestamp, endTimestamp),
    queryFn: () => cursorAPI.getUsageEvents({ 
      startDate: startTimestamp, 
      endDate: endTimestamp, 
      pageSize: 100 
    }),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Hook for fetching comprehensive data (all endpoints)
export function useComprehensiveData(
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
) {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  return useQuery({
    queryKey: queryKeys.comprehensive(startTimestamp, endTimestamp),
    queryFn: () => cursorAPI.getComprehensiveData(startTimestamp, endTimestamp),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Hook for testing API connection
export function useAPIConnection() {
  return useQuery({
    queryKey: ['cursor', 'connection'],
    queryFn: () => cursorAPI.testConnection(),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Utility hook for default date range (last 30 days)
export function useDefaultDateRange() {
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  
  return { startDate, endDate };
} 