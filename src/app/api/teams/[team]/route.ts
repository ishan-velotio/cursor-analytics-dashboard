import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ team: string }> }
) {
  try {
    const { team: teamName } = await params;

    await teamService.deleteTeam(teamName);

    return NextResponse.json({
      success: true,
      message: `Team "${teamName}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 