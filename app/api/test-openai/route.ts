import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

// Create OpenAI client outside the handler function
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    // Simple test to check if the OpenAI client is working
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say hello",
        },
      ],
      max_tokens: 10,
    })

    return NextResponse.json({
      success: true,
      message: response.choices[0]?.message?.content || "No response",
      model: "gpt-3.5-turbo",
    })
  } catch (error) {
    console.error("Error testing OpenAI:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
