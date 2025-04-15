import { NextResponse } from "next/server"
import OpenAI from "openai"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"
export const maxDuration = 30

// Create OpenAI client outside the handler function
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // No need for dangerouslyAllowBrowser since this is server-side
})

export async function POST(req: Request) {
  try {
    // Validate OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing")
      return NextResponse.json({ error: "OpenAI API key is missing" }, { status: 500 })
    }

    // Parse the form data with error handling
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

    const imageFile = formData.get("image") as File | null
    const prompt = (formData.get("prompt") as string) || "What's in this image?"

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Log image details for debugging
    console.log("Image chat request received:", {
      fileType: imageFile.type,
      fileSize: imageFile.size,
      promptLength: prompt.length,
    })

    // Convert the file to a base64 string with error handling
    let base64Image
    try {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      base64Image = buffer.toString("base64")
    } catch (error) {
      console.error("Error converting image to base64:", error)
      return NextResponse.json(
        {
          error: "Failed to process image data",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // Call OpenAI API with error handling
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful customer service assistant analyzing images for customers. Be detailed and helpful in your analysis.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      })

      console.log("OpenAI response received:", {
        status: "success",
        responseLength: response.choices[0]?.message?.content?.length || 0,
      })

      return NextResponse.json({ response: response.choices[0]?.message?.content || "No response from AI" })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Extract detailed error information from OpenAI error
      const errorMessage = openaiError.message || "Unknown OpenAI error"
      const errorStatus = openaiError.status || 500
      const errorType = openaiError.type || "api_error"

      // Return a structured error response
      return NextResponse.json(
        {
          error: "OpenAI API error",
          details: errorMessage,
          type: errorType,
          status: errorStatus,
        },
        { status: errorStatus },
      )
    }
  } catch (error: any) {
    // Catch-all error handler
    console.error("Unhandled error in image chat API:", error)

    // Ensure we return a proper JSON response for all errors
    return NextResponse.json(
      {
        error: "Failed to process image chat",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
