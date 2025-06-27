"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface Match {
  id: number
  type: "singles" | "doubles"
  player1: string
  player2: string
  player3?: string
  player4?: string
  score1: number
  score2: number
  points_to_win: number
  winner?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SSEMessage {
  type: string
  data?: {
    match: Match | null
  }
  timestamp?: number
}

export function useSSE() {
  const [match, setMatch] = useState<Match | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      console.log("Connecting to SSE...")
      eventSourceRef.current = new EventSource("/api/events")

      eventSourceRef.current.onopen = () => {
        console.log("SSE connected successfully")
        setIsConnected(true)
        setIsLoading(false)
        reconnectAttempts.current = 0
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data)

          if (message.type === "match_update") {
            setMatch(message.data?.match || null)
            setIsLoading(false)
          } else if (message.type === "connected") {
            console.log("SSE connection confirmed")
          } else if (message.type === "heartbeat") {
            // Keep connection alive
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error)
        }
      }

      // Chrome fires “error” every time the stream is reset. Treat first
      // error as a reconnect signal, NOT as a fatal error.
      eventSourceRef.current.onerror = () => {
        if (eventSourceRef.current?.readyState === 0) {
          // CLOSED – trigger reconnect
          setIsConnected(false)
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = 1000 * (reconnectAttempts.current + 1)
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++
              connect()
            }, delay)
          } else {
            setIsLoading(false)
          }
        }
      }
    } catch (error) {
      console.error("Error creating SSE connection:", error)
      setIsLoading(false)
    }
  }, [])

  // Fallback to fetch current match if SSE fails
  const fetchCurrentMatch = useCallback(async () => {
    try {
      const response = await fetch("/api/match")
      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
      }
    } catch (error) {
      console.error("Error fetching current match:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    connect()

    // Fallback: if SSE doesn't connect within 5 seconds, fetch manually
    const fallbackTimeout = setTimeout(() => {
      if (!isConnected && isLoading) {
        console.log("SSE connection timeout, falling back to fetch")
        fetchCurrentMatch()
      }
    }, 5000)

    return () => {
      clearTimeout(fallbackTimeout)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [connect, isConnected, isLoading, fetchCurrentMatch])

  return { match, isConnected, isLoading }
}
