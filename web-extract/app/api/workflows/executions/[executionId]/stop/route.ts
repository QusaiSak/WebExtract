import { stopWorkflowExecution } from '@/actions/stopExecution'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { executionId } = params

    console.log(`🛑 Stop request for execution: ${executionId}`)

    await stopWorkflowExecution(executionId)

    console.log(`✅ Execution stopped: ${executionId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error stopping execution:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stop execution' },
      { status: 500 }
    )
  }
}