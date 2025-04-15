import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Test endpoint is working",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: Request) {
  try {
    // Try to parse the request body
    const contentType = req.headers.get("content-type") || ""

    let body = "No body"
    if (contentType.includes("application/json")) {
      body = await req.json()
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      body = Object.fromEntries(formData.entries())
    } else {
      body = await req.text()
    }

    return NextResponse.json({
      status: "ok",
      message: "Test POST endpoint is working",
      receivedContentType: contentType,
      receivedBody: body,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in test POST endpoint:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
