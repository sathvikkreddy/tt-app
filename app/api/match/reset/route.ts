import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function POST() {
  const sql = await getSql()
  try {
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

    // Reset scores to 0
    const updatedResult = await sql`
      UPDATE matches 
      SET score1 = 0, score2 = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${match.id} AND is_active = true
      RETURNING *
    `

    if (updatedResult.length === 0) {
      return NextResponse.json({ error: "Failed to reset match" }, { status: 400 })
    }

    return NextResponse.json({ match: updatedResult[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to reset match" }, { status: 500 })
  }
}
