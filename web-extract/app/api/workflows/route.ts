import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

async function broadcast(baseUrl: string, channel: string, type: string, payload: any) {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/ws`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, type, payload })
    })
  } catch (e) {
    console.warn('WS broadcast failed:', e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, definition } = await request.json()

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
        description: description || `Created via Chat: ${name}`,
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

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, description, definition } = await request.json()
    if (!id || (!definition && !name && !description)) {
      return NextResponse.json(
        { error: 'id and at least one field to update are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.workflow.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
        ...(definition ? { definition } : {}),
      }
    })

    // Fire-and-forget SSE broadcast for live editors
    const origin = new URL(request.url).origin
    broadcast(origin, id, 'workflow.updated', { id, name: updated.name, definition: updated.definition }).catch(() => {})

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const wf = await prisma.workflow.findUnique({ where: { id } })
      if (!wf || wf.userId !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json(wf)
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
