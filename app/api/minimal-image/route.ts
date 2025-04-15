import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // Try to parse the form data
    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Just return basic info about the image without processing it
    return NextResponse.json({
      success: true,
      imageInfo: {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
      },
      message: "Image received successfully (no processing performed)",
    })
  } catch (error) {
    console.error("Error in minimal image API:", error)
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
