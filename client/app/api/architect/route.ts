import { NextRequest, NextResponse } from 'next/server'

const AGENT_URL = process.env.AGENT_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requirements, action = 'design', architecture, modification } = body

    if (!requirements || requirements.trim().length < 10) {
      return NextResponse.json(
        { error: "'requirements' must be at least 10 characters" },
        { status: 400 }
      )
    }

    // Call the Flask agent API with SSE streaming
    const agentResponse = await fetch(`${AGENT_URL}/api/v1/architect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements,
        action,
        architecture,
        modification,
      }),
    })

    if (!agentResponse.ok) {
      const errorData = await agentResponse.json().catch(() => ({
        error: 'Agent API returned an error',
      }))
      return NextResponse.json(errorData, { status: agentResponse.status })
    }

    // Forward the SSE stream to the client
    const stream = agentResponse.body
    if (!stream) {
      return NextResponse.json(
        { error: 'No response stream from agent' },
        { status: 500 }
      )
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[Architect API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to architecture agent' },
      { status: 500 }
    )
  }
}
