import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { executionId } = params

    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          select: { userId: true },
        },
        phases: {
          orderBy: { startedAt: 'asc' },
          include: {
            logs: {
              orderBy: { timestamp: 'asc' },
            },
          },
        },
      },
    })

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    if (execution.workflow.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(execution)
  } catch (error: any) {
    console.error('Error fetching execution:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch execution' },
      { status: 500 }
    )
  }
}