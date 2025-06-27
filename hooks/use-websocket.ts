"use client"

import { useEffect, useRef, useState, useCallback } from "react"

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

interface WebSocketMessage {
  type: string
  data: {
    match: Match | null
  }
}

export function useWebSocket() {
  const [match, setMatch] = useState<Match | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      // Use the appropriate WebSocket URL based on environment
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//${window.location.host}/api/ws?upgrade=websocket`

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setIsLoading(false)
        reconnectAttempts.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          if (message.type === "match_update") {
            setMatch(message.data.match)
            setIsLoading(false)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { match, isConnected, isLoading }
}
