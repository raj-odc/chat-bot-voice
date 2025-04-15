"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function ImageTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [testEndpointStatus, setTestEndpointStatus] = useState<string | null>(null)

  const testImageUpload = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResponse(null)
      setRawResponse(null)

      // Create a simple canvas with text
      const canvas = document.createElement("canvas")
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#f0f0f0"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = "20px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText("Test Image", 100, 75)
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve))
      if (!blob) {
        throw new Error("Failed to create test image blob")
      }

      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(blob)

      // Create FormData and append the image
      const formData = new FormData()
      formData.append("image", blob, "test-image.png")
      formData.append("prompt", "What text do you see in this image?")

      // Send to API
      const response = await fetch("/api/image-chat", {
        method: "POST",
        body: formData,
      })

      // Get the raw response text for debugging
      const responseText = await response.text()
      setRawResponse(responseText)
      console.log("Raw API response:", responseText)

      let data
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || "API returned error status")
      }

      setResponse(data.response)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const testOpenAIKey = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setApiKeyStatus(null)

      const response = await fetch("/api/test-openai-key")
      const data = await response.json()

      setApiKeyStatus({
        success: data.success,
        message: data.success ? "API key is valid" : `API key error: ${data.error}`,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setApiKeyStatus({
        success: false,
        message: "Failed to test API key",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSimpleEndpoint = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setTestEndpointStatus(null)

      // Test the simple GET endpoint
      const response = await fetch("/api/test")
      const data = await response.json()

      setTestEndpointStatus(`Test endpoint working: ${JSON.stringify(data)}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setTestEndpointStatus("Failed to test simple endpoint")
    } finally {
      setIsLoading(false)
    }
  }

  const testSimpleFormPost = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setTestEndpointStatus(null)

      // Create a simple form data
      const formData = new FormData()
      formData.append("test", "value")
      formData.append("number", "123")

      // Test the POST endpoint with form data
      const response = await fetch("/api/test", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      console.log("Raw test response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response from test endpoint: ${responseText.substring(0, 100)}...`)
      }

      setTestEndpointStatus(`Test POST endpoint working: ${JSON.stringify(data)}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setTestEndpointStatus("Failed to test simple POST endpoint")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 right-4 z-50" variant="outline" onClick={() => setIsOpen(true)}>
        Test Image
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between">
          Image Test
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={testImageUpload} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Image Upload"}
          </Button>
          <Button size="sm" onClick={testOpenAIKey} disabled={isLoading}>
            Test API Key
          </Button>
          <Button size="sm" onClick={testSimpleEndpoint} disabled={isLoading}>
            Test Simple GET
          </Button>
          <Button size="sm" onClick={testSimpleFormPost} disabled={isLoading}>
            Test Simple POST
          </Button>
        </div>

        {imagePreview && (
          <div className="mt-2">
            <p className="text-xs mb-1">Test Image:</p>
            <div className="relative h-20 w-full">
              <Image src={imagePreview || "/placeholder.svg"} alt="Test" fill className="object-contain" />
            </div>
          </div>
        )}

        {response && (
          <div className="mt-2">
            <p className="text-xs mb-1">Response:</p>
            <div className="text-xs p-2 bg-muted rounded-md">{response}</div>
          </div>
        )}

        {error && (
          <div className="mt-2">
            <p className="text-xs mb-1">Error:</p>
            <div className="text-xs p-2 bg-red-100 text-red-800 rounded-md">{error}</div>
          </div>
        )}

        {apiKeyStatus && (
          <div className="mt-2">
            <p className="text-xs mb-1">API Key Status:</p>
            <div
              className={`text-xs p-2 ${apiKeyStatus.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} rounded-md`}
            >
              {apiKeyStatus.message}
            </div>
          </div>
        )}

        {testEndpointStatus && (
          <div className="mt-2">
            <p className="text-xs mb-1">Test Endpoint Status:</p>
            <div className="text-xs p-2 bg-muted rounded-md">{testEndpointStatus}</div>
          </div>
        )}

        {rawResponse && (
          <div className="mt-2">
            <details>
              <summary className="text-xs cursor-pointer">Raw Response</summary>
              <div className="text-xs p-2 bg-muted rounded-md mt-1 max-h-32 overflow-auto">{rawResponse}</div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
