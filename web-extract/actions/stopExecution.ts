'use server'

import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function stopWorkflowExecution(executionId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  console.log(`🔍 Stopping execution: ${executionId}`)

  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        select: { userId: true, id: true },
      },
    },
  })

  if (!execution) {
    throw new Error('Execution not found')
  }

  if (execution.workflow.userId !== userId) {
    throw new Error('Unauthorized')
  }

  if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
    throw new Error(`Cannot stop execution with status: ${execution.status}`)
  }

  // Update execution to FAILED
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
    },
  })

  // Update all non-completed phases to FAILED
  await prisma.executionPhase.updateMany({
    where: {
      workflowExecutionId: executionId,
      status: {
        in: ['RUNNING', 'PENDING', 'CREATED'],
      },
    },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
    },
  })

  // Add stop log
  const runningPhase = await prisma.executionPhase.findFirst({
    where: {
      workflowExecutionId: executionId,
      status: 'FAILED',
    },
    orderBy: {
      startedAt: 'desc',
    },
  })

  if (runningPhase) {
    await prisma.executionLog.create({
      data: {
        executionPhaseId: runningPhase.id,
        message: '⛔ Execution stopped by user',
        logLevel: 'error',
        timestamp: new Date(),
      },
    })
  }

  console.log(`✅ Execution ${executionId} stopped successfully`)

  revalidatePath(`/workflow/runs`)
  revalidatePath(`/workflow/runs/${execution.workflow.id}/${executionId}`)

  return { success: true }
}
