import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, definition } = await request.json()
    console.log('Received workflow data:', { name, description, definition })
    if (!name || !definition) {
      return NextResponse.json(
        { error: 'Name and definition are required' },
        { status: 400 }
      )
    }

    // Always create new workflow for AI generations
    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        name,
        description: description || `AI Generated workflow: ${name}`,
        definition,
        status: 'DRAFT'
      }
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error saving workflow:', error)
    return NextResponse.json(
      { error: 'Failed to save workflow' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        creditsCost: true
      }
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}
