import { NextResponse } from "next/server"
import OpenAI from "openai"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"

export async function GET() {
  try {
    // Check if the API key is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API key is not set in environment variables",
        },
        { status: 500 },
      )
    }

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // No need for dangerouslyAllowBrowser since this is server-side
    })

    // Test the API key with a simple request
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Hello, this is a test message. Please respond with 'API key is working'.",
        },
      ],
      max_tokens: 20,
    })

    return NextResponse.json({
      success: true,
      message: response.choices[0]?.message?.content || "No response",
      apiKeyStatus: "valid",
    })
  } catch (error: any) {
    console.error("Error testing OpenAI API key:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        apiKeyStatus: "invalid",
        details: error.response?.data || error.response || "No additional details",
      },
      { status: 500 },
    )
  }
}
