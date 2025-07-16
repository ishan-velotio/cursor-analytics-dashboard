import axios, { AxiosInstance } from 'axios';

// Type definitions for Cursor API responses
export interface TeamMember {
  name: string;
  email: string;
  role: 'owner' | 'member' | 'free-owner';
}

export interface TeamMembersResponse {
  teamMembers: TeamMember[];
}

export interface DailyUsageEntry {
  date: number;
  email?: string;
  name?: string;
  isActive: boolean;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  acceptedLinesAdded: number;
  acceptedLinesDeleted: number;
  totalApplies: number;
  totalAccepts: number;
  totalRejects: number;
  totalTabsShown: number;
  totalTabsAccepted: number;
  composerRequests: number;
  chatRequests: number;
  agentRequests: number;
  cmdkUsages: number;
  subscriptionIncludedReqs: number;
  apiKeyReqs: number;
  usageBasedReqs: number;
  bugbotUsages: number;
  mostUsedModel?: string;
  applyMostUsedExtension?: string;
  tabMostUsedExtension?: string;
  clientVersion?: string;
}

export interface DailyUsageResponse {
  data: DailyUsageEntry[];
  period: {
    startDate: number;
    endDate: number;
  };
}

export interface TeamMemberSpend {
  name: string;
  email: string;
  role: string;
  spendCents: number;
  fastPremiumRequests: number;
  hardLimitOverrideDollars: number;
}

export interface SpendingResponse {
  subscriptionCycleStart: number;
  totalMembers: number;
  totalPages: number;
  teamMemberSpend: TeamMemberSpend[];
}

export interface UsageEvent {
  userEmail: string;
  timestamp: number;
  eventType: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface UsageEventsResponse {
  usageEvents: UsageEvent[];
  totalUsageEventsCount: number;
  hasMore: boolean;
}

class CursorAPI {
  private client: AxiosInstance;

  constructor() {
    // Use Next.js API routes instead of direct external API calls
    this.client = axios.create({
      baseURL: '/api/cursor',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
        if (error.response?.data) {
          console.error('Error details:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all team members
   */
  async getTeamMembers(): Promise<TeamMembersResponse> {
    try {
      const response = await this.client.get('/members');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }
  }

  /**
   * Get daily usage data for a date range
   */
  async getDailyUsageData(startDate: number, endDate: number): Promise<DailyUsageResponse> {
    try {
      const response = await this.client.post('/usage', {
        startDate,
        endDate
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch daily usage data: ${error.message}`);
    }
  }

  /**
   * Get spending data with optional filters
   */
  async getSpendingData(filters: Record<string, any> = {}): Promise<SpendingResponse> {
    try {
      const response = await this.client.post('/spending', filters);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch spending data: ${error.message}`);
    }
  }

  /**
   * Get detailed usage events with filters
   */
  async getUsageEvents(filters: Record<string, any> = {}): Promise<UsageEventsResponse> {
    try {
      // For now, return mock data since events endpoint might need additional setup
      return {
        usageEvents: [],
        totalUsageEventsCount: 0,
        hasMore: false
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch usage events: ${error.message}`);
    }
  }

  /**
   * Get comprehensive team data for a date range
   */
  async getComprehensiveData(startDate: number, endDate: number) {
    try {
      console.log('📊 Fetching comprehensive team data...');
      
      // Fetch all data in parallel (excluding events for now)
      const [members, dailyUsage, spending] = await Promise.all([
        this.getTeamMembers(),
        this.getDailyUsageData(startDate, endDate),
        this.getSpendingData()
      ]);
      
      return {
        members,
        dailyUsage,
        spending,
        events: { usageEvents: [], totalUsageEventsCount: 0, hasMore: false },
        dateRange: {
          startDate,
          endDate,
          startDateFormatted: new Date(startDate).toISOString().split('T')[0],
          endDateFormatted: new Date(endDate).toISOString().split('T')[0]
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch comprehensive data: ${error.message}`);
    }
  }

  /**
   * Test API connectivity and permissions
   */
  async testConnection() {
    try {
      console.log('🔧 Testing Cursor API connection...');
      
      const members = await this.getTeamMembers();
      const memberCount = members.teamMembers?.length || 0;
      
      return {
        success: true,
        teamSize: memberCount,
        apiKeyValid: true,
        message: `Successfully connected! Found ${memberCount} team members.`
      };
    } catch (error: any) {
      return {
        success: false,
        apiKeyValid: false,
        error: error.message,
        message: 'Failed to connect to Cursor API. Please check your API key.'
      };
    }
  }
}

export default CursorAPI; 