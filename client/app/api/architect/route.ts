import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const AGENT_URL = process.env.AGENT_API_URL || 'http://localhost:8000'
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requirements, projectId } = body

    if (!requirements || requirements.trim().length < 10) {
      return NextResponse.json(
        { error: "'requirements' must be at least 10 characters" },
        { status: 400 }
      )
    }

    // If projectId is provided, fetch the PAT from the backend
    let github_token: string | undefined
    let github_repo: string | undefined

    if (projectId) {
      const cookieStore = await cookies()
      const token = cookieStore.get('token')?.value

      if (token) {
        try {
          const patResponse = await fetch(
            `${BACKEND_URL}/projects/${projectId}/pat`,
            { headers: { Cookie: `token=${token}` } }
          )
          if (patResponse.ok) {
            const patData = await patResponse.json()
            github_token = patData.github_pat
            github_repo = patData.github_repo
          }
        } catch (err) {
          console.error('Failed to fetch project PAT:', err)
        }
      }
    }

    // Call the Flask agent API with SSE streaming
    const agentResponse = await fetch(`${AGENT_URL}/api/v1/architect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements,
        ...(github_token && { github_token }),
        ...(github_repo && { github_repo }),
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
