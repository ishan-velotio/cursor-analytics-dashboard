import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database schema
export interface Team {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  email: string;
  added_at: string;
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[];
  memberCount: number;
}

// Database helper functions
export const teamService = {
  // Get all teams
  async getTeams(): Promise<(Team & { memberCount: number })[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (*)
      `)
      .order('name');
    
    if (error) throw error;
    
    return (data || []).map(team => ({
      ...team,
      memberCount: team.team_members?.length || 0
    }));
  },

  // Get team with members
  async getTeamWithMembers(teamName: string): Promise<TeamWithMembers | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (*)
      `)
      .eq('name', teamName)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return {
      ...data,
      memberCount: data.team_members?.length || 0
    };
  },

  // Get team members by team name
  async getTeamMembers(teamName: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        team_members (email)
      `)
      .eq('name', teamName)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return []; // Not found
      throw error;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.team_members?.map((tm: any) => tm.email) || [];
  },

  // Create team
  async createTeam(name: string): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete team
  async deleteTeam(teamName: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('name', teamName);
    
    if (error) throw error;
  },

  // Update team members (replace all)
  async updateTeamMembers(teamName: string, emails: string[]): Promise<void> {
    // Get team ID
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('name', teamName)
      .single();
    
    if (teamError) throw teamError;
    
    // Delete existing members
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id);
    
    if (deleteError) throw deleteError;
    
    // Insert new members
    if (emails.length > 0) {
      const members = emails.map(email => ({
        team_id: team.id,
        email: email.toLowerCase().trim()
      }));
      
      const { error: insertError } = await supabase
        .from('team_members')
        .insert(members);
      
      if (insertError) throw insertError;
    }
  },

  // Get all existing members across all teams (for validation)
  async getAllExistingMembers(): Promise<string[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('email');
    
    if (error) throw error;
    
    const uniqueEmails = new Set(data.map(tm => tm.email));
    return Array.from(uniqueEmails);
  }
}; 