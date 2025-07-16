import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format',
          isValid: false 
        },
        { status: 400 }
      );
    }

    // Check if member already exists in any team
    try {
      const existingMembers = await teamService.getAllExistingMembers();
      const isExisting = existingMembers.includes(email.toLowerCase());
      
      return NextResponse.json({
        success: true,
        email,
        isValid: isExisting,
        member: isExisting ? { email } : null,
        note: isExisting ? 'Member exists in teams' : 'New member'
      });
    } catch (error) {
      console.log('Could not check existing members, defaulting to valid');
      return NextResponse.json({
        success: true,
        email,
        isValid: false, // Default to external member
        member: null,
        note: 'Validation handled client-side via search interface'
      });
    }
  } catch (error) {
    console.error('Error in member validation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 