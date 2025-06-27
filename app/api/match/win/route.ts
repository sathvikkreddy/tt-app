import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function POST(request: NextRequest) {
  const sql = await getSql()
  try {
    const body = await request.json()
    const { winner } = body

    if (![1, 2].includes(winner)) {
      return NextResponse.json({ error: "Winner must be 1 or 2" }, { status: 400 })
    }

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

    // Verify win condition
    const score1 = match.score1
    const score2 = match.score2
    const pointsToWin = match.points_to_win
    const minScore = Math.min(score1, score2)
    const maxScore = Math.max(score1, score2)

    if (maxScore < pointsToWin || maxScore - minScore < 2) {
      return NextResponse.json({ error: "Win condition not met" }, { status: 400 })
    }

    const actualWinner = score1 > score2 ? 1 : 2
    if (actualWinner !== winner) {
      return NextResponse.json({ error: "Winner does not match current scores" }, { status: 400 })
    }

    // Update match with winner and set as inactive
    const updatedResult = await sql`
      UPDATE matches 
      SET winner = ${winner}, is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${match.id}
      RETURNING *
    `

    if (updatedResult.length === 0) {
      return NextResponse.json({ error: "Failed to update match" }, { status: 400 })
    }

    return NextResponse.json({ match: updatedResult[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to confirm win" }, { status: 500 })
  }
}
