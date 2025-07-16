import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/lib/supabase';

export async function GET() {
  try {
    const teams = await teamService.getTeams();
    
    // Transform to match the existing API format
    const formattedTeams = teams.map(team => ({
      name: team.name,
      memberCount: team.memberCount
    }));
    
    return NextResponse.json({
      success: true,
      teams: formattedTeams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { teamName } = await request.json();

    if (!teamName || typeof teamName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Validate team name
    const cleanTeamName = teamName.toLowerCase().trim();
    if (!/^[a-z0-9-_]+$/.test(cleanTeamName)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Team name must contain only lowercase letters, numbers, hyphens, and underscores' 
        },
        { status: 400 }
      );
    }

    const team = await teamService.createTeam(cleanTeamName);

    return NextResponse.json({
      success: true,
      team: {
        name: team.name,
        memberCount: 0
      }
    });
  } catch (error: unknown) {
    console.error('Error creating team:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, error: 'Team already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
} 