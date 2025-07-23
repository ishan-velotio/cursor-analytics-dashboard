import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CURSOR_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_CURSOR_API_BASE_URL || 'https://api.cursor.com';
    
    // Debug logging
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    console.log('API Key starts with:', apiKey?.substring(0, 10));

    console.log('Base URL:', baseUrl);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/teams/members`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cursor API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Cursor API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 