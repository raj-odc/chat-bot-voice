import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"
export const maxDuration = 30

// Create OpenAI client outside the handler function
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // No need for dangerouslyAllowBrowser since this is server-side
})

export async function POST(req: NextRequest) {
  try {
    // Validate OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing")
      return NextResponse.json({ error: "OpenAI API key is missing" }, { status: 500 })
    }

    // Parse the form data
    let formData
    try {
      formData = await req.formData()
    } catch (error) {
      console.error("Error parsing form data:", error)
      return NextResponse.json(
        {
          error: "Failed to parse form data",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 },
      )
    }

    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert the file to a Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call OpenAI's Whisper API
    try {
      const formData = new FormData()
      formData.append("file", new Blob([buffer]), "audio.webm")
      formData.append("model", "whisper-1")

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        return NextResponse.json({ error: error.error.message }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json({ text: data.text })
    } catch (error) {
      console.error("Error transcribing audio:", error)
      return NextResponse.json(
        {
          error: "Failed to transcribe audio",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in transcribe API:", error)
    return NextResponse.json(
      {
        error: "Failed to process transcription request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
