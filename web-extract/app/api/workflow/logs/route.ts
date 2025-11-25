import { NextRequest } from 'next/server';

// Legacy endpoint - kept for backward compatibility
// New logs should use /app/api/ws instead

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');
  
  if (!executionId) {
    return new Response('Missing executionId', { status: 400 });
  }

  // Return a simple response indicating to use the new endpoint
  return new Response(
    `Use /app/api/ws?phaseId={phaseId} for real-time logs`,
    { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    }
  );
}