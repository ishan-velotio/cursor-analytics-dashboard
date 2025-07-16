import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { teamService } from '@/lib/supabase';

// Types
export interface Team {
  name: string;
  memberCount: number;
}

export interface TeamMember {
  name?: string;
  email: string;
}

export interface TeamWithMembers extends Team {
  members: string[];
}

export interface ValidationResult {
  email: string;
  isValid: boolean;
  member?: TeamMember | null;
}

// API functions
const teamsAPI = {
  // Get all teams
  getTeams: async (): Promise<Team[]> => {
    const response = await fetch('/api/teams');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    return data.teams;
  },

  // Get all existing members across all teams
  getAllExistingMembers: async (): Promise<string[]> => {
    try {
      return await teamService.getAllExistingMembers();
    } catch (error) {
      console.warn('Failed to get existing members from Supabase:', error);
      return [];
    }
  },

  // Get team members
  getTeamMembers: async (teamName: string): Promise<string[]> => {
    const response = await fetch(`/api/teams/${teamName}/members`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    return data.members;
  },

  // Create team
  createTeam: async (teamName: string): Promise<Team> => {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    return data.team;
  },

  // Update team members
  updateTeamMembers: async (
    teamName: string, 
    members: string[], 
    validateMembers = true
  ): Promise<TeamWithMembers> => {
    const response = await fetch(`/api/teams/${teamName}/members`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members, validateMembers })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update team members');
    }
    return {
      name: data.team,
      memberCount: data.memberCount,
      members: data.members
    };
  },

  // Delete team
  deleteTeam: async (teamName: string): Promise<void> => {
    const response = await fetch(`/api/teams/${teamName}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
  },

  // Validate member
  validateMember: async (email: string): Promise<ValidationResult> => {
    const response = await fetch('/api/teams/validate-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    return {
      email,
      isValid: data.isValid,
      member: data.member
    };
  }
};

// Query keys
export const teamQueryKeys = {
  teams: ['teams'] as const,
  teamMembers: (teamName: string) => ['teams', teamName, 'members'] as const,
  allMembers: ['teams', 'all-members'] as const,
};

// Hook for managing teams
export function useTeams() {
  const queryClient = useQueryClient();

  // Get all teams
  const teamsQuery = useQuery({
    queryKey: teamQueryKeys.teams,
    queryFn: teamsAPI.getTeams,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: teamsAPI.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.teams });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: teamsAPI.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.teams });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.allMembers });
    },
  });

  return {
    teams: teamsQuery.data || [],
    isLoading: teamsQuery.isLoading,
    error: teamsQuery.error,
    createTeam: createTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    isCreating: createTeamMutation.isPending,
    isDeleting: deleteTeamMutation.isPending,
    refetch: teamsQuery.refetch,
  };
}

// Hook for managing team members
export function useTeamMembers(teamName: string | null) {
  const queryClient = useQueryClient();

  // Get team members
  const membersQuery = useQuery({
    queryKey: teamName ? teamQueryKeys.teamMembers(teamName) : [],
    queryFn: () => teamName ? teamsAPI.getTeamMembers(teamName) : Promise.resolve([]),
    enabled: !!teamName,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update team members mutation
  const updateMembersMutation = useMutation({
    mutationFn: ({ members, validateMembers = true }: { 
      members: string[], 
      validateMembers?: boolean 
    }) => {
      if (!teamName) throw new Error('No team selected');
      return teamsAPI.updateTeamMembers(teamName, members, validateMembers);
    },
    onSuccess: () => {
      if (teamName) {
        queryClient.invalidateQueries({ queryKey: teamQueryKeys.teamMembers(teamName) });
        queryClient.invalidateQueries({ queryKey: teamQueryKeys.teams });
        queryClient.invalidateQueries({ queryKey: teamQueryKeys.allMembers });
      }
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    updateMembers: updateMembersMutation.mutateAsync,
    isUpdating: updateMembersMutation.isPending,
    refetch: membersQuery.refetch,
  };
}

// Hook for member validation
export function useMemberValidation() {
  const [validationCache, setValidationCache] = useState<Map<string, ValidationResult>>(new Map());

  const validateMember = async (email: string): Promise<ValidationResult> => {
    // Check cache first
    if (validationCache.has(email)) {
      return validationCache.get(email)!;
    }

    try {
      const result = await teamsAPI.validateMember(email);
      setValidationCache(prev => new Map(prev).set(email, result));
      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        email,
        isValid: false,
        member: null
      };
      setValidationCache(prev => new Map(prev).set(email, errorResult));
      return errorResult;
    }
  };

  const clearCache = () => {
    setValidationCache(new Map());
  };

  return {
    validateMember,
    clearCache,
    validationCache: validationCache,
  };
}

// Hook for getting all existing members across teams
export function useAllExistingMembers() {
  const existingMembersQuery = useQuery({
    queryKey: teamQueryKeys.allMembers,
    queryFn: teamsAPI.getAllExistingMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes - existing members don't change that often
  });

  const isExistingMember = (email: string): boolean => {
    const members = existingMembersQuery.data || [];
    return members.includes(email.toLowerCase());
  };

  return {
    existingMembers: existingMembersQuery.data || [],
    isLoading: existingMembersQuery.isLoading,
    isExistingMember,
    refetch: existingMembersQuery.refetch,
  };
} 