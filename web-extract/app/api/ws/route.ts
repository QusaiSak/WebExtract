export const runtime = 'nodejs'

// In-memory log broadcast hub
// Maps executionPhaseId -> Set of connected clients
const logBroadcasters = new Map<string, Set<{
  controller: ReadableStreamDefaultController;
  heartbeat: NodeJS.Timeout;
}>>();

function getOrCreateBroadcaster(phaseId: string) {
  if (!logBroadcasters.has(phaseId)) {
    logBroadcasters.set(phaseId, new Set());
  }
  return logBroadcasters.get(phaseId)!;
}

// Helper to broadcast logs to all connected clients for a phase
export async function broadcastLogToPhase(phaseId: string, log: any) {
  const subscribers = logBroadcasters.get(phaseId);
  if (!subscribers || subscribers.size === 0) return;

  const encoder = new TextEncoder();
  const eventData = `data: ${JSON.stringify(log)}\n\n`;
  
  for (const sub of subscribers) {
    try {
      sub.controller.enqueue(encoder.encode(eventData));
    } catch (error) {
      // Client disconnected, will be cleaned up by cancel
      subscribers.delete(sub);
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phaseId = searchParams.get('phaseId');
  
  if (!phaseId) {
    return new Response('Missing phaseId', { status: 400 });
  }

  const broadcaster = getOrCreateBroadcaster(phaseId);

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(`: connected to phase ${phaseId}\n\n`));
      
      // Keep-alive heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: ping ${Date.now()}\n\n`));
        } catch {}
      }, 30000);

      const sub = { controller, heartbeat };
      broadcaster.add(sub);

      // Store cancel handler
      (controller as any).cancel = () => {
        clearInterval(heartbeat);
        broadcaster.delete(sub);
        try {
          controller.close();
        } catch {}
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Keep the POST endpoint for manual broadcast if needed
export async function POST(request: Request) {
  try {
    const { phaseId, log } = await request.json();
    if (!phaseId || !log) {
      return new Response(JSON.stringify({ error: 'phaseId and log are required' }), { status: 400 });
    }
    
    await broadcastLogToPhase(phaseId, log);
    
    return new Response(JSON.stringify({ delivered: true }), { status: 200 });
  } catch (e) {
    console.error('POST error:', e);
    return new Response(JSON.stringify({ error: 'broadcast failed' }), { status: 500 });
  }
}
