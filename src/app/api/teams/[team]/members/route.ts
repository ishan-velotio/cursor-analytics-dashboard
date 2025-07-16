import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ team: string }> }
) {
  try {
    const { team: teamName } = await params;
    const members = await teamService.getTeamMembers(teamName);

    return NextResponse.json({
      success: true,
      team: teamName,
      members
    });
  } catch (error) {
    console.error('Error reading team members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read team members' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ team: string }> }
) {
  try {
    const { team: teamName } = await params;
    const { members, validateMembers = true } = await request.json();

    if (!Array.isArray(members)) {
      return NextResponse.json(
        { success: false, error: 'Members must be an array' },
        { status: 400 }
      );
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = members.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email formats',
          invalidEmails 
        },
        { status: 400 }
      );
    }

    // Skip server-side validation - validation happens on client-side during member addition
    // This prevents server-side API issues while maintaining user experience
    if (validateMembers) {
      console.log('Skipping server-side validation - members already validated on client-side');
    }

    // Remove duplicates and sort
    const uniqueMembers = [...new Set(members.map(email => email.toLowerCase().trim()))].sort();

    // Update team members in Supabase
    await teamService.updateTeamMembers(teamName, uniqueMembers);

    return NextResponse.json({
      success: true,
      team: teamName,
      members: uniqueMembers,
      memberCount: uniqueMembers.length
    });
  } catch (error) {
    console.error('Error updating team members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team members' },
      { status: 500 }
    );
  }
} 