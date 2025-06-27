import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function GET() {
  const sql = await getSql()
  try {
    const result = await sql`
      SELECT * FROM matches 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const match = result[0] || null
    return NextResponse.json({ match })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sql = await getSql()
  try {
    const body = await request.json()
    const { type, player1, player2, player3, player4, points_to_win = 11 } = body

    // Check if there's already an active match
    const existingMatch = await sql`
      SELECT id FROM matches 
      WHERE is_active = true 
      LIMIT 1
    `

    if (existingMatch.length > 0) {
      return NextResponse.json(
        {
          error: "There is already an active match. Please end the current match before starting a new one.",
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!player1 || !player2) {
      return NextResponse.json({ error: "Player names are required" }, { status: 400 })
    }

    if (type === "doubles" && (!player3 || !player4)) {
      return NextResponse.json({ error: "All player names are required for doubles match" }, { status: 400 })
    }

    if (![11, 21].includes(points_to_win)) {
      return NextResponse.json({ error: "Points to win must be 11 or 21" }, { status: 400 })
    }

    // Create new match
    const result = await sql`
      INSERT INTO matches (type, player1, player2, player3, player4, score1, score2, points_to_win, is_active)
      VALUES (${type}, ${player1}, ${player2}, ${player3 || null}, ${player4 || null}, 0, 0, ${points_to_win}, true)
      RETURNING *
    `

    const match = result[0]
    return NextResponse.json({ match })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
  }
}
