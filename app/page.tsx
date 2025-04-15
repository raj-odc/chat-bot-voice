"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { type Message, useChat } from "ai/react"
import { Mic, Send, StopCircle, Sparkles, User, Bot, Settings } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Add this import if you want to use the DebugPanel
import DebugPanel from "@/components/debug-panel"

export default function CustomerService() {
  const [activeTab, setActiveTab] = useState("text")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [preferences, setPreferences] = useState({
    name: "",
    productInterest: "",
    communicationPreference: "email",
  })
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: "/api/chat",
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    },
  })

  // Save user preferences to localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem("userPreferences")
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    } else {
      setShowPreferences(true)
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const savePreferences = (newPreferences: typeof preferences) => {
    setPreferences(newPreferences)
    localStorage.setItem("userPreferences", JSON.stringify(newPreferences))
    setShowPreferences(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

        setIsProcessing(true)
        try {
          // Create a FormData object and append the audio
          const formData = new FormData()
          formData.append("audio", audioBlob)

          // Send the audio for transcription
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to transcribe audio")
          }

          const data = await response.json()

          // Append the transcribed text as a user message
          append({
            id: Date.now().toString(),
            role: "user",
            content: data.text,
          })
        } catch (error) {
          console.error("Error transcribing audio:", error)
          toast({
            title: "Error",
            description: "Failed to transcribe audio",
            variant: "destructive",
          })
        } finally {
          stream.getTracks().forEach((track) => track.stop())
          setIsRecording(false)
          setRecordingStatus("")
          setIsProcessing(false)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingStatus("Recording...")
    } catch (err) {
      console.error("Error starting recording:", err)
      setRecordingStatus("")
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setRecordingStatus("Processing audio...")
    }
  }

  const handlePreferenceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    savePreferences(preferences)

    // Inform the AI about the user's preferences
    append({
      id: Date.now().toString(),
      role: "user",
      content: `My name is ${preferences.name}. I'm interested in ${preferences.productInterest} products and prefer communication via ${preferences.communicationPreference}.`,
    })

    toast({
      title: "Preferences Saved",
      description: "Your preferences have been saved and shared with the assistant.",
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-background/80">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/40 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">AI Customer Service</h1>
          </div>
          <div className="flex items-center gap-2">
            {preferences.name && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Your Preferences</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePreferenceSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Your Name
                      </label>
                      <Input
                        id="name"
                        value={preferences.name}
                        onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="productInterest" className="text-sm font-medium">
                        Product Interest
                      </label>
                      <Input
                        id="productInterest"
                        value={preferences.productInterest}
                        onChange={(e) => setPreferences({ ...preferences, productInterest: e.target.value })}
                        placeholder="What products are you interested in?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="communicationPreference" className="text-sm font-medium">
                        Preferred Communication
                      </label>
                      <select
                        id="communicationPreference"
                        value={preferences.communicationPreference}
                        onChange={(e) => setPreferences({ ...preferences, communicationPreference: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="chat">Chat</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full">
                      Save Preferences
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 px-4 md:px-6 md:py-8 max-w-5xl mx-auto">
        {/* User Preferences Dialog */}
        <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Welcome! Tell us about yourself</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePreferenceSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="dialog-name" className="text-sm font-medium">
                  Your Name
                </label>
                <Input
                  id="dialog-name"
                  value={preferences.name}
                  onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog-productInterest" className="text-sm font-medium">
                  Product Interest
                </label>
                <Input
                  id="dialog-productInterest"
                  value={preferences.productInterest}
                  onChange={(e) => setPreferences({ ...preferences, productInterest: e.target.value })}
                  placeholder="What products are you interested in?"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog-communicationPreference" className="text-sm font-medium">
                  Preferred Communication
                </label>
                <select
                  id="dialog-communicationPreference"
                  value={preferences.communicationPreference}
                  onChange={(e) => setPreferences({ ...preferences, communicationPreference: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Get Started
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="w-full border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <Bot className="h-5 w-5 text-primary" />
              </span>
              AI Assistant
            </CardTitle>
            <CardDescription>Get personalized help with your questions through text or voice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="h-[400px] overflow-y-auto rounded-lg border bg-card/50 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="space-y-2 max-w-md">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">Welcome to AI Customer Service</h3>
                    <p className="text-sm text-muted-foreground">
                      I'm here to help with your questions. You can type a message or use voice to communicate with me.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: Message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-start gap-3 max-w-[80%]">
                        {message.role !== "user" && (
                          <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/80 border border-border/50"
                          }`}
                        >
                          <div className="prose prose-sm dark:prose-invert">
                            {message.content.split("\n").map((text, i) => (
                              <p key={i} className={i > 0 ? "mt-2" : ""}>
                                {text}
                              </p>
                            ))}
                          </div>
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {preferences.name ? preferences.name[0].toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-3 max-w-[80%]">
                        <Avatar className="h-8 w-8 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg px-4 py-2 bg-muted/80 border border-border/50">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-muted/50">
                <TabsTrigger value="text" className="data-[state=active]:bg-background">
                  Text
                </TabsTrigger>
                <TabsTrigger value="voice" className="data-[state=active]:bg-background">
                  Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Textarea
                    placeholder="Type your message here..."
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1 min-h-[80px] bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 self-end bg-primary hover:bg-primary/90"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="voice" className="mt-4">
                <div className="flex flex-col items-center gap-4 p-6 bg-background/50 rounded-lg border border-border/50">
                  {recordingStatus && (
                    <Badge variant="outline" className="mb-2 animate-pulse">
                      {recordingStatus}
                    </Badge>
                  )}
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoading || isProcessing}
                    >
                      <Mic className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="destructive" className="w-full" disabled={isProcessing}>
                      <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
                    </Button>
                  )}
                  {isProcessing && (
                    <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"></div>
                      <span>Processing your audio...</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/40 pt-4">
            <p className="text-sm text-muted-foreground">Your conversation is private and secure</p>
            {preferences.name && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="h-3 w-3" />
                      {preferences.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Preferences: {preferences.productInterest}, {preferences.communicationPreference}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardFooter>
        </Card>
      </main>
      {process.env.NODE_ENV === "development" && <DebugPanel />}
    </div>
  )
}
