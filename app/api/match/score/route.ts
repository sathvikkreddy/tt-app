import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"

// Import the broadcast function
async function broadcastMatchUpdate(match: any) {
  try {
    const { broadcastMatchUpdate: broadcast } = await import("../../events/route")
    broadcast(match)
  } catch (error) {
    console.error("Error broadcasting match update:", error)
  }
}

export async function POST(request: NextRequest) {
  const sql = await getSql()
  try {
    const body = await request.json()
    const { team, increment } = body

    // Get the current active match
    const matchResult = await sql`
      SELECT * FROM matches 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (matchResult.length === 0) {
      return NextResponse.json({ error: "No active match found" }, { status: 400 })
    }

    const match = matchResult[0]
    let newScore1 = match.score1
    let newScore2 = match.score2

    // Update score based on team and increment/decrement
    if (team === 1) {
      newScore1 = increment ? match.score1 + 1 : Math.max(0, match.score1 - 1)
    } else if (team === 2) {
      newScore2 = increment ? match.score2 + 1 : Math.max(0, match.score2 - 1)
    } else {
      return NextResponse.json({ error: "Invalid team number" }, { status: 400 })
    }

    // Update the match in database
    const updatedResult = await sql`
      UPDATE matches 
      SET score1 = ${newScore1}, score2 = ${newScore2}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${match.id} AND is_active = true
      RETURNING *
    `

    if (updatedResult.length === 0) {
      return NextResponse.json({ error: "Failed to update match" }, { status: 400 })
    }

    const updatedMatch = updatedResult[0]

    // Broadcast the update to all connected clients
    await broadcastMatchUpdate(updatedMatch)

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 })
  }
}
