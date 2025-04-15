"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApiKeyTester() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testApiKey = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setStatus("Testing API key...")

      const response = await fetch("/api/test-openai-key")
      const data = await response.json()

      if (data.success) {
        setStatus(`API key is valid: ${data.message}`)
      } else {
        setError(`API key error: ${data.error}`)
        setStatus("API key test failed")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setStatus("Failed to test API key")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 left-4 z-50" variant="outline" onClick={() => setIsOpen(true)}>
        Test API Key
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between">
          OpenAI API Key Tester
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={testApiKey} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Test API Key"}
        </Button>

        {status && (
          <div className="mt-2">
            <p className="text-xs mb-1">Status:</p>
            <div className="text-xs p-2 bg-muted rounded-md">{status}</div>
          </div>
        )}

        {error && (
          <div className="mt-2">
            <p className="text-xs mb-1">Error:</p>
            <div className="text-xs p-2 bg-red-100 text-red-800 rounded-md">{error}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
