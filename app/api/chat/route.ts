import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { Message } from "ai/react"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"
export const maxDuration = 30 // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
  try {
    // Validate OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing")
      return new Response(JSON.stringify({ error: "OpenAI API key is missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse the request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return new Response(JSON.stringify({ error: "Failed to parse request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages }: { messages: Message[] } = body

    // System prompt to define the customer service assistant's behavior
    const systemPrompt = `
  You are an advanced customer service AI assistant that can understand context and user preferences.
  You are helpful, friendly, and concise in your responses.
  You can assist with product information, troubleshooting, order status, and general inquiries.
  Always maintain a professional and supportive tone.
  If you need more information to help the user, ask clarifying questions.
  Remember details from earlier in the conversation to provide personalized assistance.
`

    console.log("Chat request received:", {
      messageCount: messages.length,
      lastMessageContent: messages.length > 0 ? messages[messages.length - 1].content.substring(0, 100) : "none",
    })

    // Stream the response
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: systemPrompt,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
