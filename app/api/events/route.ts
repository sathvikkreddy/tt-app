import type { NextRequest } from "next/server"
import { getSql } from "@/lib/db"

// Store SSE connections
const clients = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log("New SSE client connected")
      clients.add(controller)

      // Tell browser to retry after 3 s if the socket closes
      controller.enqueue(`retry: 3000\n`)
      // Initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

      // Send current match data after a small delay to ensure connection is stable
      setTimeout(() => {
        if (clients.has(controller)) {
          sendCurrentMatch(controller)
        }
      }, 100)

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          // Check if controller is still open
          if (!controller.desiredSize && controller.desiredSize !== 0) {
            clearInterval(heartbeat)
            clients.delete(controller)
            return
          }
          // ":" = comment → ignored by browser but keeps the stream alive
          controller.enqueue(`:\n`)
        } catch (error) {
          console.log("Heartbeat failed, cleaning up:", error.message)
          clearInterval(heartbeat)
          clients.delete(controller)
        }
      }, 15000)

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        console.log("SSE client disconnected")
        clearInterval(heartbeat)
        clients.delete(controller)
        try {
          controller.close()
        } catch (error) {
          // Connection already closed
        }
      })
    },
  })

  // Return response with proper SSE headers (disable buffering!)
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // TURN OFF nginx / Fastly / Vercel buffering
      "X-Accel-Buffering": "no",
      // CORS (optional – keeps it simple for local preview)
      "Access-Control-Allow-Origin": "*",
    },
  })
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  })
}

async function sendCurrentMatch(controller: ReadableStreamDefaultController) {
  try {
    // Check if controller is still open before sending
    if (!controller.desiredSize && controller.desiredSize !== 0) {
      console.log("Controller is closed, skipping send")
      return
    }

    const sql = await getSql()
    const result = await sql`
      SELECT * FROM matches 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const match = result[0] || null
    const data = JSON.stringify({
      type: "match_update",
      data: { match },
    })

    // Double-check controller is still open before enqueuing
    try {
      controller.enqueue(`data: ${data}\n\n`)
    } catch (enqueueError) {
      console.log("Failed to enqueue data, controller likely closed:", enqueueError.message)
      // Remove this controller from clients set
      clients.delete(controller)
    }
  } catch (error) {
    console.error("Error sending current match:", error)
  }
}

export function broadcastMatchUpdate(match: any) {
  const data = JSON.stringify({
    type: "match_update",
    data: { match },
  })

  const message = `data: ${data}\n\n`

  console.log(`Broadcasting to ${clients.size} clients:`, { match: match?.id || "null" })

  // Create array from clients to avoid modification during iteration
  const clientsArray = Array.from(clients)

  clientsArray.forEach((controller) => {
    try {
      // Check if controller is still open
      if (!controller.desiredSize && controller.desiredSize !== 0) {
        clients.delete(controller)
        return
      }

      controller.enqueue(message)
    } catch (error) {
      console.error("Error sending to client:", error.message)
      clients.delete(controller)
    }
  })
}
