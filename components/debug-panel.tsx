"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bug, X, RefreshCw, Trash2 } from "lucide-react"

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  const testApiConnection = async () => {
    try {
      setIsLoading(true)
      addLog("Testing API connection...")
      const response = await fetch("/api/health")
      const data = await response.json()
      addLog(`API connection: ${JSON.stringify(data)}`)
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => setLogs([])

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0 shadow-lg"
        variant="outline"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-5 w-5" />
        <span className="sr-only">Debug</span>
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden shadow-xl border-border/50 bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Debug Panel
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={testApiConnection} disabled={isLoading} className="gap-1">
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Test API
          </Button>
          <Button size="sm" variant="outline" onClick={clearLogs} className="gap-1">
            <Trash2 className="h-3 w-3" />
            Clear Logs
          </Button>
        </div>
        <div className="h-64 overflow-y-auto border rounded-md p-2 text-xs font-mono bg-muted/30">
          {logs.length === 0 ? (
            <div className="text-muted-foreground p-2">No logs yet</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-1 border-b border-border/20 last:border-0">
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
