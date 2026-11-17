import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const response = await fetch(`${process.env.AGENT_API_URL || 'http://localhost:8000'}/api/v1/architect/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await request.json()),
    })
    return new Response(response.body, { status: response.status, headers: {
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="archon-scaffold.zip"',
    } })
  } catch {
    return NextResponse.json({ error: 'Could not download scaffold' }, { status: 502 })
  }
}
