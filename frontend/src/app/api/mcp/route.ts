import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (token !== process.env.AGENT_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Export internal Next.js React DOM states for Antigravity verification
    return NextResponse.json({
        mcp: true,
        version: "16.2.0-canary",
        capabilities: ["domState", "devtools", "componentProps"]
    })
}
