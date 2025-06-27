import type { NextRequest } from "next/server"
import { getSql } from "@/lib/db"
import { upgradeWebSocket } from "https://deno.land/std@0.168.0/http/server.ts"

// Store WebSocket connections
const clients = new Set<WebSocket>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 })
  }

  const { socket, response } = upgradeWebSocket(request)

  socket.onopen = () => {
    console.log("WebSocket client connected")
    clients.add(socket)

    // Send current match data to newly connected client
    sendCurrentMatch(socket)
  }

  socket.onclose = () => {
    console.log("WebSocket client disconnected")
    clients.delete(socket)
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
    clients.delete(socket)
  }

  return response
}

async function sendCurrentMatch(socket: WebSocket) {
  try {
    const sql = await getSql()
    const result = await sql`
      SELECT * FROM matches 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const match = result[0] || null
    socket.send(
      JSON.stringify({
        type: "match_update",
        data: { match },
      }),
    )
  } catch (error) {
    console.error("Error sending current match:", error)
  }
}

export function broadcastMatchUpdate(match: any) {
  const message = JSON.stringify({
    type: "match_update",
    data: { match },
  })

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        console.error("Error sending to client:", error)
        clients.delete(client)
      }
    } else {
      clients.delete(client)
    }
  })
}
